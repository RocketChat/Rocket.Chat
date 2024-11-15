module.export({ResizeObserverSize:()=>ResizeObserverSize});let freeze;module.link('./utils/freeze',{freeze(v){freeze=v}},0);
var ResizeObserverSize = (function () {
    function ResizeObserverSize(inlineSize, blockSize) {
        this.inlineSize = inlineSize;
        this.blockSize = blockSize;
        freeze(this);
    }
    return ResizeObserverSize;
}());

