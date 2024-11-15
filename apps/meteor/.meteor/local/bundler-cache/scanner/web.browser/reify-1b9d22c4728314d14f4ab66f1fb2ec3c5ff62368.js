module.export({ResizeObservation:()=>ResizeObservation});let ResizeObserverBoxOptions;module.link('./ResizeObserverBoxOptions',{ResizeObserverBoxOptions(v){ResizeObserverBoxOptions=v}},0);let calculateBoxSize;module.link('./algorithms/calculateBoxSize',{calculateBoxSize(v){calculateBoxSize=v}},1);let isSVG,isReplacedElement;module.link('./utils/element',{isSVG(v){isSVG=v},isReplacedElement(v){isReplacedElement=v}},2);


var skipNotifyOnElement = function (target) {
    return !isSVG(target)
        && !isReplacedElement(target)
        && getComputedStyle(target).display === 'inline';
};
var ResizeObservation = (function () {
    function ResizeObservation(target, observedBox) {
        this.target = target;
        this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
        this.lastReportedSize = {
            inlineSize: 0,
            blockSize: 0
        };
    }
    ResizeObservation.prototype.isActive = function () {
        var size = calculateBoxSize(this.target, this.observedBox, true);
        if (skipNotifyOnElement(this.target)) {
            this.lastReportedSize = size;
        }
        if (this.lastReportedSize.inlineSize !== size.inlineSize
            || this.lastReportedSize.blockSize !== size.blockSize) {
            return true;
        }
        return false;
    };
    return ResizeObservation;
}());

