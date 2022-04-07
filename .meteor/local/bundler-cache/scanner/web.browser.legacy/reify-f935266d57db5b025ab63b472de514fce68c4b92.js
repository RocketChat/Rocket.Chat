'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var core = require('@nivo/core');
var d3Scale = require('d3-scale');
var d3Delaunay = require('d3-delaunay');
var compose = _interopDefault(require('recompose/compose'));
var defaultProps = _interopDefault(require('recompose/defaultProps'));
var withPropsOnChange = _interopDefault(require('recompose/withPropsOnChange'));
var pure = _interopDefault(require('recompose/pure'));
var PropTypes = _interopDefault(require('prop-types'));

var VoronoiPropTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  })).isRequired,
  xDomain: PropTypes.arrayOf(PropTypes.number).isRequired,
  yDomain: PropTypes.arrayOf(PropTypes.number).isRequired,
  layers: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.oneOf(['links', 'cells', 'points', 'bounds']), PropTypes.func])).isRequired,
  enableLinks: PropTypes.bool.isRequired,
  linkLineWidth: PropTypes.number.isRequired,
  linkLineColor: PropTypes.string.isRequired,
  enableCells: PropTypes.bool.isRequired,
  cellLineWidth: PropTypes.number.isRequired,
  cellLineColor: PropTypes.string.isRequired,
  enablePoints: PropTypes.bool.isRequired,
  pointSize: PropTypes.number.isRequired,
  pointColor: PropTypes.string.isRequired,
  delaunay: PropTypes.object.isRequired,
  voronoi: PropTypes.object.isRequired
};
var VoronoiDefaultProps = {
  xDomain: [0, 1],
  yDomain: [0, 1],
  layers: ['links', 'cells', 'points', 'bounds'],
  enableLinks: false,
  linkLineWidth: 1,
  linkLineColor: '#bbb',
  enableCells: true,
  cellLineWidth: 2,
  cellLineColor: '#000',
  enablePoints: true,
  pointSize: 4,
  pointColor: '#666'
};

var enhance = (function (Component) {
  return compose(defaultProps(VoronoiDefaultProps), core.withTheme(), core.withDimensions(), withPropsOnChange(['xDomain', 'yDomain', 'width', 'height'], function (_ref) {
    var xDomain = _ref.xDomain,
        yDomain = _ref.yDomain,
        width = _ref.width,
        height = _ref.height;
    return {
      xScale: d3Scale.scaleLinear().domain(xDomain).range([0, width]),
      yScale: d3Scale.scaleLinear().domain(yDomain).range([0, height])
    };
  }), withPropsOnChange(['data', 'xScale', 'yScale'], function (_ref2) {
    var data = _ref2.data,
        xScale = _ref2.xScale,
        yScale = _ref2.yScale;
    return {
      scaledPoints: data.map(function (d) {
        return {
          data: d,
          x: xScale(d.x),
          y: yScale(d.y)
        };
      })
    };
  }), withPropsOnChange(['scaledPoints', 'width', 'height'], function (_ref3) {
    var scaledPoints = _ref3.scaledPoints,
        width = _ref3.width,
        height = _ref3.height;
    var delaunay = d3Delaunay.Delaunay.from(scaledPoints.map(function (p) {
      return [p.x, p.y];
    }));
    var voronoi = delaunay.voronoi([0, 0, width, height]);
    return {
      delaunay: delaunay,
      voronoi: voronoi
    };
  }), pure)(Component);
});

var Voronoi = function Voronoi(_ref) {
  var delaunay = _ref.delaunay,
      voronoi = _ref.voronoi,
      data = _ref.data,
      layers = _ref.layers,
      margin = _ref.margin,
      width = _ref.width,
      height = _ref.height,
      outerWidth = _ref.outerWidth,
      outerHeight = _ref.outerHeight,
      enableLinks = _ref.enableLinks,
      linkLineWidth = _ref.linkLineWidth,
      linkLineColor = _ref.linkLineColor,
      enableCells = _ref.enableCells,
      cellLineWidth = _ref.cellLineWidth,
      cellLineColor = _ref.cellLineColor,
      enablePoints = _ref.enablePoints,
      pointSize = _ref.pointSize,
      pointColor = _ref.pointColor,
      theme = _ref.theme;
  var context = {
    width: width,
    height: height,
    data: data,
    delaunay: delaunay,
    voronoi: voronoi
  };
  var layerById = {
    bounds: React__default.createElement("path", {
      key: "bounds",
      fill: "none",
      stroke: cellLineColor,
      strokeWidth: cellLineWidth,
      d: voronoi.renderBounds()
    })
  };
  if (enableLinks === true) {
    layerById.links = React__default.createElement("path", {
      key: "links",
      stroke: linkLineColor,
      strokeWidth: linkLineWidth,
      fill: "none",
      d: delaunay.render()
    });
  }
  if (enableCells === true) {
    layerById.cells = React__default.createElement("path", {
      key: "cells",
      d: voronoi.render(),
      fill: "none",
      stroke: cellLineColor,
      strokeWidth: cellLineWidth
    });
  }
  if (enablePoints === true) {
    layerById.points = React__default.createElement("path", {
      key: "points",
      stroke: "none",
      fill: pointColor,
      d: delaunay.renderPoints(undefined, pointSize / 2)
    });
  }
  return React__default.createElement(core.Container, {
    isInteractive: false,
    theme: theme,
    animate: false
  }, function () {
    return (
      React__default.createElement(core.SvgWrapper, {
        width: outerWidth,
        height: outerHeight,
        margin: margin,
        theme: theme
      }, layers.map(function (layer, i) {
        if (typeof layer === 'function') {
          return React__default.createElement(React.Fragment, {
            key: i
          }, layer(context));
        }
        return layerById[layer];
      }))
    );
  });
};
Voronoi.propTypes = VoronoiPropTypes;
var Voronoi$1 = enhance(Voronoi);

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
var ResponsiveVoronoi = function ResponsiveVoronoi(props) {
  return React__default.createElement(core.ResponsiveWrapper, null, function (_ref) {
    var width = _ref.width,
        height = _ref.height;
    return React__default.createElement(Voronoi$1, _extends({
      width: width,
      height: height
    }, props));
  });
};

var getAccessor = function getAccessor(directive) {
  return typeof directive === 'function' ? directive : function (d) {
    return d[directive];
  };
};
var computeMeshPoints = function computeMeshPoints(_ref) {
  var points = _ref.points,
      _ref$x = _ref.x,
      x = _ref$x === void 0 ? 'x' : _ref$x,
      _ref$y = _ref.y,
      y = _ref$y === void 0 ? 'y' : _ref$y;
  var getX = getAccessor(x);
  var getY = getAccessor(y);
  return points.map(function (p) {
    return [getX(p), getY(p)];
  });
};
var computeMesh = function computeMesh(_ref2) {
  var points = _ref2.points,
      width = _ref2.width,
      height = _ref2.height,
      debug = _ref2.debug;
  var delaunay = d3Delaunay.Delaunay.from(points);
  var voronoi = debug === true ? delaunay.voronoi([0, 0, width, height]) : undefined;
  return {
    delaunay: delaunay,
    voronoi: voronoi
  };
};

var useVoronoiMesh = function useVoronoiMesh(_ref) {
  var points = _ref.points,
      x = _ref.x,
      y = _ref.y,
      width = _ref.width,
      height = _ref.height,
      debug = _ref.debug;
  var points2d = React.useMemo(function () {
    return computeMeshPoints({
      points: points,
      x: x,
      y: y
    });
  }, [points, x, y]);
  return React.useMemo(function () {
    return computeMesh({
      points: points2d,
      width: width,
      height: height,
      debug: debug
    });
  }, [points2d, width, height, debug]);
};

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
var Mesh = function Mesh(_ref) {
  var nodes = _ref.nodes,
      width = _ref.width,
      height = _ref.height,
      x = _ref.x,
      y = _ref.y,
      debug = _ref.debug,
      onMouseEnter = _ref.onMouseEnter,
      onMouseMove = _ref.onMouseMove,
      onMouseLeave = _ref.onMouseLeave,
      onClick = _ref.onClick;
  var elementRef = React.useRef(null);
  var _useState = React.useState(null),
      _useState2 = _slicedToArray(_useState, 2),
      currentIndex = _useState2[0],
      setCurrentIndex = _useState2[1];
  var _useVoronoiMesh = useVoronoiMesh({
    points: nodes,
    x: x,
    y: y,
    width: width,
    height: height,
    debug: debug
  }),
      delaunay = _useVoronoiMesh.delaunay,
      voronoi = _useVoronoiMesh.voronoi;
  var voronoiPath = React.useMemo(function () {
    return debug ? voronoi.render() : undefined;
  });
  var getIndexAndNodeFromEvent = React.useCallback(function (event) {
    var _getRelativeCursor = core.getRelativeCursor(elementRef.current, event),
        _getRelativeCursor2 = _slicedToArray(_getRelativeCursor, 2),
        x = _getRelativeCursor2[0],
        y = _getRelativeCursor2[1];
    var index = delaunay.find(x, y);
    return [index, index !== undefined ? nodes[index] : null];
  }, [delaunay]);
  var handleMouseEnter = React.useCallback(function (event) {
    var _getIndexAndNodeFromE = getIndexAndNodeFromEvent(event),
        _getIndexAndNodeFromE2 = _slicedToArray(_getIndexAndNodeFromE, 2),
        index = _getIndexAndNodeFromE2[0],
        node = _getIndexAndNodeFromE2[1];
    if (currentIndex !== index) setCurrentIndex(index);
    node && onMouseEnter && onMouseEnter(node, event);
  }, [getIndexAndNodeFromEvent, setCurrentIndex]);
  var handleMouseMove = React.useCallback(function (event) {
    var _getIndexAndNodeFromE3 = getIndexAndNodeFromEvent(event),
        _getIndexAndNodeFromE4 = _slicedToArray(_getIndexAndNodeFromE3, 2),
        index = _getIndexAndNodeFromE4[0],
        node = _getIndexAndNodeFromE4[1];
    if (currentIndex !== index) setCurrentIndex(index);
    node && onMouseMove && onMouseMove(node, event);
  }, [getIndexAndNodeFromEvent, setCurrentIndex]);
  var handleMouseLeave = React.useCallback(function (event) {
    setCurrentIndex(null);
    if (onMouseLeave) {
      var previousNode;
      if (currentIndex !== undefined && currentIndex !== null) {
        previousNode = nodes[currentIndex];
      }
      previousNode && onMouseLeave(previousNode, event);
    }
  }, [setCurrentIndex, currentIndex, nodes]);
  var handleClick = React.useCallback(function (event) {
    var _getIndexAndNodeFromE5 = getIndexAndNodeFromEvent(event),
        _getIndexAndNodeFromE6 = _slicedToArray(_getIndexAndNodeFromE5, 2),
        index = _getIndexAndNodeFromE6[0],
        node = _getIndexAndNodeFromE6[1];
    if (currentIndex !== index) setCurrentIndex(index);
    onClick && onClick(node, event);
  }, [getIndexAndNodeFromEvent, setCurrentIndex]);
  return React__default.createElement("g", {
    ref: elementRef
  }, debug && React__default.createElement("path", {
    d: voronoiPath,
    stroke: "red",
    strokeWidth: 1,
    opacity: 0.75
  }), currentIndex !== null && debug && React__default.createElement("path", {
    fill: "red",
    opacity: 0.35,
    d: voronoi.renderCell(currentIndex)
  }), React__default.createElement("rect", {
    width: width,
    height: height,
    fill: "red",
    opacity: 0,
    style: {
      cursor: 'auto'
    },
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick
  }));
};
Mesh.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  nodes: PropTypes.array.isRequired,
  x: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.func]).isRequired,
  y: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.func]).isRequired,
  onMouseEnter: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
  debug: PropTypes.bool.isRequired
};
Mesh.defaultProps = {
  x: 'x',
  y: 'y',
  debug: false
};

var renderVoronoiToCanvas = function renderVoronoiToCanvas(ctx, voronoi) {
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  voronoi.render(ctx);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
};
var renderVoronoiCellToCanvas = function renderVoronoiCellToCanvas(ctx, voronoi, index) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  voronoi.renderCell(index, ctx);
  ctx.fillStyle = 'red';
  ctx.fill();
  ctx.restore();
};

exports.Mesh = Mesh;
exports.ResponsiveVoronoi = ResponsiveVoronoi;
exports.Voronoi = Voronoi$1;
exports.VoronoiDefaultProps = VoronoiDefaultProps;
exports.VoronoiPropTypes = VoronoiPropTypes;
exports.computeMesh = computeMesh;
exports.computeMeshPoints = computeMeshPoints;
exports.renderVoronoiCellToCanvas = renderVoronoiCellToCanvas;
exports.renderVoronoiToCanvas = renderVoronoiToCanvas;
exports.useVoronoiMesh = useVoronoiMesh;
