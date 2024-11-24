const express = require("express");
const { getUser, postEditUser, changePassword, forgotPassword, getNotes, postNote, deleteNote, getPersonalStatistics, getTimerOrdersByStore, deleteTimerOrder, getUserStatisticsByStore, updateTimerOrder, getNearestTimerOrdersByStore } = require("../controllers/user");
const isAuth = require("../middleware/isAuth");
const canSeePersonalStatistics = require("../middleware/canSeePersonalStatistics");
const canSeeStatisticsByStore = require("../middleware/canSeeStatisticsByStore");
const { uploadDisk } = require("../utils/multer");

const router = express.Router();

router.get('/user/schedule/store/:storeId', isAuth, getTimerOrdersByStore);
router.get('/user/nearest-schedule/store/:storeId', isAuth, getNearestTimerOrdersByStore);
router.put('/user/update-schedule', isAuth, uploadDisk.single('image'), updateTimerOrder)
router.delete('/user/delete-schedule', isAuth, deleteTimerOrder);
router.get('/user/notes', isAuth, getNotes);
router.post('/user/add-note', isAuth, postNote);
router.delete('/user/delete-note', isAuth, deleteNote);
router.get('/user/statistics', canSeePersonalStatistics, getPersonalStatistics);
router.get('/users/store/statistics', canSeeStatisticsByStore, getUserStatisticsByStore);
router.get('/user/:userId', isAuth, getUser);
router.put('/user/:userId', isAuth, postEditUser);
router.post('/user/change-password', isAuth, changePassword);
router.post('/user/forgot-password', forgotPassword);

module.exports = router;