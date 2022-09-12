module.export({queueResizeObserver:()=>queueResizeObserver});let queueMicroTask;module.link('./queueMicroTask',{queueMicroTask(v){queueMicroTask=v}},0);
var queueResizeObserver = function (cb) {
    queueMicroTask(function ResizeObserver() {
        requestAnimationFrame(cb);
    });
};

