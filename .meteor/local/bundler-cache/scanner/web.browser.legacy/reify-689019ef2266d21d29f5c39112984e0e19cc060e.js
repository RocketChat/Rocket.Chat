"use strict";

var _core = require("../core");

var _reactBatchedUpdates = require("./reactBatchedUpdates");

_core.notifyManager.setBatchNotifyFunction(_reactBatchedUpdates.unstable_batchedUpdates);