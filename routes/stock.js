const router = require('express').Router();
const { getMainStockParams, editMainStockParams, getSubStockParams, editSubStockParams, freshExport, reImportFresh, getAllStockHistory, grill, getConfirmReImportFresh, confirmReImportFresh, getConfirmSellExportStock, confirmSellExportStock, getConfirmReImportCookedStock, confirmReImportCookedStock, checkFreshStock, checkProductStock, getConfirmCheckProductStock, confirmCheckProductStock, getConfirmCheckFreshStock, confirmCheckFreshStock, cancelReImportFresh, cancelCheckFreshStock, cancelCheckProductStock, getFreshStockHistory, getProductStockHistory, getViewStockHistory, getStockStatisticsByStore, getCheckFreshStockHistory, getCheckProductStockHistory, editCheckFreshStock, editCheckProductStock } = require('../controllers/stock');
const canManageStock = require("../middleware/canManageStock");
const canManageStockByStore = require("../middleware/canManageStockByStore");
const isAuth = require("../middleware/isAuth");
const canConfirmSellExport = require("../middleware/canConfirmSellExport");
const canConfirmReImportFresh = require("../middleware/canConfirmReImportFresh");
const canConfirmReImportCooked = require("../middleware/canConfirmReImportCooked");
const canConfirmCheckStock = require("../middleware/canConfirmCheckStock");
const canViewStockHistory = require("../middleware/canViewStockHistory");
const canSeeAllStoresStockStatistics = require("../middleware/canSeeAllStoresStockStatistics");
const canSeeStockStatisticsByStore = require("../middleware/canSeeStockStatisticsByStore");
const { undoDeleteOrder, undoPendingProduceOrder } = require('../controllers/order');
const { uploadDisk } = require('../utils/multer');


router.get('/main-stock', canManageStock, getMainStockParams);
router.put('/main-stock/edit', canManageStock, editMainStockParams);

router.get('/sub-stock/:storeId', isAuth, getSubStockParams);
router.get('/confirm-sub-stock/:storeId', canManageStockByStore, getSubStockParams);
router.put('/sub-stock/edit/:storeId', canManageStockByStore, editSubStockParams);
router.put('/sub-stock/fresh-export/:storeId', canManageStockByStore, uploadDisk.array('image'), freshExport);
router.put('/sub-stock/re-import-fresh/:storeId', canManageStockByStore, uploadDisk.array('image'), reImportFresh);
router.put('/sub-stock/grill/:storeId', canManageStockByStore, grill);
router.get('/sub-stock/fresh-history/:storeId', canManageStockByStore, getFreshStockHistory);
router.get('/sub-stock/product-history/:storeId', canManageStockByStore, getProductStockHistory);
router.post('/sub-stock/check-fresh/:storeId', canManageStockByStore, uploadDisk.array('image'), checkFreshStock);
router.put('/sub-stock/edit-check-fresh', canManageStockByStore, editCheckFreshStock);
router.put('/sub-stock/edit-check-product', canManageStockByStore, editCheckProductStock);
router.post('/sub-stock/check-product/:storeId', canManageStockByStore, uploadDisk.array('image'), checkProductStock);
router.get('/sub-stock/all-history/:storeId', canManageStockByStore, getAllStockHistory);
router.get('/sub-stock/view-stock-history/:storeId', canViewStockHistory, getViewStockHistory);

//Duyệt đơn
router.get('/sub-stock/confirm-sell-export-stock/:storeId', canConfirmSellExport, getConfirmSellExportStock);
router.put('/sub-stock/confirm-sell-export-stock/:storeId', canConfirmSellExport, confirmSellExportStock);
router.get('/sub-stock/confirm-reimport-fresh/:storeId', canConfirmReImportFresh, getConfirmReImportFresh);
router.put('/sub-stock/confirm-reimport-fresh/:storeId', canConfirmReImportFresh, confirmReImportFresh);
router.get('/sub-stock/confirm-reimport-cooked-stock/:storeId', canConfirmReImportCooked, getConfirmReImportCookedStock);
router.put('/sub-stock/confirm-reimport-cooked-stock/:storeId', canConfirmReImportCooked, uploadDisk.array('image'), confirmReImportCookedStock);
router.get('/sub-stock/confirm-check-product-stock/:storeId', canConfirmCheckStock, getConfirmCheckProductStock);
router.put('/sub-stock/confirm-check-product-stock/:storeId', canConfirmCheckStock, confirmCheckProductStock);
router.get('/sub-stock/confirm-check-fresh-stock/:storeId', canConfirmCheckStock, getConfirmCheckFreshStock);
router.get('/sub-stock/check-fresh-stock/:storeId', canManageStockByStore, getConfirmCheckFreshStock);
router.get('/sub-stock/check-product-stock/:storeId', canManageStockByStore, getConfirmCheckProductStock);
router.put('/sub-stock/confirm-check-fresh-stock/:storeId', canConfirmCheckStock, confirmCheckFreshStock);

//Hoàn tác
router.put('/sub-stock/undo-delete-order/:storeId', canConfirmReImportCooked, undoDeleteOrder);
router.put('/sub-stock/undo-pending-produce-order/:storeId', canConfirmSellExport, undoPendingProduceOrder);
router.put('/sub-stock/cancel-reimport-fresh/:storeId', canConfirmReImportFresh, cancelReImportFresh);
router.put('/sub-stock/cancel-check-fresh-stock/:storeId', canConfirmCheckStock, cancelCheckFreshStock);
router.put('/sub-stock/cancel-check-product-stock/:storeId', canConfirmCheckStock, cancelCheckProductStock);

//Thống kê
router.post('/admin/sub-stock/statistics/:storeId', canSeeAllStoresStockStatistics, getStockStatisticsByStore);
router.post('/sub-stock/statistics/:storeId', canSeeStockStatisticsByStore, getStockStatisticsByStore);
router.post('/sub-stock/check-fresh-stock-history/:storeId', canSeeStockStatisticsByStore, getCheckFreshStockHistory);
router.post('/sub-stock/check-product-stock-history/:storeId', canSeeStockStatisticsByStore, getCheckProductStockHistory);

module.exports = router;
