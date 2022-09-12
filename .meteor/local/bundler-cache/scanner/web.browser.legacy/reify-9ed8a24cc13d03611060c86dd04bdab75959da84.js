"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scrollbars = void 0;
var React = __importStar(require("react"));
var react_1 = require("react");
var raf_1 = __importStar(require("raf"));
var dom_css_1 = __importDefault(require("dom-css"));
var utils_1 = require("../utils");
var styles_1 = require("./styles");
var Scrollbars = (function (_super) {
    __extends(Scrollbars, _super);
    function Scrollbars(props) {
        var _this = _super.call(this, props) || this;
        _this.container = null;
        _this.dragging = false;
        _this.scrolling = false;
        _this.trackMouseOver = false;
        _this.styles = (0, styles_1.createStyles)(_this.props.disableDefaultStyles);
        _this.getScrollLeft = _this.getScrollLeft.bind(_this);
        _this.getScrollTop = _this.getScrollTop.bind(_this);
        _this.getScrollWidth = _this.getScrollWidth.bind(_this);
        _this.getScrollHeight = _this.getScrollHeight.bind(_this);
        _this.getClientWidth = _this.getClientWidth.bind(_this);
        _this.getClientHeight = _this.getClientHeight.bind(_this);
        _this.getValues = _this.getValues.bind(_this);
        _this.getThumbHorizontalWidth = _this.getThumbHorizontalWidth.bind(_this);
        _this.getThumbVerticalHeight = _this.getThumbVerticalHeight.bind(_this);
        _this.getScrollLeftForOffset = _this.getScrollLeftForOffset.bind(_this);
        _this.getScrollTopForOffset = _this.getScrollTopForOffset.bind(_this);
        _this.scrollLeft = _this.scrollLeft.bind(_this);
        _this.scrollTop = _this.scrollTop.bind(_this);
        _this.scrollToLeft = _this.scrollToLeft.bind(_this);
        _this.scrollToTop = _this.scrollToTop.bind(_this);
        _this.scrollToRight = _this.scrollToRight.bind(_this);
        _this.scrollToBottom = _this.scrollToBottom.bind(_this);
        _this.handleTrackMouseEnter = _this.handleTrackMouseEnter.bind(_this);
        _this.handleTrackMouseLeave = _this.handleTrackMouseLeave.bind(_this);
        _this.handleHorizontalTrackMouseDown = _this.handleHorizontalTrackMouseDown.bind(_this);
        _this.handleVerticalTrackMouseDown = _this.handleVerticalTrackMouseDown.bind(_this);
        _this.handleHorizontalThumbMouseDown = _this.handleHorizontalThumbMouseDown.bind(_this);
        _this.handleVerticalThumbMouseDown = _this.handleVerticalThumbMouseDown.bind(_this);
        _this.handleWindowResize = _this.handleWindowResize.bind(_this);
        _this.handleScroll = _this.handleScroll.bind(_this);
        _this.handleDrag = _this.handleDrag.bind(_this);
        _this.handleDragEnd = _this.handleDragEnd.bind(_this);
        _this.state = {
            didMountUniversal: false,
            scrollbarWidth: (0, utils_1.getScrollbarWidth)(),
        };
        return _this;
    }
    Scrollbars.prototype.componentDidMount = function () {
        this.addListeners();
        this.update();
        this.componentDidMountUniversal();
    };
    Scrollbars.prototype.componentDidMountUniversal = function () {
        var universal = this.props.universal;
        if (!universal)
            return;
        this.setState({ didMountUniversal: true });
    };
    Scrollbars.prototype.componentDidUpdate = function () {
        this.update();
    };
    Scrollbars.prototype.componentWillUnmount = function () {
        this.removeListeners();
        this.requestFrame && (0, raf_1.cancel)(this.requestFrame);
        clearTimeout(this.hideTracksTimeout);
        clearInterval(this.detectScrollingInterval);
    };
    Scrollbars.prototype.getScrollLeft = function () {
        if (!this.view)
            return 0;
        return this.view.scrollLeft;
    };
    Scrollbars.prototype.getScrollTop = function () {
        if (!this.view)
            return 0;
        return this.view.scrollTop;
    };
    Scrollbars.prototype.getScrollWidth = function () {
        if (!this.view)
            return 0;
        return this.view.scrollWidth;
    };
    Scrollbars.prototype.getScrollHeight = function () {
        if (!this.view)
            return 0;
        return this.view.scrollHeight;
    };
    Scrollbars.prototype.getClientWidth = function () {
        if (!this.view)
            return 0;
        return this.view.clientWidth;
    };
    Scrollbars.prototype.getClientHeight = function () {
        if (!this.view)
            return 0;
        return this.view.clientHeight;
    };
    Scrollbars.prototype.getValues = function () {
        var _a = this.view || {}, _b = _a.scrollLeft, scrollLeft = _b === void 0 ? 0 : _b, _c = _a.scrollTop, scrollTop = _c === void 0 ? 0 : _c, _d = _a.scrollWidth, scrollWidth = _d === void 0 ? 0 : _d, _e = _a.scrollHeight, scrollHeight = _e === void 0 ? 0 : _e, _f = _a.clientWidth, clientWidth = _f === void 0 ? 0 : _f, _g = _a.clientHeight, clientHeight = _g === void 0 ? 0 : _g;
        return {
            left: scrollLeft / (scrollWidth - clientWidth) || 0,
            top: scrollTop / (scrollHeight - clientHeight) || 0,
            scrollLeft: scrollLeft,
            scrollTop: scrollTop,
            scrollWidth: scrollWidth,
            scrollHeight: scrollHeight,
            clientWidth: clientWidth,
            clientHeight: clientHeight,
        };
    };
    Scrollbars.prototype.getThumbHorizontalWidth = function () {
        if (!this.view || !this.trackHorizontal)
            return 0;
        var _a = this.props, thumbSize = _a.thumbSize, thumbMinSize = _a.thumbMinSize;
        var _b = this.view, scrollWidth = _b.scrollWidth, clientWidth = _b.clientWidth;
        var trackWidth = (0, utils_1.getInnerWidth)(this.trackHorizontal);
        var width = Math.ceil((clientWidth / scrollWidth) * trackWidth);
        if (trackWidth === width)
            return 0;
        if (thumbSize)
            return thumbSize;
        return Math.max(width, thumbMinSize);
    };
    Scrollbars.prototype.getThumbVerticalHeight = function () {
        if (!this.view || !this.trackVertical)
            return 0;
        var _a = this.props, thumbSize = _a.thumbSize, thumbMinSize = _a.thumbMinSize;
        var _b = this.view, scrollHeight = _b.scrollHeight, clientHeight = _b.clientHeight;
        var trackHeight = (0, utils_1.getInnerHeight)(this.trackVertical);
        var height = Math.ceil((clientHeight / scrollHeight) * trackHeight);
        if (trackHeight === height)
            return 0;
        if (thumbSize)
            return thumbSize;
        return Math.max(height, thumbMinSize);
    };
    Scrollbars.prototype.getScrollLeftForOffset = function (offset) {
        if (!this.view || !this.trackHorizontal)
            return 0;
        var _a = this.view, scrollWidth = _a.scrollWidth, clientWidth = _a.clientWidth;
        var trackWidth = (0, utils_1.getInnerWidth)(this.trackHorizontal);
        var thumbWidth = this.getThumbHorizontalWidth();
        return (offset / (trackWidth - thumbWidth)) * (scrollWidth - clientWidth);
    };
    Scrollbars.prototype.getScrollTopForOffset = function (offset) {
        if (!this.view || !this.trackVertical)
            return 0;
        var _a = this.view, scrollHeight = _a.scrollHeight, clientHeight = _a.clientHeight;
        var trackHeight = (0, utils_1.getInnerHeight)(this.trackVertical);
        var thumbHeight = this.getThumbVerticalHeight();
        return (offset / (trackHeight - thumbHeight)) * (scrollHeight - clientHeight);
    };
    Scrollbars.prototype.scrollLeft = function (left) {
        if (left === void 0) { left = 0; }
        if (!this.view)
            return;
        this.view.scrollLeft = left;
    };
    Scrollbars.prototype.scrollTop = function (top) {
        if (top === void 0) { top = 0; }
        if (!this.view)
            return;
        this.view.scrollTop = top;
    };
    Scrollbars.prototype.scrollToLeft = function () {
        if (!this.view)
            return;
        this.view.scrollLeft = 0;
    };
    Scrollbars.prototype.scrollToTop = function () {
        if (!this.view)
            return;
        this.view.scrollTop = 0;
    };
    Scrollbars.prototype.scrollToRight = function () {
        if (!this.view)
            return;
        this.view.scrollLeft = this.view.scrollWidth;
    };
    Scrollbars.prototype.scrollToBottom = function () {
        if (!this.view)
            return;
        this.view.scrollTop = this.view.scrollHeight;
    };
    Scrollbars.prototype.scrollToY = function (y) {
        if (!this.view)
            return;
        this.view.scrollTop = y;
    };
    Scrollbars.prototype.addListeners = function () {
        if (typeof document === 'undefined' ||
            !this.view ||
            !this.trackHorizontal ||
            !this.trackVertical ||
            !this.thumbVertical ||
            !this.thumbHorizontal)
            return;
        var _a = this, view = _a.view, trackHorizontal = _a.trackHorizontal, trackVertical = _a.trackVertical, thumbHorizontal = _a.thumbHorizontal, thumbVertical = _a.thumbVertical;
        view.addEventListener('scroll', this.handleScroll);
        if (!this.state.scrollbarWidth)
            return;
        trackHorizontal.addEventListener('mouseenter', this.handleTrackMouseEnter);
        trackHorizontal.addEventListener('mouseleave', this.handleTrackMouseLeave);
        trackHorizontal.addEventListener('mousedown', this.handleHorizontalTrackMouseDown);
        trackVertical.addEventListener('mouseenter', this.handleTrackMouseEnter);
        trackVertical.addEventListener('mouseleave', this.handleTrackMouseLeave);
        trackVertical.addEventListener('mousedown', this.handleVerticalTrackMouseDown);
        thumbHorizontal.addEventListener('mousedown', this.handleHorizontalThumbMouseDown);
        thumbVertical.addEventListener('mousedown', this.handleVerticalThumbMouseDown);
        window.addEventListener('resize', this.handleWindowResize);
    };
    Scrollbars.prototype.removeListeners = function () {
        if (typeof document === 'undefined' ||
            !this.view ||
            !this.trackHorizontal ||
            !this.trackVertical ||
            !this.thumbVertical ||
            !this.thumbHorizontal)
            return;
        var _a = this, view = _a.view, trackHorizontal = _a.trackHorizontal, trackVertical = _a.trackVertical, thumbHorizontal = _a.thumbHorizontal, thumbVertical = _a.thumbVertical;
        view.removeEventListener('scroll', this.handleScroll);
        if (!this.state.scrollbarWidth)
            return;
        trackHorizontal.removeEventListener('mouseenter', this.handleTrackMouseEnter);
        trackHorizontal.removeEventListener('mouseleave', this.handleTrackMouseLeave);
        trackHorizontal.removeEventListener('mousedown', this.handleHorizontalTrackMouseDown);
        trackVertical.removeEventListener('mouseenter', this.handleTrackMouseEnter);
        trackVertical.removeEventListener('mouseleave', this.handleTrackMouseLeave);
        trackVertical.removeEventListener('mousedown', this.handleVerticalTrackMouseDown);
        thumbHorizontal.removeEventListener('mousedown', this.handleHorizontalThumbMouseDown);
        thumbVertical.removeEventListener('mousedown', this.handleVerticalThumbMouseDown);
        window.removeEventListener('resize', this.handleWindowResize);
        this.teardownDragging();
    };
    Scrollbars.prototype.handleScroll = function (event) {
        var _this = this;
        var _a = this.props, onScroll = _a.onScroll, onScrollFrame = _a.onScrollFrame;
        if (onScroll)
            onScroll(event);
        this.update(function (values) {
            var scrollLeft = values.scrollLeft, scrollTop = values.scrollTop;
            _this.viewScrollLeft = scrollLeft;
            _this.viewScrollTop = scrollTop;
            if (onScrollFrame)
                onScrollFrame(values);
        });
        this.detectScrolling();
    };
    Scrollbars.prototype.handleScrollStart = function () {
        var onScrollStart = this.props.onScrollStart;
        if (onScrollStart)
            onScrollStart();
        this.handleScrollStartAutoHide();
    };
    Scrollbars.prototype.handleScrollStartAutoHide = function () {
        var autoHide = this.props.autoHide;
        if (!autoHide)
            return;
        this.showTracks();
    };
    Scrollbars.prototype.handleScrollStop = function () {
        var onScrollStop = this.props.onScrollStop;
        if (onScrollStop)
            onScrollStop();
        this.handleScrollStopAutoHide();
    };
    Scrollbars.prototype.handleScrollStopAutoHide = function () {
        var autoHide = this.props.autoHide;
        if (!autoHide)
            return;
        this.hideTracks();
    };
    Scrollbars.prototype.handleWindowResize = function () {
        this.update();
    };
    Scrollbars.prototype.handleHorizontalTrackMouseDown = function (event) {
        if (!this.view)
            return;
        event.preventDefault();
        var target = event.target, clientX = event.clientX;
        var targetLeft = target.getBoundingClientRect().left;
        var thumbWidth = this.getThumbHorizontalWidth();
        var offset = Math.abs(targetLeft - clientX) - thumbWidth / 2;
        this.view.scrollLeft = this.getScrollLeftForOffset(offset);
    };
    Scrollbars.prototype.handleVerticalTrackMouseDown = function (event) {
        if (!this.view)
            return;
        event.preventDefault();
        var target = event.target, clientY = event.clientY;
        var targetTop = target.getBoundingClientRect().top;
        var thumbHeight = this.getThumbVerticalHeight();
        var offset = Math.abs(targetTop - clientY) - thumbHeight / 2;
        this.view.scrollTop = this.getScrollTopForOffset(offset);
    };
    Scrollbars.prototype.handleHorizontalThumbMouseDown = function (event) {
        event.preventDefault();
        this.handleDragStart(event);
        var target = event.target, clientX = event.clientX;
        var offsetWidth = target.offsetWidth;
        var left = target.getBoundingClientRect().left;
        this.prevPageX = offsetWidth - (clientX - left);
    };
    Scrollbars.prototype.handleVerticalThumbMouseDown = function (event) {
        event.preventDefault();
        this.handleDragStart(event);
        var target = event.target, clientY = event.clientY;
        var offsetHeight = target.offsetHeight;
        var top = target.getBoundingClientRect().top;
        this.prevPageY = offsetHeight - (clientY - top);
    };
    Scrollbars.prototype.setupDragging = function () {
        (0, dom_css_1.default)(document.body, this.styles.disableSelectStyle);
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.handleDragEnd);
        document.onselectstart = utils_1.returnFalse;
    };
    Scrollbars.prototype.teardownDragging = function () {
        (0, dom_css_1.default)(document.body, this.styles.disableSelectStyleReset);
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.onselectstart = null;
    };
    Scrollbars.prototype.handleDragStart = function (event) {
        this.dragging = true;
        event.stopImmediatePropagation();
        this.setupDragging();
    };
    Scrollbars.prototype.handleDrag = function (event) {
        if (this.prevPageX && this.trackHorizontal && this.view) {
            var clientX = event.clientX;
            var trackLeft = this.trackHorizontal.getBoundingClientRect().left;
            var thumbWidth = this.getThumbHorizontalWidth();
            var clickPosition = thumbWidth - this.prevPageX;
            var offset = -trackLeft + clientX - clickPosition;
            this.view.scrollLeft = this.getScrollLeftForOffset(offset);
        }
        if (this.prevPageY && this.trackVertical && this.view) {
            var clientY = event.clientY;
            var trackTop = this.trackVertical.getBoundingClientRect().top;
            var thumbHeight = this.getThumbVerticalHeight();
            var clickPosition = thumbHeight - this.prevPageY;
            var offset = -trackTop + clientY - clickPosition;
            this.view.scrollTop = this.getScrollTopForOffset(offset);
        }
        return false;
    };
    Scrollbars.prototype.handleDragEnd = function () {
        this.dragging = false;
        this.prevPageX = this.prevPageY = 0;
        this.teardownDragging();
        this.handleDragEndAutoHide();
    };
    Scrollbars.prototype.handleDragEndAutoHide = function () {
        var autoHide = this.props.autoHide;
        if (!autoHide)
            return;
        this.hideTracks();
    };
    Scrollbars.prototype.handleTrackMouseEnter = function () {
        this.trackMouseOver = true;
        this.handleTrackMouseEnterAutoHide();
    };
    Scrollbars.prototype.handleTrackMouseEnterAutoHide = function () {
        var autoHide = this.props.autoHide;
        if (!autoHide)
            return;
        this.showTracks();
    };
    Scrollbars.prototype.handleTrackMouseLeave = function () {
        this.trackMouseOver = false;
        this.handleTrackMouseLeaveAutoHide();
    };
    Scrollbars.prototype.handleTrackMouseLeaveAutoHide = function () {
        var autoHide = this.props.autoHide;
        if (!autoHide)
            return;
        this.hideTracks();
    };
    Scrollbars.prototype.showTracks = function () {
        clearTimeout(this.hideTracksTimeout);
        (0, dom_css_1.default)(this.trackHorizontal, { opacity: 1 });
        (0, dom_css_1.default)(this.trackVertical, { opacity: 1 });
    };
    Scrollbars.prototype.hideTracks = function () {
        var _this = this;
        if (this.dragging)
            return;
        if (this.scrolling)
            return;
        if (this.trackMouseOver)
            return;
        var autoHideTimeout = this.props.autoHideTimeout;
        clearTimeout(this.hideTracksTimeout);
        this.hideTracksTimeout = setTimeout(function () {
            (0, dom_css_1.default)(_this.trackHorizontal, { opacity: 0 });
            (0, dom_css_1.default)(_this.trackVertical, { opacity: 0 });
        }, autoHideTimeout);
    };
    Scrollbars.prototype.detectScrolling = function () {
        var _this = this;
        if (this.scrolling)
            return;
        this.scrolling = true;
        this.handleScrollStart();
        this.detectScrollingInterval = setInterval(function () {
            if (_this.lastViewScrollLeft === _this.viewScrollLeft &&
                _this.lastViewScrollTop === _this.viewScrollTop) {
                clearInterval(_this.detectScrollingInterval);
                _this.scrolling = false;
                _this.handleScrollStop();
            }
            _this.lastViewScrollLeft = _this.viewScrollLeft;
            _this.lastViewScrollTop = _this.viewScrollTop;
        }, 100);
    };
    Scrollbars.prototype.raf = function (callback) {
        var _this = this;
        if (this.requestFrame)
            raf_1.default.cancel(this.requestFrame);
        this.requestFrame = (0, raf_1.default)(function () {
            _this.requestFrame = undefined;
            callback();
        });
    };
    Scrollbars.prototype.update = function (callback) {
        var _this = this;
        this.raf(function () { return _this._update(callback); });
    };
    Scrollbars.prototype._update = function (callback) {
        var _a = this.props, onUpdate = _a.onUpdate, hideTracksWhenNotNeeded = _a.hideTracksWhenNotNeeded;
        var values = this.getValues();
        var freshScrollbarWidth = (0, utils_1.getScrollbarWidth)();
        if (this.state.scrollbarWidth !== freshScrollbarWidth) {
            this.setState({ scrollbarWidth: freshScrollbarWidth });
        }
        if (this.state.scrollbarWidth) {
            var scrollLeft = values.scrollLeft, clientWidth = values.clientWidth, scrollWidth = values.scrollWidth;
            var trackHorizontalWidth = (0, utils_1.getInnerWidth)(this.trackHorizontal);
            var thumbHorizontalWidth = this.getThumbHorizontalWidth();
            var thumbHorizontalX = (scrollLeft / (scrollWidth - clientWidth)) * (trackHorizontalWidth - thumbHorizontalWidth);
            var thumbHorizontalStyle = {
                width: thumbHorizontalWidth,
                transform: "translateX(".concat(thumbHorizontalX, "px)"),
            };
            var scrollTop = values.scrollTop, clientHeight = values.clientHeight, scrollHeight = values.scrollHeight;
            var trackVerticalHeight = (0, utils_1.getInnerHeight)(this.trackVertical);
            var thumbVerticalHeight = this.getThumbVerticalHeight();
            var thumbVerticalY = (scrollTop / (scrollHeight - clientHeight)) * (trackVerticalHeight - thumbVerticalHeight);
            var thumbVerticalStyle = {
                height: thumbVerticalHeight,
                transform: "translateY(".concat(thumbVerticalY, "px)"),
            };
            if (hideTracksWhenNotNeeded) {
                var trackHorizontalStyle = {
                    visibility: scrollWidth > clientWidth ? 'visible' : 'hidden',
                };
                var trackVerticalStyle = {
                    visibility: scrollHeight > clientHeight ? 'visible' : 'hidden',
                };
                (0, dom_css_1.default)(this.trackHorizontal, trackHorizontalStyle);
                (0, dom_css_1.default)(this.trackVertical, trackVerticalStyle);
            }
            (0, dom_css_1.default)(this.thumbHorizontal, thumbHorizontalStyle);
            (0, dom_css_1.default)(this.thumbVertical, thumbVerticalStyle);
        }
        if (onUpdate)
            onUpdate(values);
        if (typeof callback !== 'function')
            return;
        callback(values);
    };
    Scrollbars.prototype.render = function () {
        var _this = this;
        var _a = this.state, scrollbarWidth = _a.scrollbarWidth, didMountUniversal = _a.didMountUniversal;
        var _b = this.props, autoHeight = _b.autoHeight, autoHeightMax = _b.autoHeightMax, autoHeightMin = _b.autoHeightMin, autoHide = _b.autoHide, autoHideDuration = _b.autoHideDuration, autoHideTimeout = _b.autoHideTimeout, children = _b.children, classes = _b.classes, hideTracksWhenNotNeeded = _b.hideTracksWhenNotNeeded, onScroll = _b.onScroll, onScrollFrame = _b.onScrollFrame, onScrollStart = _b.onScrollStart, onScrollStop = _b.onScrollStop, onUpdate = _b.onUpdate, renderThumbHorizontal = _b.renderThumbHorizontal, renderThumbVertical = _b.renderThumbVertical, renderTrackHorizontal = _b.renderTrackHorizontal, renderTrackVertical = _b.renderTrackVertical, renderView = _b.renderView, style = _b.style, tagName = _b.tagName, thumbMinSize = _b.thumbMinSize, thumbSize = _b.thumbSize, universal = _b.universal, disableDefaultStyles = _b.disableDefaultStyles, props = __rest(_b, ["autoHeight", "autoHeightMax", "autoHeightMin", "autoHide", "autoHideDuration", "autoHideTimeout", "children", "classes", "hideTracksWhenNotNeeded", "onScroll", "onScrollFrame", "onScrollStart", "onScrollStop", "onUpdate", "renderThumbHorizontal", "renderThumbVertical", "renderTrackHorizontal", "renderTrackVertical", "renderView", "style", "tagName", "thumbMinSize", "thumbSize", "universal", "disableDefaultStyles"]);
        var _c = this.styles, containerStyleAutoHeight = _c.containerStyleAutoHeight, containerStyleDefault = _c.containerStyleDefault, thumbStyleDefault = _c.thumbStyleDefault, trackHorizontalStyleDefault = _c.trackHorizontalStyleDefault, trackVerticalStyleDefault = _c.trackVerticalStyleDefault, viewStyleAutoHeight = _c.viewStyleAutoHeight, viewStyleDefault = _c.viewStyleDefault, viewStyleUniversalInitial = _c.viewStyleUniversalInitial;
        var containerStyle = __assign(__assign(__assign({}, containerStyleDefault), (autoHeight && __assign(__assign({}, containerStyleAutoHeight), { minHeight: autoHeightMin, maxHeight: autoHeightMax }))), style);
        var viewStyle = __assign(__assign(__assign(__assign(__assign({}, viewStyleDefault), { marginRight: scrollbarWidth ? -scrollbarWidth : 0, marginBottom: scrollbarWidth ? -scrollbarWidth : 0 }), (autoHeight && __assign(__assign({}, viewStyleAutoHeight), { minHeight: typeof autoHeightMin === 'string'
                ? "calc(".concat(autoHeightMin, " + ").concat(scrollbarWidth, "px)")
                : autoHeightMin + scrollbarWidth, maxHeight: typeof autoHeightMax === 'string'
                ? "calc(".concat(autoHeightMax, " + ").concat(scrollbarWidth, "px)")
                : autoHeightMax + scrollbarWidth }))), (autoHeight &&
            universal &&
            !didMountUniversal && {
            minHeight: autoHeightMin,
            maxHeight: autoHeightMax,
        })), (universal && !didMountUniversal && viewStyleUniversalInitial));
        var trackAutoHeightStyle = {
            transition: "opacity ".concat(autoHideDuration, "ms"),
            opacity: 0,
        };
        var trackHorizontalStyle = __assign(__assign(__assign({}, trackHorizontalStyleDefault), (autoHide && trackAutoHeightStyle)), ((!scrollbarWidth || (universal && !didMountUniversal)) && {
            display: 'none',
        }));
        var trackVerticalStyle = __assign(__assign(__assign({}, trackVerticalStyleDefault), (autoHide && trackAutoHeightStyle)), ((!scrollbarWidth || (universal && !didMountUniversal)) && {
            display: 'none',
        }));
        var mergedClasses = (0, utils_1.getFinalClasses)(this.props);
        return (0, react_1.createElement)(tagName, __assign(__assign({}, props), { className: mergedClasses.root, style: containerStyle, ref: function (ref) {
                _this.container = ref;
            } }), [
            (0, react_1.cloneElement)(renderView({
                style: viewStyle,
                className: mergedClasses.view,
            }), {
                key: 'view',
                ref: function (ref) {
                    _this.view = ref;
                },
            }, children),
            (0, react_1.cloneElement)(renderTrackHorizontal({
                style: trackHorizontalStyle,
                className: mergedClasses.trackHorizontal,
            }), {
                key: 'trackHorizontal',
                ref: function (ref) {
                    _this.trackHorizontal = ref;
                },
            }, (0, react_1.cloneElement)(renderThumbHorizontal({
                style: thumbStyleDefault,
                className: mergedClasses.thumbHorizontal,
            }), {
                ref: function (ref) {
                    _this.thumbHorizontal = ref;
                },
            })),
            (0, react_1.cloneElement)(renderTrackVertical({
                style: trackVerticalStyle,
                className: mergedClasses.trackVertical,
            }), {
                key: 'trackVertical',
                ref: function (ref) {
                    _this.trackVertical = ref;
                },
            }, (0, react_1.cloneElement)(renderThumbVertical({
                style: thumbStyleDefault,
                className: mergedClasses.thumbVertical,
            }), {
                ref: function (ref) {
                    _this.thumbVertical = ref;
                },
            })),
        ]);
    };
    Scrollbars.defaultProps = {
        autoHeight: false,
        autoHeightMax: 200,
        autoHeightMin: 0,
        autoHide: false,
        autoHideDuration: 200,
        autoHideTimeout: 1000,
        disableDefaultStyles: false,
        hideTracksWhenNotNeeded: false,
        renderThumbHorizontal: function (props) { return React.createElement("div", __assign({}, props)); },
        renderThumbVertical: function (props) { return React.createElement("div", __assign({}, props)); },
        renderTrackHorizontal: function (props) { return React.createElement("div", __assign({}, props)); },
        renderTrackVertical: function (props) { return React.createElement("div", __assign({}, props)); },
        renderView: function (props) { return React.createElement("div", __assign({}, props)); },
        tagName: 'div',
        thumbMinSize: 30,
        universal: false,
    };
    return Scrollbars;
}(react_1.Component));
exports.Scrollbars = Scrollbars;
