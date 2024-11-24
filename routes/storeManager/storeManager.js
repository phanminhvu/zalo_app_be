const express = require("express");
const isStoreManager = require("../../middleware/isStoreManager");
const isLoggedIn = require("../../middleware/isAuth");
const canSeeStatisticsByStore = require("../../middleware/canSeeStatisticsByStore");
const canManageGuestOrder = require("../../middleware/canManageGuestOrder");
const canUpdateTransferInfo = require("../../middleware/canUpdateTransferInfo");
const { getUsers, postSignupUser, deleteUser, getUserById, getRoles, putEditUser, getTagsByStore, getStatisticsByStore, postStatisticsCompareByStore, postStatisticsGrowByStore, getStatisticsByStoreToday, getUsersIncludeSM, getGuestOrders, deleteGuestOrders, getGuestOrdersQuantity, getTransferOrderStatisticsByStore, approveGuestOrders, getRemainingConfirm, putEditStore, getStoreById, getScheduleOrderQuantity } = require("../../controllers/storeManager/storeManager");
const { check } = require("express-validator");
const User = require("../../models/user");

const router = express.Router();

router.get('/storeManager/guest-order', canManageGuestOrder, getGuestOrders);
router.get('/storeManager/guest-order/quantity', isLoggedIn, getGuestOrdersQuantity);
router.get('/storeManager/confirm-order/quantity', isLoggedIn, getRemainingConfirm);
router.get('/storeManager/schedule-order/quantity', isLoggedIn, getScheduleOrderQuantity);
router.put('/storeManager/guest-order/approve', canManageGuestOrder, approveGuestOrders);
router.put('/storeManager/guest-order/delete', canManageGuestOrder, deleteGuestOrders);
router.put('/storeManager/transfer-info/:storeId', canUpdateTransferInfo, putEditStore);
router.get('/storeManager/transfer-info/:storeId', canUpdateTransferInfo, getStoreById);
router.get('/storeManager/roles', isStoreManager, getRoles);
router.get('/storeManager/users', isStoreManager, getUsers);
router.get('/storeManager/users-with-sm', isLoggedIn, getUsersIncludeSM);
router.get('/storeManager/user/:userId', isStoreManager, getUserById);
router.get('/storeManager/tags/:storeId', isLoggedIn, getTagsByStore);
router.get('/store-manager/statistics/store', canSeeStatisticsByStore, getStatisticsByStore);
router.post('/store-manager/statistics/transfer-order', canSeeStatisticsByStore, getTransferOrderStatisticsByStore);
router.get('/store-manager/statistics/store/today', canSeeStatisticsByStore, getStatisticsByStoreToday);
router.post('/store-manager/statistics/compare', canSeeStatisticsByStore, postStatisticsCompareByStore);
router.post('/store-manager/statistics/grow', canSeeStatisticsByStore, postStatisticsGrowByStore);
router.post('/storeManager/signup-user',

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
  ], isStoreManager, postSignupUser);
router.put('/storeManager/edit-user/:userId', isStoreManager, putEditUser);
router.delete('/storeManager/delete-user', isStoreManager, deleteUser);

module.exports = router;