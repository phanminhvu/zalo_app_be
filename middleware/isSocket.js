const jwt = require("jsonwebtoken");


exports.verifyUpdateTagSocket = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('updateTag')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyCreateOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('createOrder')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyUpdateOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('updateOrder')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyDeleteCreateOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('deleteOrder')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyConfirmDeleteOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('confirmReImportCooked')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyConfirmSellExport = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('confirmSellExport')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyConfirmSellExport = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('confirmSellExport')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyStartProduceOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('receiveProduce')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyEndProduceOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('completeProduce')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyEndOtherProduceOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('completeOtherProduce')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyStartShipOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('receiveDelivery')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyEndShipOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('completeDelivery')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}

exports.verifyEndOtherShipOrder = (accessToken) => {
  let checkAuth = false
  jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
    if (user?.permission?.includes('completeOtherDelivery')) {
      checkAuth = true;
    }
  });
  return checkAuth;
}