let notifyManager;module.link('@tanstack/query-core',{notifyManager(v){notifyManager=v}},0);let unstable_batchedUpdates;module.link('./reactBatchedUpdates.esm.js',{unstable_batchedUpdates(v){unstable_batchedUpdates=v}},1);


notifyManager.setBatchNotifyFunction(unstable_batchedUpdates);
//# sourceMappingURL=setBatchUpdatesFn.esm.js.map
