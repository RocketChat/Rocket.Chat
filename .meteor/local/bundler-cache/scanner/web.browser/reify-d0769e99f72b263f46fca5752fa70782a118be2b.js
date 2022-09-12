module.export({broadcastActiveObservations:()=>broadcastActiveObservations});let resizeObservers;module.link('../utils/resizeObservers',{resizeObservers(v){resizeObservers=v}},0);let ResizeObserverEntry;module.link('../ResizeObserverEntry',{ResizeObserverEntry(v){ResizeObserverEntry=v}},1);let calculateDepthForNode;module.link('./calculateDepthForNode',{calculateDepthForNode(v){calculateDepthForNode=v}},2);let calculateBoxSize;module.link('./calculateBoxSize',{calculateBoxSize(v){calculateBoxSize=v}},3);



var broadcastActiveObservations = function () {
    var shallowestDepth = Infinity;
    var callbacks = [];
    resizeObservers.forEach(function processObserver(ro) {
        if (ro.activeTargets.length === 0) {
            return;
        }
        var entries = [];
        ro.activeTargets.forEach(function processTarget(ot) {
            var entry = new ResizeObserverEntry(ot.target);
            var targetDepth = calculateDepthForNode(ot.target);
            entries.push(entry);
            ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
            if (targetDepth < shallowestDepth) {
                shallowestDepth = targetDepth;
            }
        });
        callbacks.push(function resizeObserverCallback() {
            ro.callback.call(ro.observer, entries, ro.observer);
        });
        ro.activeTargets.splice(0, ro.activeTargets.length);
    });
    for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
        var callback = callbacks_1[_i];
        callback();
    }
    return shallowestDepth;
};

