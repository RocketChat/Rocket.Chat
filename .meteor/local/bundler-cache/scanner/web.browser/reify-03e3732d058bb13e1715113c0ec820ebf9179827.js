module.export({hasActiveObservations:()=>hasActiveObservations});let resizeObservers;module.link('../utils/resizeObservers',{resizeObservers(v){resizeObservers=v}},0);
var hasActiveObservations = function () {
    return resizeObservers.some(function (ro) { return ro.activeTargets.length > 0; });
};

