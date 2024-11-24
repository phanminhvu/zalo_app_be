const express = require("express");
const canManageStock = require("../middleware/canManageStock");
const canManageStockByStore = require("../middleware/canManageStockByStore");
const canSeeStockForecast = require("../middleware/canSeeStockForecast")
const { importStock, getInventory, getImportExportHistory, getInventoryByStore, postRequestStockByStore, getRequestStockByStore, deleteRequest, getAllRequestStock, approveRequest, getImportExportHistoryByStore, confirmRequest, completeRequest, forecastStock, deleteRequestFromStore, getImportExportHistoryByStoreByDate, getImportExportBillByStore, billingOrder, getBillList, getBillDetail, cancelBill, saveBill } = require("../controllers/product");
const { uploadDisk } = require("../utils/multer");

const router = express.Router();

router.post('/import-stock', canManageStock, importStock);
router.get('/stock/inventory', canManageStock, getInventory);
router.get('/stock/history', canManageStock, getImportExportHistory);
router.get('/stock/bill/:storeId', canManageStock, getImportExportBillByStore);
router.get('/stock/bill-list/:storeId', canManageStock, getBillList);
router.get('/stock/bill-detail/:billCode', canManageStock, getBillDetail);
router.put('/stock/cancel-bill/:orderId', canManageStock, cancelBill);
router.put('/stock/save-bill/:billCode', canManageStock, uploadDisk.array('image'), saveBill);
router.get('/stock/history/:storeId', canManageStockByStore, getImportExportHistoryByStore);
router.post('/stock/history-by-date/:storeId', canManageStockByStore, getImportExportHistoryByStoreByDate);
router.post('/admin/stock/history-by-date/:storeId', canManageStock, getImportExportHistoryByStoreByDate);
router.get('/requests', canManageStock, getAllRequestStock);
router.delete('/delete-request', canManageStock, deleteRequest);
router.put('/approve-request', canManageStock, uploadDisk.array('image'), approveRequest);
router.put('/confirm-request', canManageStock, confirmRequest);
router.put('/billing-order/', canManageStock, billingOrder);
router.get('/stock/forecast', canSeeStockForecast, forecastStock);

router.get('/stock/inventory/:storeId', canManageStockByStore, getInventoryByStore);
router.get('/confirm-stock/inventory/:storeId', canManageStockByStore, getInventoryByStore);
router.post('/request-stock/:storeId', canManageStockByStore, postRequestStockByStore);
router.get('/requests/:storeId', canManageStockByStore, getRequestStockByStore);
router.delete('/store-delete-request', canManageStockByStore, deleteRequestFromStore);
router.get('/confirm-requests/:storeId', canManageStockByStore, getRequestStockByStore);
router.put('/complete-request/:storeId', canManageStockByStore, uploadDisk.array('image'), completeRequest);


module.exports = router;