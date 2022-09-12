'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var PropTypes = _interopDefault(require('prop-types'));
var Measure = _interopDefault(require('react-measure'));
var reactMotion = require('react-motion');
var core = require('@nivo/core');

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
var TOOLTIP_OFFSET = 14;
var tooltipStyle = {
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 10,
  top: 0,
  left: 0
};
var TooltipWrapper = React.memo(function (_ref) {
  var position = _ref.position,
      anchor = _ref.anchor,
      children = _ref.children;
  var _useState = React.useState(null),
      _useState2 = _slicedToArray(_useState, 2),
      dimensions = _useState2[0],
      setDimensions = _useState2[1];
  var theme = core.useTheme();
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.springConfig;
  var x = Math.round(position[0]);
  var y = Math.round(position[1]);
  if (dimensions !== null) {
    if (anchor === 'top') {
      x -= dimensions[0] / 2;
      y -= dimensions[1] + TOOLTIP_OFFSET;
    } else if (anchor === 'right') {
      x += TOOLTIP_OFFSET;
      y -= dimensions[1] / 2;
    } else if (anchor === 'bottom') {
      x -= dimensions[0] / 2;
      y += TOOLTIP_OFFSET;
    } else if (anchor === 'left') {
      x -= dimensions[0] + TOOLTIP_OFFSET;
      y -= dimensions[1] / 2;
    } else if (anchor === 'center') {
      x -= dimensions[0] / 2;
      y -= dimensions[1] / 2;
    }
  }
  var style = React.useMemo(function () {
    return _objectSpread({}, tooltipStyle, theme.tooltip, {
      transform: "translate(".concat(x, "px, ").concat(y, "px)"),
      opacity: dimensions === null ? 0 : 1
    });
  }, [x, y, dimensions, theme.tooltip]);
  if (animate !== true || dimensions === null) {
    return React__default.createElement(Measure, {
      client: false,
      offset: false,
      bounds: true,
      margin: false,
      onResize: function onResize(_ref2) {
        var bounds = _ref2.bounds;
        setDimensions([bounds.width, bounds.height]);
      }
    }, function (_ref3) {
      var measureRef = _ref3.measureRef;
      return React__default.createElement("div", {
        ref: measureRef,
        style: style
      }, children);
    });
  }
  return React__default.createElement(reactMotion.Motion, {
    style: {
      x: reactMotion.spring(x, springConfig),
      y: reactMotion.spring(y, springConfig)
    }
  }, function (animatedPosition) {
    return React__default.createElement(Measure, {
      client: false,
      offset: false,
      bounds: true,
      margin: false,
      onResize: function onResize(_ref4) {
        var bounds = _ref4.bounds;
        setDimensions([bounds.width, bounds.height]);
      }
    }, function (_ref5) {
      var measureRef = _ref5.measureRef;
      return React__default.createElement("div", {
        ref: measureRef,
        style: _objectSpread({}, tooltipStyle, theme.tooltip, {
          transform: "translate3d(".concat(animatedPosition.x, "px, ").concat(animatedPosition.y, "px, 0)")
        })
      }, children);
    });
  });
});
TooltipWrapper.displayName = 'TooltipWrapper';
TooltipWrapper.propTypes = {
  position: PropTypes.array.isRequired,
  anchor: PropTypes.oneOf(['top', 'right', 'bottom', 'left', 'center']).isRequired,
  children: PropTypes.node.isRequired
};
TooltipWrapper.defaultProps = {
  anchor: 'top'
};

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }
function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var Chip = React.memo(function (_ref) {
  var size = _ref.size,
      color = _ref.color,
      style = _ref.style;
  return React__default.createElement("span", {
    style: _objectSpread$1({
      display: 'block',
      width: size,
      height: size,
      background: color
    }, style)
  });
});
Chip.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  style: PropTypes.object.isRequired
};
Chip.defaultProps = {
  size: 12,
  style: {}
};
Chip.displayName = 'Chip';

var BasicTooltip = React.memo(function (_ref) {
  var id = _ref.id,
      _value = _ref.value,
      format = _ref.format,
      enableChip = _ref.enableChip,
      color = _ref.color,
      renderContent = _ref.renderContent;
  var theme = core.useTheme();
  var formatValue = core.useValueFormatter(format);
  var content;
  if (typeof renderContent === 'function') {
    content = renderContent();
  } else {
    var value = _value;
    if (formatValue !== undefined && value !== undefined) {
      value = formatValue(value);
    }
    content = React__default.createElement("div", {
      style: theme.tooltip.basic
    }, enableChip && React__default.createElement(Chip, {
      color: color,
      style: theme.tooltip.chip
    }), value !== undefined ? React__default.createElement("span", null, id, ": ", React__default.createElement("strong", null, isNaN(value) ? String(value) : value)) : id);
  }
  return React__default.createElement("div", {
    style: theme.tooltip.container
  }, content);
});
BasicTooltip.displayName = 'BasicTooltip';
BasicTooltip.propTypes = {
  id: PropTypes.node.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  enableChip: PropTypes.bool.isRequired,
  color: PropTypes.string,
  format: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  renderContent: PropTypes.func
};
BasicTooltip.defaultProps = {
  enableChip: false
};

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } return target; }
function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};
var TableTooltip = React.memo(function (_ref) {
  var title = _ref.title,
      rows = _ref.rows,
      renderContent = _ref.renderContent;
  var theme = core.useTheme();
  if (!rows.length) return null;
  var content;
  if (typeof renderContent === 'function') {
    content = renderContent();
  } else {
    content = React__default.createElement("div", null, title && title, React__default.createElement("table", {
      style: _objectSpread$2({}, tableStyle, theme.tooltip.table)
    }, React__default.createElement("tbody", null, rows.map(function (row, i) {
      return React__default.createElement("tr", {
        key: i
      }, row.map(function (column, j) {
        return React__default.createElement("td", {
          key: j,
          style: theme.tooltip.tableCell
        }, column);
      }));
    }))));
  }
  return React__default.createElement("div", {
    style: theme.tooltip.container
  }, content);
});
TableTooltip.propTypes = {
  title: PropTypes.node,
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.node)).isRequired,
  renderContent: PropTypes.func
};
TableTooltip.displayName = 'TableTooltip';

var crosshairTypes = ['x', 'y', 'top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'cross'];
var crosshairPropTypes = {
  type: PropTypes.oneOf(crosshairTypes)
};

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$3(target, key, source[key]); }); } return target; }
function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var CrosshairLine = React.memo(function (_ref) {
  var x0 = _ref.x0,
      x1 = _ref.x1,
      y0 = _ref.y0,
      y1 = _ref.y1;
  var theme = core.useTheme();
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.springConfig;
  var style = React.useMemo(function () {
    return _objectSpread$3({}, theme.crosshair.line, {
      pointerEvents: 'none'
    });
  }, [theme.crosshair.line]);
  if (animate !== true) {
    return React__default.createElement("line", {
      x1: x0,
      x2: x1,
      y1: y0,
      y2: y1,
      fill: "none",
      style: style
    });
  }
  return React__default.createElement(reactMotion.Motion, {
    style: {
      x0: reactMotion.spring(x0, springConfig),
      x1: reactMotion.spring(x1, springConfig),
      y0: reactMotion.spring(y0, springConfig),
      y1: reactMotion.spring(y1, springConfig)
    }
  }, function (line) {
    return React__default.createElement("line", {
      x1: line.x0,
      x2: line.x1,
      y1: line.y0,
      y2: line.y1,
      fill: "none",
      style: style
    });
  });
});
CrosshairLine.displayName = 'CrosshairLine';
CrosshairLine.propTypes = {
  x0: PropTypes.number.isRequired,
  x1: PropTypes.number.isRequired,
  y0: PropTypes.number.isRequired,
  y1: PropTypes.number.isRequired
};

var Crosshair = React.memo(function (_ref) {
  var width = _ref.width,
      height = _ref.height,
      type = _ref.type,
      x = _ref.x,
      y = _ref.y;
  var xLine;
  var yLine;
  if (type === 'cross') {
    xLine = {
      x0: x,
      x1: x,
      y0: 0,
      y1: height
    };
    yLine = {
      x0: 0,
      x1: width,
      y0: y,
      y1: y
    };
  } else if (type === 'top-left') {
    xLine = {
      x0: x,
      x1: x,
      y0: 0,
      y1: y
    };
    yLine = {
      x0: 0,
      x1: x,
      y0: y,
      y1: y
    };
  } else if (type === 'top') {
    xLine = {
      x0: x,
      x1: x,
      y0: 0,
      y1: y
    };
  } else if (type === 'top-right') {
    xLine = {
      x0: x,
      x1: x,
      y0: 0,
      y1: y
    };
    yLine = {
      x0: x,
      x1: width,
      y0: y,
      y1: y
    };
  } else if (type === 'right') {
    yLine = {
      x0: x,
      x1: width,
      y0: y,
      y1: y
    };
  } else if (type === 'bottom-right') {
    xLine = {
      x0: x,
      x1: x,
      y0: y,
      y1: height
    };
    yLine = {
      x0: x,
      x1: width,
      y0: y,
      y1: y
    };
  } else if (type === 'bottom') {
    xLine = {
      x0: x,
      x1: x,
      y0: y,
      y1: height
    };
  } else if (type === 'bottom-left') {
    xLine = {
      x0: x,
      x1: x,
      y0: y,
      y1: height
    };
    yLine = {
      x0: 0,
      x1: x,
      y0: y,
      y1: y
    };
  } else if (type === 'left') {
    yLine = {
      x0: 0,
      x1: x,
      y0: y,
      y1: y
    };
  } else if (type === 'x') {
    xLine = {
      x0: x,
      x1: x,
      y0: 0,
      y1: height
    };
  } else if (type === 'y') {
    yLine = {
      x0: 0,
      x1: width,
      y0: y,
      y1: y
    };
  }
  return React__default.createElement(React__default.Fragment, null, xLine && React__default.createElement(CrosshairLine, {
    x0: xLine.x0,
    x1: xLine.x1,
    y0: xLine.y0,
    y1: xLine.y1
  }), yLine && React__default.createElement(CrosshairLine, {
    x0: yLine.x0,
    x1: yLine.x1,
    y0: yLine.y0,
    y1: yLine.y1
  }));
});
Crosshair.displayName = 'Crosshair';
Crosshair.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  type: crosshairPropTypes.type.isRequired
};
Crosshair.defaultProps = {
  type: 'cross'
};

var tooltipContext = React.createContext();

function _slicedToArray$1(arr, i) { return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _nonIterableRest$1(); }
function _nonIterableRest$1() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit$1(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$1(arr) { if (Array.isArray(arr)) return arr; }
var useTooltipHandlers = function useTooltipHandlers(container) {
  var _useState = React.useState({
    isVisible: false,
    content: null,
    position: {}
  }),
      _useState2 = _slicedToArray$1(_useState, 2),
      state = _useState2[0],
      setState = _useState2[1];
  var showTooltipAt = React.useCallback(function (content, _ref, anchor) {
    var _ref2 = _slicedToArray$1(_ref, 2),
        x = _ref2[0],
        y = _ref2[1];
    setState({
      isVisible: true,
      position: [x, y],
      anchor: anchor,
      content: content
    });
  }, []);
  var showTooltipFromEvent = React.useCallback(function (content, event, anchor) {
    var bounds = container.current.getBoundingClientRect();
    var x = event.clientX - bounds.left;
    var y = event.clientY - bounds.top;
    if (anchor === 'left' || anchor === 'right') {
      if (x < bounds.width / 2) anchor = 'right';else anchor = 'left';
    }
    setState({
      isVisible: true,
      position: [x, y],
      anchor: anchor,
      content: content
    });
  }, [container]);
  var hideTooltip = React.useCallback(function () {
    setState({
      isVisible: false,
      content: null
    });
  });
  return {
    showTooltipAt: showTooltipAt,
    showTooltipFromEvent: showTooltipFromEvent,
    hideTooltip: hideTooltip,
    isTooltipVisible: state.isVisible,
    tooltipPosition: state.position,
    tooltipAnchor: state.anchor,
    tooltipContent: state.content
  };
};
var useTooltip = function useTooltip() {
  return React.useContext(tooltipContext);
};

exports.BasicTooltip = BasicTooltip;
exports.Chip = Chip;
exports.Crosshair = Crosshair;
exports.TableTooltip = TableTooltip;
exports.TooltipWrapper = TooltipWrapper;
exports.crosshairPropTypes = crosshairPropTypes;
exports.crosshairTypes = crosshairTypes;
exports.tooltipContext = tooltipContext;
exports.useTooltip = useTooltip;
exports.useTooltipHandlers = useTooltipHandlers;
