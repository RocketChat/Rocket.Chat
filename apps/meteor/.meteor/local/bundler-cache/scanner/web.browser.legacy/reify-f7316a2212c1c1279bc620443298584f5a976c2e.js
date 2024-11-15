'use strict';

var queryCore = require('@tanstack/query-core');
var reactBatchedUpdates = require('./reactBatchedUpdates');

queryCore.notifyManager.setBatchNotifyFunction(reactBatchedUpdates.unstable_batchedUpdates);
//# sourceMappingURL=setBatchUpdatesFn.js.map
