const express = require("express");
const canSearchAllStores = require("../middleware/canSearchAllStores");
const canSearchByStore = require("../middleware/canSearchByStore");
const canSearchPersonal = require("../middleware/canSearchPersonal");
const isAuth = require("../middleware/isAuth");
const { postSearchAllStores, postSearchByStore, postSearchPersonal, getSearchDetail, getTimerOrdersSearchDetail, getDeletedOrdersSearchDetail } = require("../controllers/search");


const router = express.Router();

router.get('/user/search-all-stores/:searchPhone', canSearchAllStores, postSearchAllStores);
router.get('/user/search-by-store/:searchPhone', canSearchByStore, postSearchByStore);
router.get('/user/search-personal/:searchPhone', canSearchPersonal, postSearchPersonal);
router.get('/user/search/detail/:orderId', isAuth, getSearchDetail);
router.get('/user/search/timer-detail/:orderId', isAuth, getTimerOrdersSearchDetail);
router.get('/user/search/deleted-detail/:orderId', isAuth, getDeletedOrdersSearchDetail);


module.exports = router;