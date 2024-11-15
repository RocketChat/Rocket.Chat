module.export({Resizer:()=>Resizer});let React;module.link('react',{"*"(v){React=v}},0);var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var rowSizeBase = {
    width: '100%',
    height: '10px',
    top: '0px',
    left: '0px',
    cursor: 'row-resize',
};
var colSizeBase = {
    width: '10px',
    height: '100%',
    top: '0px',
    left: '0px',
    cursor: 'col-resize',
};
var edgeBase = {
    width: '20px',
    height: '20px',
    position: 'absolute',
};
var styles = {
    top: __assign(__assign({}, rowSizeBase), { top: '-5px' }),
    right: __assign(__assign({}, colSizeBase), { left: undefined, right: '-5px' }),
    bottom: __assign(__assign({}, rowSizeBase), { top: undefined, bottom: '-5px' }),
    left: __assign(__assign({}, colSizeBase), { left: '-5px' }),
    topRight: __assign(__assign({}, edgeBase), { right: '-10px', top: '-10px', cursor: 'ne-resize' }),
    bottomRight: __assign(__assign({}, edgeBase), { right: '-10px', bottom: '-10px', cursor: 'se-resize' }),
    bottomLeft: __assign(__assign({}, edgeBase), { left: '-10px', bottom: '-10px', cursor: 'sw-resize' }),
    topLeft: __assign(__assign({}, edgeBase), { left: '-10px', top: '-10px', cursor: 'nw-resize' }),
};
var Resizer = /** @class */ (function (_super) {
    __extends(Resizer, _super);
    function Resizer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onMouseDown = function (e) {
            _this.props.onResizeStart(e, _this.props.direction);
        };
        _this.onTouchStart = function (e) {
            _this.props.onResizeStart(e, _this.props.direction);
        };
        return _this;
    }
    Resizer.prototype.render = function () {
        return (React.createElement("div", { className: this.props.className || '', style: __assign(__assign({ position: 'absolute', userSelect: 'none' }, styles[this.props.direction]), (this.props.replaceStyles || {})), onMouseDown: this.onMouseDown, onTouchStart: this.onTouchStart }, this.props.children));
    };
    return Resizer;
}(React.PureComponent));

