module.export({process:()=>process});let hasActiveObservations;module.link('../algorithms/hasActiveObservations',{hasActiveObservations(v){hasActiveObservations=v}},0);let hasSkippedObservations;module.link('../algorithms/hasSkippedObservations',{hasSkippedObservations(v){hasSkippedObservations=v}},1);let deliverResizeLoopError;module.link('../algorithms/deliverResizeLoopError',{deliverResizeLoopError(v){deliverResizeLoopError=v}},2);let broadcastActiveObservations;module.link('../algorithms/broadcastActiveObservations',{broadcastActiveObservations(v){broadcastActiveObservations=v}},3);let gatherActiveObservationsAtDepth;module.link('../algorithms/gatherActiveObservationsAtDepth',{gatherActiveObservationsAtDepth(v){gatherActiveObservationsAtDepth=v}},4);




var process = function () {
    var depth = 0;
    gatherActiveObservationsAtDepth(depth);
    while (hasActiveObservations()) {
        depth = broadcastActiveObservations();
        gatherActiveObservationsAtDepth(depth);
    }
    if (hasSkippedObservations()) {
        deliverResizeLoopError();
    }
    return depth > 0;
};

