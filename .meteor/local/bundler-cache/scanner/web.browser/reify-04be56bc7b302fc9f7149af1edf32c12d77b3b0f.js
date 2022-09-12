module.export({hasSkippedObservations:()=>hasSkippedObservations});let resizeObservers;module.link('../utils/resizeObservers',{resizeObservers(v){resizeObservers=v}},0);
var hasSkippedObservations = function () {
    return resizeObservers.some(function (ro) { return ro.skippedTargets.length > 0; });
};

