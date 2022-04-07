module.export({ResizeObserverEntry:()=>ResizeObserverEntry});let calculateBoxSizes;module.link('./algorithms/calculateBoxSize',{calculateBoxSizes(v){calculateBoxSizes=v}},0);let freeze;module.link('./utils/freeze',{freeze(v){freeze=v}},1);

var ResizeObserverEntry = (function () {
    function ResizeObserverEntry(target) {
        var boxes = calculateBoxSizes(target);
        this.target = target;
        this.contentRect = boxes.contentRect;
        this.borderBoxSize = freeze([boxes.borderBoxSize]);
        this.contentBoxSize = freeze([boxes.contentBoxSize]);
        this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
    }
    return ResizeObserverEntry;
}());

