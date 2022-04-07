'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var react = require('react');
var _omit = _interopDefault(require('lodash/omit'));
var _isNumber = _interopDefault(require('lodash/isNumber'));
var _filter = _interopDefault(require('lodash/filter'));
var core = require('@nivo/core');
var web = require('@react-spring/web');
var jsxRuntime = require('react/jsx-runtime');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

var defaultProps = {
  dotSize: 4,
  noteWidth: 120,
  noteTextOffset: 8,
  animate: true,
  motionStiffness: 90,
  motionDamping: 13
};

var isSvgNote = function isSvgNote(note) {
  var noteType = typeof note;
  return react.isValidElement(note) || noteType === 'string' || noteType === 'function' || noteType === 'object';
};
var isCanvasNote = function isCanvasNote(note) {
  var noteType = typeof note;
  return noteType === 'string' || noteType === 'function';
};
var isCircleAnnotation = function isCircleAnnotation(annotationSpec) {
  return annotationSpec.type === 'circle';
};
var isDotAnnotation = function isDotAnnotation(annotationSpec) {
  return annotationSpec.type === 'dot';
};
var isRectAnnotation = function isRectAnnotation(annotationSpec) {
  return annotationSpec.type === 'rect';
};

var bindAnnotations = function bindAnnotations(_ref) {
  var data = _ref.data,
      annotations = _ref.annotations,
      getPosition = _ref.getPosition,
      getDimensions = _ref.getDimensions;
  return annotations.reduce(function (acc, annotation) {
    var offset = annotation.offset || 0;
    return [].concat(_toConsumableArray(acc), _toConsumableArray(_filter(data, annotation.match).map(function (datum) {
      var position = getPosition(datum);
      var dimensions = getDimensions(datum);

      if (isCircleAnnotation(annotation) || isRectAnnotation(annotation)) {
        dimensions.size = dimensions.size + offset * 2;
        dimensions.width = dimensions.width + offset * 2;
        dimensions.height = dimensions.height + offset * 2;
      }

      return _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, _omit(annotation, ['match', 'offset'])), position), dimensions), {}, {
        size: annotation.size || dimensions.size,
        datum: datum
      });
    })));
  }, []);
};
var getLinkAngle = function getLinkAngle(sourceX, sourceY, targetX, targetY) {
  var angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  return core.absoluteAngleDegrees(core.radiansToDegrees(angle));
};
var computeAnnotation = function computeAnnotation(annotation) {
  var x = annotation.x,
      y = annotation.y,
      noteX = annotation.noteX,
      noteY = annotation.noteY,
      _annotation$noteWidth = annotation.noteWidth,
      noteWidth = _annotation$noteWidth === void 0 ? defaultProps.noteWidth : _annotation$noteWidth,
      _annotation$noteTextO = annotation.noteTextOffset,
      noteTextOffset = _annotation$noteTextO === void 0 ? defaultProps.noteTextOffset : _annotation$noteTextO;
  var computedNoteX;
  var computedNoteY;

  if (_isNumber(noteX)) {
    computedNoteX = x + noteX;
  } else if (noteX.abs !== undefined) {
    computedNoteX = noteX.abs;
  } else {
    throw new Error("noteX should be either a number or an object containing an 'abs' property");
  }

  if (_isNumber(noteY)) {
    computedNoteY = y + noteY;
  } else if (noteY.abs !== undefined) {
    computedNoteY = noteY.abs;
  } else {
    throw new Error("noteY should be either a number or an object containing an 'abs' property");
  }

  var computedX = x;
  var computedY = y;
  var angle = getLinkAngle(x, y, computedNoteX, computedNoteY);

  if (isCircleAnnotation(annotation)) {
    var position = core.positionFromAngle(core.degreesToRadians(angle), annotation.size / 2);
    computedX += position.x;
    computedY += position.y;
  }

  if (isRectAnnotation(annotation)) {
    var eighth = Math.round((angle + 90) / 45) % 8;

    if (eighth === 0) {
      computedY -= annotation.height / 2;
    }

    if (eighth === 1) {
      computedX += annotation.width / 2;
      computedY -= annotation.height / 2;
    }

    if (eighth === 2) {
      computedX += annotation.width / 2;
    }

    if (eighth === 3) {
      computedX += annotation.width / 2;
      computedY += annotation.height / 2;
    }

    if (eighth === 4) {
      computedY += annotation.height / 2;
    }

    if (eighth === 5) {
      computedX -= annotation.width / 2;
      computedY += annotation.height / 2;
    }

    if (eighth === 6) {
      computedX -= annotation.width / 2;
    }

    if (eighth === 7) {
      computedX -= annotation.width / 2;
      computedY -= annotation.height / 2;
    }
  }

  var textX = computedNoteX;
  var textY = computedNoteY - noteTextOffset;
  var noteLineX = computedNoteX;
  var noteLineY = computedNoteY;

  if ((angle + 90) % 360 > 180) {
    textX -= noteWidth;
    noteLineX -= noteWidth;
  } else {
    noteLineX += noteWidth;
  }

  return {
    points: [[computedX, computedY], [computedNoteX, computedNoteY], [noteLineX, noteLineY]],
    text: [textX, textY],
    angle: angle + 90
  };
};

var useAnnotations = function useAnnotations(_ref) {
  var data = _ref.data,
      annotations = _ref.annotations,
      getPosition = _ref.getPosition,
      getDimensions = _ref.getDimensions;
  return react.useMemo(function () {
    return bindAnnotations({
      data: data,
      annotations: annotations,
      getPosition: getPosition,
      getDimensions: getDimensions
    });
  }, [data, annotations, getPosition, getDimensions]);
};
var useComputedAnnotations = function useComputedAnnotations(_ref2) {
  var annotations = _ref2.annotations;
  return react.useMemo(function () {
    return annotations.map(function (annotation) {
      return _objectSpread2(_objectSpread2({}, annotation), {}, {
        computed: computeAnnotation(_objectSpread2({}, annotation))
      });
    });
  }, [annotations]);
};
var useComputedAnnotation = function useComputedAnnotation(annotation) {
  return react.useMemo(function () {
    return computeAnnotation(annotation);
  }, [annotation]);
};

var AnnotationNote = function AnnotationNote(_ref) {
  var datum = _ref.datum,
      x = _ref.x,
      y = _ref.y,
      note = _ref.note;
  var theme = core.useTheme();

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var animatedProps = web.useSpring({
    x: x,
    y: y,
    config: springConfig,
    immediate: !animate
  });

  if (typeof note === 'function') {
    return react.createElement(note, {
      x: x,
      y: y,
      datum: datum
    });
  }

  return jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [theme.annotations.text.outlineWidth > 0 && jsxRuntime.jsx(web.animated.text, {
      x: animatedProps.x,
      y: animatedProps.y,
      style: _objectSpread2(_objectSpread2({}, theme.annotations.text), {}, {
        strokeLinejoin: 'round',
        strokeWidth: theme.annotations.text.outlineWidth * 2,
        stroke: theme.annotations.text.outlineColor
      }),
      children: note
    }), jsxRuntime.jsx(web.animated.text, {
      x: animatedProps.x,
      y: animatedProps.y,
      style: _omit(theme.annotations.text, ['outlineWidth', 'outlineColor']),
      children: note
    })]
  });
};

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;
  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _toArray(arr) {
  return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest();
}

var AnnotationLink = function AnnotationLink(_ref) {
  var points = _ref.points,
      _ref$isOutline = _ref.isOutline,
      isOutline = _ref$isOutline === void 0 ? false : _ref$isOutline;
  var theme = core.useTheme();
  var path = react.useMemo(function () {
    var _points = _toArray(points),
        firstPoint = _points[0],
        otherPoints = _points.slice(1);

    return otherPoints.reduce(function (acc, _ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
          x = _ref3[0],
          y = _ref3[1];

      return "".concat(acc, " L").concat(x, ",").concat(y);
    }, "M".concat(firstPoint[0], ",").concat(firstPoint[1]));
  }, [points]);
  var animatedPath = core.useAnimatedPath(path);

  if (isOutline && theme.annotations.link.outlineWidth <= 0) {
    return null;
  }

  var style = _objectSpread2({}, theme.annotations.link);

  if (isOutline) {
    style.strokeLinecap = 'square';
    style.strokeWidth = theme.annotations.link.strokeWidth + theme.annotations.link.outlineWidth * 2;
    style.stroke = theme.annotations.link.outlineColor;
  }

  return jsxRuntime.jsx(web.animated.path, {
    fill: "none",
    d: animatedPath,
    style: style
  });
};

var CircleAnnotationOutline = function CircleAnnotationOutline(_ref) {
  var x = _ref.x,
      y = _ref.y,
      size = _ref.size;
  var theme = core.useTheme();

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var animatedProps = web.useSpring({
    x: x,
    y: y,
    radius: size / 2,
    config: springConfig,
    immediate: !animate
  });
  return jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [theme.annotations.outline.outlineWidth > 0 && jsxRuntime.jsx(web.animated.circle, {
      cx: animatedProps.x,
      cy: animatedProps.y,
      r: animatedProps.radius,
      style: _objectSpread2(_objectSpread2({}, theme.annotations.outline), {}, {
        fill: 'none',
        strokeWidth: theme.annotations.outline.strokeWidth + theme.annotations.outline.outlineWidth * 2,
        stroke: theme.annotations.outline.outlineColor
      })
    }), jsxRuntime.jsx(web.animated.circle, {
      cx: animatedProps.x,
      cy: animatedProps.y,
      r: animatedProps.radius,
      style: theme.annotations.outline
    })]
  });
};

var DotAnnotationOutline = function DotAnnotationOutline(_ref) {
  var x = _ref.x,
      y = _ref.y,
      _ref$size = _ref.size,
      size = _ref$size === void 0 ? defaultProps.dotSize : _ref$size;
  var theme = core.useTheme();

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var animatedProps = web.useSpring({
    x: x,
    y: y,
    radius: size / 2,
    config: springConfig,
    immediate: !animate
  });
  return jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [theme.annotations.outline.outlineWidth > 0 && jsxRuntime.jsx(web.animated.circle, {
      cx: animatedProps.x,
      cy: animatedProps.y,
      r: animatedProps.radius,
      style: _objectSpread2(_objectSpread2({}, theme.annotations.outline), {}, {
        fill: 'none',
        strokeWidth: theme.annotations.outline.outlineWidth * 2,
        stroke: theme.annotations.outline.outlineColor
      })
    }), jsxRuntime.jsx(web.animated.circle, {
      cx: animatedProps.x,
      cy: animatedProps.y,
      r: animatedProps.radius,
      style: theme.annotations.symbol
    })]
  });
};

var RectAnnotationOutline = function RectAnnotationOutline(_ref) {
  var x = _ref.x,
      y = _ref.y,
      width = _ref.width,
      height = _ref.height;
  var theme = core.useTheme();

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var animatedProps = web.useSpring({
    x: x - width / 2,
    y: y - height / 2,
    width: width,
    height: height,
    config: springConfig,
    immediate: !animate
  });
  return jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [theme.annotations.outline.outlineWidth > 0 && jsxRuntime.jsx(web.animated.rect, {
      x: animatedProps.x,
      y: animatedProps.y,
      width: animatedProps.width,
      height: animatedProps.height,
      style: _objectSpread2(_objectSpread2({}, theme.annotations.outline), {}, {
        fill: 'none',
        strokeWidth: theme.annotations.outline.strokeWidth + theme.annotations.outline.outlineWidth * 2,
        stroke: theme.annotations.outline.outlineColor
      })
    }), jsxRuntime.jsx(web.animated.rect, {
      x: animatedProps.x,
      y: animatedProps.y,
      width: animatedProps.width,
      height: animatedProps.height,
      style: theme.annotations.outline
    })]
  });
};

var Annotation = function Annotation(annotation) {
  var datum = annotation.datum,
      x = annotation.x,
      y = annotation.y,
      note = annotation.note;
  var computed = useComputedAnnotation(annotation);

  if (!isSvgNote(note)) {
    throw new Error('note should be a valid react element');
  }

  return jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [jsxRuntime.jsx(AnnotationLink, {
      points: computed.points,
      isOutline: true
    }), isCircleAnnotation(annotation) && jsxRuntime.jsx(CircleAnnotationOutline, {
      x: x,
      y: y,
      size: annotation.size
    }), isDotAnnotation(annotation) && jsxRuntime.jsx(DotAnnotationOutline, {
      x: x,
      y: y,
      size: annotation.size
    }), isRectAnnotation(annotation) && jsxRuntime.jsx(RectAnnotationOutline, {
      x: x,
      y: y,
      width: annotation.width,
      height: annotation.height
    }), jsxRuntime.jsx(AnnotationLink, {
      points: computed.points
    }), jsxRuntime.jsx(AnnotationNote, {
      datum: datum,
      x: computed.text[0],
      y: computed.text[1],
      note: note
    })]
  });
};

var drawPoints = function drawPoints(ctx, points) {
  points.forEach(function (_ref, index) {
    var _ref2 = _slicedToArray(_ref, 2),
        x = _ref2[0],
        y = _ref2[1];

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
};

var renderAnnotationsToCanvas = function renderAnnotationsToCanvas(ctx, _ref3) {
  var annotations = _ref3.annotations,
      theme = _ref3.theme;
  if (annotations.length === 0) return;
  ctx.save();
  annotations.forEach(function (annotation) {
    if (!isCanvasNote(annotation.note)) {
      throw new Error('note is invalid for canvas implementation');
    }

    if (theme.annotations.link.outlineWidth > 0) {
      ctx.lineCap = 'square';
      ctx.strokeStyle = theme.annotations.link.outlineColor;
      ctx.lineWidth = theme.annotations.link.strokeWidth + theme.annotations.link.outlineWidth * 2;
      ctx.beginPath();
      drawPoints(ctx, annotation.computed.points);
      ctx.stroke();
      ctx.lineCap = 'butt';
    }

    if (isCircleAnnotation(annotation) && theme.annotations.outline.outlineWidth > 0) {
      ctx.strokeStyle = theme.annotations.outline.outlineColor;
      ctx.lineWidth = theme.annotations.outline.strokeWidth + theme.annotations.outline.outlineWidth * 2;
      ctx.beginPath();
      ctx.arc(annotation.x, annotation.y, annotation.size / 2, 0, 2 * Math.PI);
      ctx.stroke();
    }

    if (isDotAnnotation(annotation) && theme.annotations.symbol.outlineWidth > 0) {
      ctx.strokeStyle = theme.annotations.symbol.outlineColor;
      ctx.lineWidth = theme.annotations.symbol.outlineWidth * 2;
      ctx.beginPath();
      ctx.arc(annotation.x, annotation.y, annotation.size / 2, 0, 2 * Math.PI);
      ctx.stroke();
    }

    if (isRectAnnotation(annotation) && theme.annotations.outline.outlineWidth > 0) {
      ctx.strokeStyle = theme.annotations.outline.outlineColor;
      ctx.lineWidth = theme.annotations.outline.strokeWidth + theme.annotations.outline.outlineWidth * 2;
      ctx.beginPath();
      ctx.rect(annotation.x - annotation.width / 2, annotation.y - annotation.height / 2, annotation.width, annotation.height);
      ctx.stroke();
    }

    ctx.strokeStyle = theme.annotations.link.stroke;
    ctx.lineWidth = theme.annotations.link.strokeWidth;
    ctx.beginPath();
    drawPoints(ctx, annotation.computed.points);
    ctx.stroke();

    if (isCircleAnnotation(annotation)) {
      ctx.strokeStyle = theme.annotations.outline.stroke;
      ctx.lineWidth = theme.annotations.outline.strokeWidth;
      ctx.beginPath();
      ctx.arc(annotation.x, annotation.y, annotation.size / 2, 0, 2 * Math.PI);
      ctx.stroke();
    }

    if (isDotAnnotation(annotation)) {
      ctx.fillStyle = theme.annotations.symbol.fill;
      ctx.beginPath();
      ctx.arc(annotation.x, annotation.y, annotation.size / 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (isRectAnnotation(annotation)) {
      ctx.strokeStyle = theme.annotations.outline.stroke;
      ctx.lineWidth = theme.annotations.outline.strokeWidth;
      ctx.beginPath();
      ctx.rect(annotation.x - annotation.width / 2, annotation.y - annotation.height / 2, annotation.width, annotation.height);
      ctx.stroke();
    }

    if (typeof annotation.note === 'function') {
      annotation.note(ctx, {
        datum: annotation.datum,
        x: annotation.computed.text[0],
        y: annotation.computed.text[1],
        theme: theme
      });
    } else {
      ctx.font = "".concat(theme.annotations.text.fontSize, "px ").concat(theme.annotations.text.fontFamily);
      ctx.fillStyle = theme.annotations.text.fill;
      ctx.strokeStyle = theme.annotations.text.outlineColor;
      ctx.lineWidth = theme.annotations.text.outlineWidth * 2;

      if (theme.annotations.text.outlineWidth > 0) {
        ctx.lineJoin = 'round';
        ctx.strokeText(annotation.note, annotation.computed.text[0], annotation.computed.text[1]);
        ctx.lineJoin = 'miter';
      }

      ctx.fillText(annotation.note, annotation.computed.text[0], annotation.computed.text[1]);
    }
  });
  ctx.restore();
};

exports.Annotation = Annotation;
exports.bindAnnotations = bindAnnotations;
exports.computeAnnotation = computeAnnotation;
exports.defaultProps = defaultProps;
exports.getLinkAngle = getLinkAngle;
exports.isCanvasNote = isCanvasNote;
exports.isCircleAnnotation = isCircleAnnotation;
exports.isDotAnnotation = isDotAnnotation;
exports.isRectAnnotation = isRectAnnotation;
exports.isSvgNote = isSvgNote;
exports.renderAnnotationsToCanvas = renderAnnotationsToCanvas;
exports.useAnnotations = useAnnotations;
exports.useComputedAnnotation = useComputedAnnotation;
exports.useComputedAnnotations = useComputedAnnotations;
//# sourceMappingURL=nivo-annotations.cjs.js.map
