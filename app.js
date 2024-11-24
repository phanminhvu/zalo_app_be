const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const schedule = require('node-schedule');
const TimerOrder = require('./models/timerOrder');
const https = require("https");
const fs = require('fs');
const path = require('path');
const notification = require('./services/notification')
const Order = require('./models/order');
const syncWebOrder = require('./utils/syncWebOrder')

dotenv.config();


const app = express();
// const allowedOrigins = ["https://h5.zdn.vn", "zbrowser://h5.zdn.vn"];
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   const allowedCors = allowedOrigins.some((element) =>
//     origin.startsWith(element)
//   );
//   if (allowedCors) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   }
//   return next();
// });
app.use(
  cors({
    origin: ["http://localhost:3000", "https://quequan.vn", "https://h5.zdn.vn", "zbrowser://h5.zdn.vn"],
    methods: ["POST", "PUT", "GET", "DELETE", "OPTIONS", "HEAD"],
    credentials: true,
  })
);
app.use(cookieParser());

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(notification.init);

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const notificationRoutes = require("./routes/notification");
const orderRoutes = require("./routes/order");
const searchRoutes = require("./routes/search");
const productRoutes = require("./routes/product");
const stockRoutes = require('./routes/stock');
const adminRoutes = require("./routes/admin/admin");
const directorRoutes = require("./routes/director/director");
const storeManagerRoutes = require("./routes/storeManager/storeManager");
const customerRoute = require("./routes/customer/customer");
const shippingServiceRoutes = require("./routes/shippingService");

app.use(authRoutes);
app.use(userRoutes);
app.use(notificationRoutes);
app.use(orderRoutes);
app.use(searchRoutes);
app.use(productRoutes);
app.use(stockRoutes);
app.use(adminRoutes);
app.use(directorRoutes);
app.use(storeManagerRoutes);
app.use(customerRoute);
app.use(shippingServiceRoutes);

const { postCreateOrder, postEndProduceOrder, postStartShipOrder, postEndShipOrder, deleteCreateOrder, updateOrder, deleteProduceOrder, deleteShipOrder, waitConfirmSellExport, waitConfirmDeleteOrder } = require("./controllers/order");
const { postCreateTag } = require("./controllers/tag");
const { verifyUpdateTagSocket, verifyStartProduceOrder, verifyEndProduceOrder, verifyStartShipOrder, verifyEndShipOrder, verifyEndOtherProduceOrder, verifyEndOtherShipOrder, verifyDeleteCreateOrder, verifyConfirmDeleteOrder } = require("./middleware/isSocket");

const restartCreateTimerOrder = async () => {
  const allTimerOrder = await TimerOrder.find({ status: 'pending' });
  allTimerOrder.forEach(order => {
    const { hours, minutes, second, date, month, year } = order.timer;
    const rule = new schedule.RecurrenceRule();
    rule.second = second;
    rule.minute = minutes;
    rule.hour = hours;
    rule.date = date;
    rule.month = month - 1;
    rule.year = year;
    rule.tz = "Asia/Saigon"
    schedule.scheduleJob(order.jobName, rule, async function () {
      await postCreateOrder(order.createOrderData);
      await TimerOrder.findByIdAndUpdate(order._id, { status: 'approved' });
      const currentJob = schedule.scheduledJobs[order.jobName];
      currentJob?.cancel();
    });
  })
}

const syncWebOrderSchedule = async () => {
  const rule = new schedule.RecurrenceRule();
  rule.minute = new schedule.Range(0, 59, 1)

  schedule.scheduleJob(rule, async () =>{
    await syncWebOrder();
  })

}

const cert = {
  key: fs.readFileSync('./ssl/priv.key'),
  cert: fs.readFileSync('./ssl/cert.crt'),
  ca: fs.readFileSync('./ssl/cabundle.crt')
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    const server = https.createServer(cert, app).listen(PORT, () => {
      restartCreateTimerOrder();
      console.log('Connect to mongodb');
      syncWebOrderSchedule();
    });

    // const server = app.listen(PORT, async () => {
    //   restartCreateTimerOrder();
    //   console.log('Connect to mongodb');
    // });

    const io = require("./socket").init(server);
    io.on("connection", async (socket) => {
      socket.on('delete-create-order', async (data) => {
        const checkAuth = verifyDeleteCreateOrder(data.accessToken);
        if (checkAuth) {
          await deleteCreateOrder(data);
        }
      });
      socket.on('delete-produce-order', async (data) => {
        const checkAuth = verifyConfirmDeleteOrder(data.accessToken);
        if (checkAuth) {
          await deleteProduceOrder(data);
        }
      });
      socket.on('delete-ship-order', async (data) => {
        const checkAuth = verifyConfirmDeleteOrder(data.accessToken);
        if (checkAuth) {
          await deleteShipOrder(data);
        }
      });
      socket.on("wait-confirm-delete-order", async data => {
        const checkAuth = verifyDeleteCreateOrder(data.accessToken);
        if (checkAuth) {
          await waitConfirmDeleteOrder(data);
        }
      });
      socket.on('wait-confirm-sell-export', async data => {
        const checkAuth = verifyStartProduceOrder(data.accessToken);
        if (checkAuth) {
          await waitConfirmSellExport(data);
        }
      });
      socket.on('post-end-produce-order', async (data) => {
        const checkAuth = verifyEndProduceOrder(data.accessToken);
        if (checkAuth) {
          await postEndProduceOrder(data);
        }
      });
      socket.on('post-end-other-produce-order', async (data) => {
        const checkAuth = verifyEndOtherProduceOrder(data.accessToken);
        if (checkAuth) {
          await postEndProduceOrder(data);
        }
      });
      socket.on('post-start-ship-order', async (data) => {
        const checkAuth = verifyStartShipOrder(data.accessToken);
        if (checkAuth) {
          await postStartShipOrder(data);
        }
      });
      socket.on('post-end-ship-order', async (data) => {
        const checkAuth = verifyEndShipOrder(data.accessToken);
        if (checkAuth) {
          await postEndShipOrder(data);
        }
      });
      socket.on('post-end-other-ship-order', async (data) => {
        const checkAuth = verifyEndOtherShipOrder(data.accessToken);
        if (checkAuth) {
          await postEndShipOrder(data);
        }
      });
      socket.on('post-create-tag', async (data) => {
        const checkAuth = verifyUpdateTagSocket(data.accessToken);
        if (checkAuth) {
          await postCreateTag(data);
        }
      });
    });

  })
  .catch((err) => {
    console.log(err);
  });

  // if(isMainThread){
  //   const worker = new Worker(__filename);
  
  //   worker.on('message', (msg) => {
  //     if(msg === 'start'){
  //       console.log('Worker started running sync Web Order.')
  //     }
  //   })
  //   setInterval(() => {
  //     worker.postMessage('start');
  //   },10000);
  // } else {
  //   parentPort.on('message', (msg) => {
  //     if(msg === 'start') {
  //       syncWebOrder();
  //     }
  //   })
  // }