const express = require("express");
const isAuth = require("../../middleware/isAdminDirector");
const canCreateTag = require("../../middleware/canCreateTag");
const isAdminAuth = require("../../middleware/isAdmin");
const canSeeAllStoreList = require("../../middleware/canSeeAllStoreList");
const canSeeAllStoresStatistics = require("../../middleware/canSeeAllStoresStatistics");
const canManageAllGuestOrder = require("../../middleware/canManageAllGuestOrder");
const { check } = require("express-validator");
const User = require('../../models/user');
const { postSignupUser, getStores, getStoreManagers, getUserById, putEditUser, deleteUser, getRoleById, getStoreById, postSignupStore, putEditStore, deleteStore, getOrdersByStore, getCreateOrderByStore, getProduceOrderByStore, getShipOrderByStore, getSuccessOrderByStore, getOrdersQuantityByStore, getOrdersWeightByStore, getTagsByStore, postTag, deleteTag, getStatisticsByStore, getStatisticsAllStore, postStatisticsCompareAllStore, postStatisticsCompareByStore, postStatisticsGrowByStore, getStatisticsTodayByStore, getPersonalStatistics, getUserStatisticsByStore, getGuestOrderByStore, deleteGuestOrderByStore, getAllGuestOrdersQuantity, approveGuestOrderByStore, updateTag } = require("../../controllers/admin-director/admin-director");
const { getRoles, editRole, postRole, deleteRoleById } = require("../../controllers/admin/role");
const { getUsers, getAdminAccount } = require("../../controllers/admin/user");
const { getActions } = require("../../controllers/admin/action");
const isLoggedIn = require("../../middleware/isAuth");

const router = express.Router();
router.get('/admin/user/store/:storeId', isAdminAuth, getUsers);
router.get('/admin-account', isAuth, getAdminAccount);
router.get('/admin/actions', isAdminAuth, getActions);
router.get('/admin/roles', isAdminAuth, getRoles);
router.get('/admin/stores', canSeeAllStoreList, getStores);
router.get('/admin/orders/store/:storeId', isAuth, getOrdersByStore);
router.get('/admin/create-orders/store/:storeId', isAuth, getCreateOrderByStore);
router.get('/admin/produce-orders/store/:storeId', isAuth, getProduceOrderByStore);
router.get('/admin/ship-orders/store/:storeId', isAuth, getShipOrderByStore);
router.get('/admin/success-orders/store/:storeId', isAuth, getSuccessOrderByStore);
router.get('/admin/orders-quantity/store/:storeId', isAuth, getOrdersQuantityByStore);
router.get('/admin/orders-weight/store/:storeId', isAuth, getOrdersWeightByStore);

router.get('/admin/store/:storeId', isAuth, getStoreById);
router.post('/admin/signup-store', isAuth, postSignupStore);
router.put('/admin/edit-store/:storeId', isAuth, putEditStore);
router.delete('/admin/delete-store', isAuth, deleteStore);

router.get('/admin/storesManager', isAuth, getStoreManagers);
router.get('/admin/user/:userId', isAuth, getUserById);
router.put('/admin/edit-user/:userId', isAuth, putEditUser);
router.delete('/admin/delete-user', isAuth, deleteUser);

router.get('/admin/role/:roleId', isAdminAuth, getRoleById);
router.delete('/admin/delete-role', isAdminAuth, deleteRoleById);
router.post('/admin/post-role', isAdminAuth, postRole)
router.put('/admin/edit-role/:roleId', isAdminAuth, editRole);

router.get('/admin/tags/:storeId', canCreateTag, getTagsByStore);
router.post('/admin/add-tag', canCreateTag, postTag);
router.delete('/admin/delete-tag', canCreateTag, deleteTag);
router.put('/admin/update-tag', canCreateTag, updateTag);


router.post(
  "/admin/signup-user",
  [
    check("name").isString().withMessage("Please enter user name").trim(),
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .custom(async (value) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "Email đã có người sử dụng"
            );
          }
        });
      })
      .normalizeEmail({ gmail_remove_dots: false })
  ],
  isAuth, postSignupUser
);

router.get('/admin/guest-order/quantity', isLoggedIn, getAllGuestOrdersQuantity);
router.put('/admin/guest-order/approve', canManageAllGuestOrder, approveGuestOrderByStore);
router.put('/admin/guest-order/delete', canManageAllGuestOrder, deleteGuestOrderByStore);
router.get('/admin/statistics/stores', canSeeAllStoresStatistics, getStatisticsAllStore);
router.get('/admin/statistics/store/today/:storeId', canSeeAllStoresStatistics, getStatisticsTodayByStore);
router.post('/admin/statistics/compare-stores', canSeeAllStoresStatistics, postStatisticsCompareAllStore);
router.get('/admin/statistics/:storeId', canSeeAllStoresStatistics, getStatisticsByStore);
router.post('/admin/statistics/compare/:storeId', canSeeAllStoresStatistics, postStatisticsCompareByStore);
router.post('/admin/statistics/grow/:storeId', canSeeAllStoresStatistics, postStatisticsGrowByStore);
router.get('/admin/users/store/statistics/:storeId', canSeeAllStoresStatistics, getUserStatisticsByStore);
router.get('/admin/guest-order/:storeId', canManageAllGuestOrder, getGuestOrderByStore);

module.exports = router;