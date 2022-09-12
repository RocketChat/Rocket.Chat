let notifyManager;module.link('../core',{notifyManager(v){notifyManager=v}},0);let unstable_batchedUpdates;module.link('./reactBatchedUpdates',{unstable_batchedUpdates(v){unstable_batchedUpdates=v}},1);

notifyManager.setBatchNotifyFunction(unstable_batchedUpdates);