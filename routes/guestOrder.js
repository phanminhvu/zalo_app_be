const isAuth = require("../middleware/isAuth");

const express = require('express');
const {
    addGuestOrder,
    editGuestOrder,
    deleteGuestOrder,
    listGuestOrders,
    addManyGuestOrders,
    deleteManyGuestOrders
} = require('../controllers/guestOrder');

const router = express.Router();

router.post('/guestorders',isAuth, addGuestOrder);
router.put('/guestorders/:id',isAuth, editGuestOrder);
router.delete('/guestorders/:id',isAuth, deleteGuestOrder);
router.get('/guestorders',isAuth, listGuestOrders);
router.post('/guestorders/many',isAuth, addManyGuestOrders);
router.delete('/guestorders/many',isAuth, deleteManyGuestOrders);

module.exports = router;
