'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var reactDom = require('react-dom');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
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

var DEFAULT_SIZE = {
    width: 'auto',
    height: 'auto',
};
var clamp = function (n, min, max) { return Math.max(Math.min(n, max), min); };
var snap = function (n, size, gridGap) {
    var v = Math.round(n / size);
    return v * size + gridGap * (v - 1);
};
var hasDirection = function (dir, target) {
    return new RegExp(dir, 'i').test(target);
};
// INFO: In case of window is a Proxy and does not porxy Events correctly, use isTouchEvent & isMouseEvent to distinguish event type instead of `instanceof`.
var isTouchEvent = function (event) {
    return Boolean(event.touches && event.touches.length);
};
var isMouseEvent = function (event) {
    return Boolean((event.clientX || event.clientX === 0) &&
        (event.clientY || event.clientY === 0));
};
var findClosestSnap = function (n, snapArray, snapGap) {
    if (snapGap === void 0) { snapGap = 0; }
    var closestGapIndex = snapArray.reduce(function (prev, curr, index) { return (Math.abs(curr - n) < Math.abs(snapArray[prev] - n) ? index : prev); }, 0);
    var gap = Math.abs(snapArray[closestGapIndex] - n);
    return snapGap === 0 || gap < snapGap ? snapArray[closestGapIndex] : n;
};
var getStringSize = function (n) {
    n = n.toString();
    if (n === 'auto') {
        return n;
    }
    if (n.endsWith('px')) {
        return n;
    }
    if (n.endsWith('%')) {
        return n;
    }
    if (n.endsWith('vh')) {
        return n;
    }
    if (n.endsWith('vw')) {
        return n;
    }
    if (n.endsWith('vmax')) {
        return n;
    }
    if (n.endsWith('vmin')) {
        return n;
    }
    return n + "px";
};
var getPixelSize = function (size, parentSize, innerWidth, innerHeight) {
    if (size && typeof size === 'string') {
        if (size.endsWith('px')) {
            return Number(size.replace('px', ''));
        }
        if (size.endsWith('%')) {
            var ratio = Number(size.replace('%', '')) / 100;
            return parentSize * ratio;
        }
        if (size.endsWith('vw')) {
            var ratio = Number(size.replace('vw', '')) / 100;
            return innerWidth * ratio;
        }
        if (size.endsWith('vh')) {
            var ratio = Number(size.replace('vh', '')) / 100;
            return innerHeight * ratio;
        }
    }
    return size;
};
var calculateNewMax = function (parentSize, innerWidth, innerHeight, maxWidth, maxHeight, minWidth, minHeight) {
    maxWidth = getPixelSize(maxWidth, parentSize.width, innerWidth, innerHeight);
    maxHeight = getPixelSize(maxHeight, parentSize.height, innerWidth, innerHeight);
    minWidth = getPixelSize(minWidth, parentSize.width, innerWidth, innerHeight);
    minHeight = getPixelSize(minHeight, parentSize.height, innerWidth, innerHeight);
    return {
        maxWidth: typeof maxWidth === 'undefined' ? undefined : Number(maxWidth),
        maxHeight: typeof maxHeight === 'undefined' ? undefined : Number(maxHeight),
        minWidth: typeof minWidth === 'undefined' ? undefined : Number(minWidth),
        minHeight: typeof minHeight === 'undefined' ? undefined : Number(minHeight),
    };
};
/**
 * transform T | [T, T] to [T, T]
 * @param val
 * @returns
 */
// tslint:disable-next-line
var normalizeToPair = function (val) { return (Array.isArray(val) ? val : [val, val]); };
var definedProps = [
    'as',
    'ref',
    'style',
    'className',
    'grid',
    'gridGap',
    'snap',
    'bounds',
    'boundsByDirection',
    'size',
    'defaultSize',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'lockAspectRatio',
    'lockAspectRatioExtraWidth',
    'lockAspectRatioExtraHeight',
    'enable',
    'handleStyles',
    'handleClasses',
    'handleWrapperStyle',
    'handleWrapperClass',
    'children',
    'onResizeStart',
    'onResize',
    'onResizeStop',
    'handleComponent',
    'scale',
    'resizeRatio',
    'snapGap',
];
// HACK: This class is used to calculate % size.
var baseClassName = '__resizable_base__';
var Resizable = /** @class */ (function (_super) {
    __extends(Resizable, _super);
    function Resizable(props) {
        var _a, _b, _c, _d;
        var _this = _super.call(this, props) || this;
        _this.ratio = 1;
        _this.resizable = null;
        // For parent boundary
        _this.parentLeft = 0;
        _this.parentTop = 0;
        // For boundary
        _this.resizableLeft = 0;
        _this.resizableRight = 0;
        _this.resizableTop = 0;
        _this.resizableBottom = 0;
        // For target boundary
        _this.targetLeft = 0;
        _this.targetTop = 0;
        _this.appendBase = function () {
            if (!_this.resizable || !_this.window) {
                return null;
            }
            var parent = _this.parentNode;
            if (!parent) {
                return null;
            }
            var element = _this.window.document.createElement('div');
            element.style.width = '100%';
            element.style.height = '100%';
            element.style.position = 'absolute';
            element.style.transform = 'scale(0, 0)';
            element.style.left = '0';
            element.style.flex = '0 0 100%';
            if (element.classList) {
                element.classList.add(baseClassName);
            }
            else {
                element.className += baseClassName;
            }
            parent.appendChild(element);
            return element;
        };
        _this.removeBase = function (base) {
            var parent = _this.parentNode;
            if (!parent) {
                return;
            }
            parent.removeChild(base);
        };
        _this.state = {
            isResizing: false,
            width: (_b = (_a = _this.propsSize) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : 'auto',
            height: (_d = (_c = _this.propsSize) === null || _c === void 0 ? void 0 : _c.height) !== null && _d !== void 0 ? _d : 'auto',
            direction: 'right',
            original: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            },
            backgroundStyle: {
                height: '100%',
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0)',
                cursor: 'auto',
                opacity: 0,
                position: 'fixed',
                zIndex: 9999,
                top: '0',
                left: '0',
                bottom: '0',
                right: '0',
            },
            flexBasis: undefined,
        };
        _this.onResizeStart = _this.onResizeStart.bind(_this);
        _this.onMouseMove = _this.onMouseMove.bind(_this);
        _this.onMouseUp = _this.onMouseUp.bind(_this);
        return _this;
    }
    Object.defineProperty(Resizable.prototype, "parentNode", {
        get: function () {
            if (!this.resizable) {
                return null;
            }
            return this.resizable.parentNode;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Resizable.prototype, "window", {
        get: function () {
            if (!this.resizable) {
                return null;
            }
            if (!this.resizable.ownerDocument) {
                return null;
            }
            return this.resizable.ownerDocument.defaultView;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Resizable.prototype, "propsSize", {
        get: function () {
            return this.props.size || this.props.defaultSize || DEFAULT_SIZE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Resizable.prototype, "size", {
        get: function () {
            var width = 0;
            var height = 0;
            if (this.resizable && this.window) {
                var orgWidth = this.resizable.offsetWidth;
                var orgHeight = this.resizable.offsetHeight;
                // HACK: Set position `relative` to get parent size.
                //       This is because when re-resizable set `absolute`, I can not get base width correctly.
                var orgPosition = this.resizable.style.position;
                if (orgPosition !== 'relative') {
                    this.resizable.style.position = 'relative';
                }
                // INFO: Use original width or height if set auto.
                width = this.resizable.style.width !== 'auto' ? this.resizable.offsetWidth : orgWidth;
                height = this.resizable.style.height !== 'auto' ? this.resizable.offsetHeight : orgHeight;
                // Restore original position
                this.resizable.style.position = orgPosition;
            }
            return { width: width, height: height };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Resizable.prototype, "sizeStyle", {
        get: function () {
            var _this = this;
            var size = this.props.size;
            var getSize = function (key) {
                var _a;
                if (typeof _this.state[key] === 'undefined' || _this.state[key] === 'auto') {
                    return 'auto';
                }
                if (_this.propsSize && _this.propsSize[key] && ((_a = _this.propsSize[key]) === null || _a === void 0 ? void 0 : _a.toString().endsWith('%'))) {
                    if (_this.state[key].toString().endsWith('%')) {
                        return _this.state[key].toString();
                    }
                    var parentSize = _this.getParentSize();
                    var value = Number(_this.state[key].toString().replace('px', ''));
                    var percent = (value / parentSize[key]) * 100;
                    return percent + "%";
                }
                return getStringSize(_this.state[key]);
            };
            var width = size && typeof size.width !== 'undefined' && !this.state.isResizing
                ? getStringSize(size.width)
                : getSize('width');
            var height = size && typeof size.height !== 'undefined' && !this.state.isResizing
                ? getStringSize(size.height)
                : getSize('height');
            return { width: width, height: height };
        },
        enumerable: false,
        configurable: true
    });
    Resizable.prototype.getParentSize = function () {
        if (!this.parentNode) {
            if (!this.window) {
                return { width: 0, height: 0 };
            }
            return { width: this.window.innerWidth, height: this.window.innerHeight };
        }
        var base = this.appendBase();
        if (!base) {
            return { width: 0, height: 0 };
        }
        // INFO: To calculate parent width with flex layout
        var wrapChanged = false;
        var wrap = this.parentNode.style.flexWrap;
        if (wrap !== 'wrap') {
            wrapChanged = true;
            this.parentNode.style.flexWrap = 'wrap';
            // HACK: Use relative to get parent padding size
        }
        base.style.position = 'relative';
        base.style.minWidth = '100%';
        base.style.minHeight = '100%';
        var size = {
            width: base.offsetWidth,
            height: base.offsetHeight,
        };
        if (wrapChanged) {
            this.parentNode.style.flexWrap = wrap;
        }
        this.removeBase(base);
        return size;
    };
    Resizable.prototype.bindEvents = function () {
        if (this.window) {
            this.window.addEventListener('mouseup', this.onMouseUp);
            this.window.addEventListener('mousemove', this.onMouseMove);
            this.window.addEventListener('mouseleave', this.onMouseUp);
            this.window.addEventListener('touchmove', this.onMouseMove, {
                capture: true,
                passive: false,
            });
            this.window.addEventListener('touchend', this.onMouseUp);
        }
    };
    Resizable.prototype.unbindEvents = function () {
        if (this.window) {
            this.window.removeEventListener('mouseup', this.onMouseUp);
            this.window.removeEventListener('mousemove', this.onMouseMove);
            this.window.removeEventListener('mouseleave', this.onMouseUp);
            this.window.removeEventListener('touchmove', this.onMouseMove, true);
            this.window.removeEventListener('touchend', this.onMouseUp);
        }
    };
    Resizable.prototype.componentDidMount = function () {
        if (!this.resizable || !this.window) {
            return;
        }
        var computedStyle = this.window.getComputedStyle(this.resizable);
        this.setState({
            width: this.state.width || this.size.width,
            height: this.state.height || this.size.height,
            flexBasis: computedStyle.flexBasis !== 'auto' ? computedStyle.flexBasis : undefined,
        });
    };
    Resizable.prototype.componentWillUnmount = function () {
        if (this.window) {
            this.unbindEvents();
        }
    };
    Resizable.prototype.createSizeForCssProperty = function (newSize, kind) {
        var propsSize = this.propsSize && this.propsSize[kind];
        return this.state[kind] === 'auto' &&
            this.state.original[kind] === newSize &&
            (typeof propsSize === 'undefined' || propsSize === 'auto')
            ? 'auto'
            : newSize;
    };
    Resizable.prototype.calculateNewMaxFromBoundary = function (maxWidth, maxHeight) {
        var boundsByDirection = this.props.boundsByDirection;
        var direction = this.state.direction;
        var widthByDirection = boundsByDirection && hasDirection('left', direction);
        var heightByDirection = boundsByDirection && hasDirection('top', direction);
        var boundWidth;
        var boundHeight;
        if (this.props.bounds === 'parent') {
            var parent_1 = this.parentNode;
            if (parent_1) {
                boundWidth = widthByDirection
                    ? this.resizableRight - this.parentLeft
                    : parent_1.offsetWidth + (this.parentLeft - this.resizableLeft);
                boundHeight = heightByDirection
                    ? this.resizableBottom - this.parentTop
                    : parent_1.offsetHeight + (this.parentTop - this.resizableTop);
            }
        }
        else if (this.props.bounds === 'window') {
            if (this.window) {
                boundWidth = widthByDirection ? this.resizableRight : this.window.innerWidth - this.resizableLeft;
                boundHeight = heightByDirection ? this.resizableBottom : this.window.innerHeight - this.resizableTop;
            }
        }
        else if (this.props.bounds) {
            boundWidth = widthByDirection
                ? this.resizableRight - this.targetLeft
                : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft);
            boundHeight = heightByDirection
                ? this.resizableBottom - this.targetTop
                : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop);
        }
        if (boundWidth && Number.isFinite(boundWidth)) {
            maxWidth = maxWidth && maxWidth < boundWidth ? maxWidth : boundWidth;
        }
        if (boundHeight && Number.isFinite(boundHeight)) {
            maxHeight = maxHeight && maxHeight < boundHeight ? maxHeight : boundHeight;
        }
        return { maxWidth: maxWidth, maxHeight: maxHeight };
    };
    Resizable.prototype.calculateNewSizeFromDirection = function (clientX, clientY) {
        var scale = this.props.scale || 1;
        var _a = normalizeToPair(this.props.resizeRatio || 1), resizeRatioX = _a[0], resizeRatioY = _a[1];
        var _b = this.state, direction = _b.direction, original = _b.original;
        var _c = this.props, lockAspectRatio = _c.lockAspectRatio, lockAspectRatioExtraHeight = _c.lockAspectRatioExtraHeight, lockAspectRatioExtraWidth = _c.lockAspectRatioExtraWidth;
        var newWidth = original.width;
        var newHeight = original.height;
        var extraHeight = lockAspectRatioExtraHeight || 0;
        var extraWidth = lockAspectRatioExtraWidth || 0;
        if (hasDirection('right', direction)) {
            newWidth = original.width + ((clientX - original.x) * resizeRatioX) / scale;
            if (lockAspectRatio) {
                newHeight = (newWidth - extraWidth) / this.ratio + extraHeight;
            }
        }
        if (hasDirection('left', direction)) {
            newWidth = original.width - ((clientX - original.x) * resizeRatioX) / scale;
            if (lockAspectRatio) {
                newHeight = (newWidth - extraWidth) / this.ratio + extraHeight;
            }
        }
        if (hasDirection('bottom', direction)) {
            newHeight = original.height + ((clientY - original.y) * resizeRatioY) / scale;
            if (lockAspectRatio) {
                newWidth = (newHeight - extraHeight) * this.ratio + extraWidth;
            }
        }
        if (hasDirection('top', direction)) {
            newHeight = original.height - ((clientY - original.y) * resizeRatioY) / scale;
            if (lockAspectRatio) {
                newWidth = (newHeight - extraHeight) * this.ratio + extraWidth;
            }
        }
        return { newWidth: newWidth, newHeight: newHeight };
    };
    Resizable.prototype.calculateNewSizeFromAspectRatio = function (newWidth, newHeight, max, min) {
        var _a = this.props, lockAspectRatio = _a.lockAspectRatio, lockAspectRatioExtraHeight = _a.lockAspectRatioExtraHeight, lockAspectRatioExtraWidth = _a.lockAspectRatioExtraWidth;
        var computedMinWidth = typeof min.width === 'undefined' ? 10 : min.width;
        var computedMaxWidth = typeof max.width === 'undefined' || max.width < 0 ? newWidth : max.width;
        var computedMinHeight = typeof min.height === 'undefined' ? 10 : min.height;
        var computedMaxHeight = typeof max.height === 'undefined' || max.height < 0 ? newHeight : max.height;
        var extraHeight = lockAspectRatioExtraHeight || 0;
        var extraWidth = lockAspectRatioExtraWidth || 0;
        if (lockAspectRatio) {
            var extraMinWidth = (computedMinHeight - extraHeight) * this.ratio + extraWidth;
            var extraMaxWidth = (computedMaxHeight - extraHeight) * this.ratio + extraWidth;
            var extraMinHeight = (computedMinWidth - extraWidth) / this.ratio + extraHeight;
            var extraMaxHeight = (computedMaxWidth - extraWidth) / this.ratio + extraHeight;
            var lockedMinWidth = Math.max(computedMinWidth, extraMinWidth);
            var lockedMaxWidth = Math.min(computedMaxWidth, extraMaxWidth);
            var lockedMinHeight = Math.max(computedMinHeight, extraMinHeight);
            var lockedMaxHeight = Math.min(computedMaxHeight, extraMaxHeight);
            newWidth = clamp(newWidth, lockedMinWidth, lockedMaxWidth);
            newHeight = clamp(newHeight, lockedMinHeight, lockedMaxHeight);
        }
        else {
            newWidth = clamp(newWidth, computedMinWidth, computedMaxWidth);
            newHeight = clamp(newHeight, computedMinHeight, computedMaxHeight);
        }
        return { newWidth: newWidth, newHeight: newHeight };
    };
    Resizable.prototype.setBoundingClientRect = function () {
        var adjustedScale = 1 / (this.props.scale || 1);
        // For parent boundary
        if (this.props.bounds === 'parent') {
            var parent_2 = this.parentNode;
            if (parent_2) {
                var parentRect = parent_2.getBoundingClientRect();
                this.parentLeft = parentRect.left * adjustedScale;
                this.parentTop = parentRect.top * adjustedScale;
            }
        }
        // For target(html element) boundary
        if (this.props.bounds && typeof this.props.bounds !== 'string') {
            var targetRect = this.props.bounds.getBoundingClientRect();
            this.targetLeft = targetRect.left * adjustedScale;
            this.targetTop = targetRect.top * adjustedScale;
        }
        // For boundary
        if (this.resizable) {
            var _a = this.resizable.getBoundingClientRect(), left = _a.left, top_1 = _a.top, right = _a.right, bottom = _a.bottom;
            this.resizableLeft = left * adjustedScale;
            this.resizableRight = right * adjustedScale;
            this.resizableTop = top_1 * adjustedScale;
            this.resizableBottom = bottom * adjustedScale;
        }
    };
    Resizable.prototype.onResizeStart = function (event, direction) {
        if (!this.resizable || !this.window) {
            return;
        }
        var clientX = 0;
        var clientY = 0;
        if (event.nativeEvent && isMouseEvent(event.nativeEvent)) {
            clientX = event.nativeEvent.clientX;
            clientY = event.nativeEvent.clientY;
        }
        else if (event.nativeEvent && isTouchEvent(event.nativeEvent)) {
            clientX = event.nativeEvent.touches[0].clientX;
            clientY = event.nativeEvent.touches[0].clientY;
        }
        if (this.props.onResizeStart) {
            if (this.resizable) {
                var startResize = this.props.onResizeStart(event, direction, this.resizable);
                if (startResize === false) {
                    return;
                }
            }
        }
        // Fix #168
        if (this.props.size) {
            if (typeof this.props.size.height !== 'undefined' && this.props.size.height !== this.state.height) {
                this.setState({ height: this.props.size.height });
            }
            if (typeof this.props.size.width !== 'undefined' && this.props.size.width !== this.state.width) {
                this.setState({ width: this.props.size.width });
            }
        }
        // For lockAspectRatio case
        this.ratio =
            typeof this.props.lockAspectRatio === 'number' ? this.props.lockAspectRatio : this.size.width / this.size.height;
        var flexBasis;
        var computedStyle = this.window.getComputedStyle(this.resizable);
        if (computedStyle.flexBasis !== 'auto') {
            var parent_3 = this.parentNode;
            if (parent_3) {
                var dir = this.window.getComputedStyle(parent_3).flexDirection;
                this.flexDir = dir.startsWith('row') ? 'row' : 'column';
                flexBasis = computedStyle.flexBasis;
            }
        }
        // For boundary
        this.setBoundingClientRect();
        this.bindEvents();
        var state = {
            original: {
                x: clientX,
                y: clientY,
                width: this.size.width,
                height: this.size.height,
            },
            isResizing: true,
            backgroundStyle: __assign(__assign({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(event.target).cursor || 'auto' }),
            direction: direction,
            flexBasis: flexBasis,
        };
        this.setState(state);
    };
    Resizable.prototype.onMouseMove = function (event) {
        var _this = this;
        if (!this.state.isResizing || !this.resizable || !this.window) {
            return;
        }
        if (this.window.TouchEvent && isTouchEvent(event)) {
            try {
                event.preventDefault();
                event.stopPropagation();
            }
            catch (e) {
                // Ignore on fail
            }
        }
        var _a = this.props, maxWidth = _a.maxWidth, maxHeight = _a.maxHeight, minWidth = _a.minWidth, minHeight = _a.minHeight;
        var clientX = isTouchEvent(event) ? event.touches[0].clientX : event.clientX;
        var clientY = isTouchEvent(event) ? event.touches[0].clientY : event.clientY;
        var _b = this.state, direction = _b.direction, original = _b.original, width = _b.width, height = _b.height;
        var parentSize = this.getParentSize();
        var max = calculateNewMax(parentSize, this.window.innerWidth, this.window.innerHeight, maxWidth, maxHeight, minWidth, minHeight);
        maxWidth = max.maxWidth;
        maxHeight = max.maxHeight;
        minWidth = max.minWidth;
        minHeight = max.minHeight;
        // Calculate new size
        var _c = this.calculateNewSizeFromDirection(clientX, clientY), newHeight = _c.newHeight, newWidth = _c.newWidth;
        // Calculate max size from boundary settings
        var boundaryMax = this.calculateNewMaxFromBoundary(maxWidth, maxHeight);
        if (this.props.snap && this.props.snap.x) {
            newWidth = findClosestSnap(newWidth, this.props.snap.x, this.props.snapGap);
        }
        if (this.props.snap && this.props.snap.y) {
            newHeight = findClosestSnap(newHeight, this.props.snap.y, this.props.snapGap);
        }
        // Calculate new size from aspect ratio
        var newSize = this.calculateNewSizeFromAspectRatio(newWidth, newHeight, { width: boundaryMax.maxWidth, height: boundaryMax.maxHeight }, { width: minWidth, height: minHeight });
        newWidth = newSize.newWidth;
        newHeight = newSize.newHeight;
        if (this.props.grid) {
            var newGridWidth = snap(newWidth, this.props.grid[0], this.props.gridGap ? this.props.gridGap[0] : 0);
            var newGridHeight = snap(newHeight, this.props.grid[1], this.props.gridGap ? this.props.gridGap[1] : 0);
            var gap = this.props.snapGap || 0;
            var w = gap === 0 || Math.abs(newGridWidth - newWidth) <= gap ? newGridWidth : newWidth;
            var h = gap === 0 || Math.abs(newGridHeight - newHeight) <= gap ? newGridHeight : newHeight;
            newWidth = w;
            newHeight = h;
        }
        var delta = {
            width: newWidth - original.width,
            height: newHeight - original.height,
        };
        if (width && typeof width === 'string') {
            if (width.endsWith('%')) {
                var percent = (newWidth / parentSize.width) * 100;
                newWidth = percent + "%";
            }
            else if (width.endsWith('vw')) {
                var vw = (newWidth / this.window.innerWidth) * 100;
                newWidth = vw + "vw";
            }
            else if (width.endsWith('vh')) {
                var vh = (newWidth / this.window.innerHeight) * 100;
                newWidth = vh + "vh";
            }
        }
        if (height && typeof height === 'string') {
            if (height.endsWith('%')) {
                var percent = (newHeight / parentSize.height) * 100;
                newHeight = percent + "%";
            }
            else if (height.endsWith('vw')) {
                var vw = (newHeight / this.window.innerWidth) * 100;
                newHeight = vw + "vw";
            }
            else if (height.endsWith('vh')) {
                var vh = (newHeight / this.window.innerHeight) * 100;
                newHeight = vh + "vh";
            }
        }
        var newState = {
            width: this.createSizeForCssProperty(newWidth, 'width'),
            height: this.createSizeForCssProperty(newHeight, 'height'),
        };
        if (this.flexDir === 'row') {
            newState.flexBasis = newState.width;
        }
        else if (this.flexDir === 'column') {
            newState.flexBasis = newState.height;
        }
        var widthChanged = this.state.width !== newState.width;
        var heightChanged = this.state.height !== newState.height;
        var flexBaseChanged = this.state.flexBasis !== newState.flexBasis;
        var changed = widthChanged || heightChanged || flexBaseChanged;
        if (changed) {
            // For v18, update state sync
            reactDom.flushSync(function () {
                _this.setState(newState);
            });
        }
        if (this.props.onResize) {
            if (changed) {
                this.props.onResize(event, direction, this.resizable, delta);
            }
        }
    };
    Resizable.prototype.onMouseUp = function (event) {
        var _a, _b;
        var _c = this.state, isResizing = _c.isResizing, direction = _c.direction, original = _c.original;
        if (!isResizing || !this.resizable) {
            return;
        }
        var delta = {
            width: this.size.width - original.width,
            height: this.size.height - original.height,
        };
        if (this.props.onResizeStop) {
            this.props.onResizeStop(event, direction, this.resizable, delta);
        }
        if (this.props.size) {
            this.setState({ width: (_a = this.props.size.width) !== null && _a !== void 0 ? _a : 'auto', height: (_b = this.props.size.height) !== null && _b !== void 0 ? _b : 'auto' });
        }
        this.unbindEvents();
        this.setState({
            isResizing: false,
            backgroundStyle: __assign(__assign({}, this.state.backgroundStyle), { cursor: 'auto' }),
        });
    };
    Resizable.prototype.updateSize = function (size) {
        var _a, _b;
        this.setState({ width: (_a = size.width) !== null && _a !== void 0 ? _a : 'auto', height: (_b = size.height) !== null && _b !== void 0 ? _b : 'auto' });
    };
    Resizable.prototype.renderResizer = function (directions) {
        var _this = this;
        var _a = this.props, enable = _a.enable, handleStyles = _a.handleStyles, handleClasses = _a.handleClasses, handleWrapperStyle = _a.handleWrapperStyle, handleWrapperClass = _a.handleWrapperClass, handleComponent = _a.handleComponent;
        if (!enable) {
            return null;
        }
        var resizers = directions
            .filter(function (dir) { return enable[dir] !== false; })
            .map(function (dir) {
            if (enable[dir] !== false) {
                return (React.createElement(Resizer, { key: dir, direction: dir, onResizeStart: _this.onResizeStart, replaceStyles: handleStyles && handleStyles[dir], className: handleClasses && handleClasses[dir] }, handleComponent && handleComponent[dir] ? handleComponent[dir] : null));
            }
            return null;
        });
        // #93 Wrap the resize box in span (will not break 100% width/height)
        return (React.createElement("div", { className: handleWrapperClass, style: handleWrapperStyle }, resizers));
    };
    Resizable.prototype.render = function () {
        var _this = this;
        var extendsProps = Object.keys(this.props).reduce(function (acc, key) {
            if (definedProps.indexOf(key) !== -1) {
                return acc;
            }
            acc[key] = _this.props[key];
            return acc;
        }, {});
        var style = __assign(__assign(__assign({ position: 'relative', userSelect: this.state.isResizing ? 'none' : 'auto' }, this.props.style), this.sizeStyle), { maxWidth: this.props.maxWidth, maxHeight: this.props.maxHeight, minWidth: this.props.minWidth, minHeight: this.props.minHeight, boxSizing: 'border-box', flexShrink: 0 });
        if (this.state.flexBasis) {
            style.flexBasis = this.state.flexBasis;
        }
        var Wrapper = this.props.as || 'div';
        return (React.createElement(Wrapper, __assign({ style: style, className: this.props.className }, extendsProps, { 
            // `ref` is after `extendsProps` to ensure this one wins over a version
            // passed in
            ref: function (c) {
                if (c) {
                    _this.resizable = c;
                }
            } }),
            this.state.isResizing && React.createElement("div", { style: this.state.backgroundStyle }),
            this.renderResizer(['topLeft', 'top', 'topRight', 'left']),
            this.props.children,
            this.renderResizer(['right', 'bottomLeft', 'bottom', 'bottomRight'])));
    };
    Resizable.defaultProps = {
        as: 'div',
        onResizeStart: function () { },
        onResize: function () { },
        onResizeStop: function () { },
        enable: {
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
        },
        style: {},
        grid: [1, 1],
        gridGap: [0, 0],
        lockAspectRatio: false,
        lockAspectRatioExtraWidth: 0,
        lockAspectRatioExtraHeight: 0,
        scale: 1,
        resizeRatio: 1,
        snapGap: 0,
    };
    return Resizable;
}(React.PureComponent));

exports.Resizable = Resizable;
