module.export({gatherActiveObservationsAtDepth:()=>gatherActiveObservationsAtDepth});let resizeObservers;module.link('../utils/resizeObservers',{resizeObservers(v){resizeObservers=v}},0);let calculateDepthForNode;module.link('./calculateDepthForNode',{calculateDepthForNode(v){calculateDepthForNode=v}},1);

var gatherActiveObservationsAtDepth = function (depth) {
    resizeObservers.forEach(function processObserver(ro) {
        ro.activeTargets.splice(0, ro.activeTargets.length);
        ro.skippedTargets.splice(0, ro.skippedTargets.length);
        ro.observationTargets.forEach(function processTarget(ot) {
            if (ot.isActive()) {
                if (calculateDepthForNode(ot.target) > depth) {
                    ro.activeTargets.push(ot);
                }
                else {
                    ro.skippedTargets.push(ot);
                }
            }
        });
    });
};

