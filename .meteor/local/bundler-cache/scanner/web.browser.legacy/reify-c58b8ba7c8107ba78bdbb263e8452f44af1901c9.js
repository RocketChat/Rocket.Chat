'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');
var core = require('@nivo/core');
var colors = require('@nivo/colors');
var web = require('@react-spring/web');
var jsxRuntime = require('react/jsx-runtime');
var d3Shape = require('d3-shape');

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

var getNormalizedAngle = function getNormalizedAngle(angle) {
  var normalizedAngle = angle % (Math.PI * 2);

  if (normalizedAngle < 0) {
    normalizedAngle += Math.PI * 2;
  }

  return normalizedAngle;
};
var filterDataBySkipAngle = function filterDataBySkipAngle(data, skipAngle) {
  return data.filter(function (datum) {
    return Math.abs(core.radiansToDegrees(datum.arc.endAngle - datum.arc.startAngle)) >= skipAngle;
  });
};
var useFilteredDataBySkipAngle = function useFilteredDataBySkipAngle(data, skipAngle) {
  return react.useMemo(function () {
    return filterDataBySkipAngle(data, skipAngle);
  }, [data, skipAngle]);
};

var arcTransitionModes = ['startAngle', 'middleAngle', 'endAngle', 'innerRadius', 'centerRadius', 'outerRadius', 'pushIn', 'pushOut'];
var arcTransitionModeById = {
  startAngle: {
    enter: function enter(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        endAngle: arc.startAngle
      });
    },
    update: function update(arc) {
      return arc;
    },
    leave: function leave(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        startAngle: arc.endAngle
      });
    }
  },
  middleAngle: {
    enter: function enter(arc) {
      var middleAngle = arc.startAngle + (arc.endAngle - arc.startAngle) / 2;
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        startAngle: middleAngle,
        endAngle: middleAngle
      });
    },
    update: function update(arc) {
      return arc;
    },
    leave: function leave(arc) {
      var middleAngle = arc.startAngle + (arc.endAngle - arc.startAngle) / 2;
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        startAngle: middleAngle,
        endAngle: middleAngle
      });
    }
  },
  endAngle: {
    enter: function enter(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        startAngle: arc.endAngle
      });
    },
    update: function update(arc) {
      return arc;
    },
    leave: function leave(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        endAngle: arc.startAngle
      });
    }
  },
  innerRadius: {
    enter: function enter(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        outerRadius: arc.innerRadius
      });
    },
    update: function update(arc) {
      return arc;
    },
    leave: function leave(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        innerRadius: arc.outerRadius
      });
    }
  },
  centerRadius: {
    enter: function enter(arc) {
      var centerRadius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) / 2;
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        innerRadius: centerRadius,
        outerRadius: centerRadius
      });
    },
    update: function update(arc) {
      return arc;
    },
    leave: function leave(arc) {
      var centerRadius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) / 2;
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        innerRadius: centerRadius,
        outerRadius: centerRadius
      });
    }
  },
  outerRadius: {
    enter: function enter(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        innerRadius: arc.outerRadius
      });
    },
    update: function update(arc) {
      return arc;
    },
    leave: function leave(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        outerRadius: arc.innerRadius
      });
    }
  },
  pushIn: {
    enter: function enter(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        innerRadius: arc.innerRadius - arc.outerRadius + arc.innerRadius,
        outerRadius: arc.innerRadius
      });
    },
    update: function update(arc) {
      return arc;
    },
    leave: function leave(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        innerRadius: arc.outerRadius,
        outerRadius: arc.outerRadius + arc.outerRadius - arc.innerRadius
      });
    }
  },
  pushOut: {
    enter: function enter(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        innerRadius: arc.outerRadius,
        outerRadius: arc.outerRadius + arc.outerRadius - arc.innerRadius
      });
    },
    update: function update(arc) {
      return arc;
    },
    leave: function leave(arc) {
      return _objectSpread2(_objectSpread2({}, arc), {}, {
        innerRadius: arc.innerRadius - arc.outerRadius + arc.innerRadius,
        outerRadius: arc.innerRadius
      });
    }
  }
};
var useArcTransitionMode = function useArcTransitionMode(mode, extraTransition) {
  return react.useMemo(function () {
    var transitionMode = arcTransitionModeById[mode];
    return {
      enter: function enter(datum) {
        return _objectSpread2(_objectSpread2({
          progress: 0
        }, transitionMode.enter(datum.arc)), extraTransition ? extraTransition.enter(datum) : {});
      },
      update: function update(datum) {
        return _objectSpread2(_objectSpread2({
          progress: 1
        }, transitionMode.update(datum.arc)), extraTransition ? extraTransition.update(datum) : {});
      },
      leave: function leave(datum) {
        return _objectSpread2(_objectSpread2({
          progress: 0
        }, transitionMode.leave(datum.arc)), extraTransition ? extraTransition.leave(datum) : {});
      }
    };
  }, [mode, extraTransition]);
};

var computeArcCenter = function computeArcCenter(arc, offset) {
  var angle = core.midAngle(arc) - Math.PI / 2;
  var radius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) * offset;
  return core.positionFromAngle(angle, radius);
};
var interpolateArcCenter = function interpolateArcCenter(offset) {
  return function (startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue) {
    return web.to([startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue], function (startAngle, endAngle, innerRadius, outerRadius) {
      var centroid = computeArcCenter({
        startAngle: startAngle,
        endAngle: endAngle,
        innerRadius: innerRadius,
        outerRadius: outerRadius
      }, offset);
      return "translate(".concat(centroid.x, ",").concat(centroid.y, ")");
    });
  };
};
var useArcCentersTransition = function useArcCentersTransition(data) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.5;
  var mode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'innerRadius';
  var extra = arguments.length > 3 ? arguments[3] : undefined;

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var phases = useArcTransitionMode(mode, extra);
  var transition = web.useTransition(data, {
    keys: function keys(datum) {
      return datum.id;
    },
    initial: phases.update,
    from: phases.enter,
    enter: phases.update,
    update: phases.update,
    leave: phases.leave,
    config: springConfig,
    immediate: !animate
  });
  return {
    transition: transition,
    interpolate: interpolateArcCenter(offset)
  };
};
var useArcCenters = function useArcCenters(_ref) {
  var data = _ref.data,
      _ref$offset = _ref.offset,
      offset = _ref$offset === void 0 ? 0.5 : _ref$offset,
      _ref$skipAngle = _ref.skipAngle,
      skipAngle = _ref$skipAngle === void 0 ? 0 : _ref$skipAngle,
      _ref$computeExtraProp = _ref.computeExtraProps,
      computeExtraProps = _ref$computeExtraProp === void 0 ? function () {
    return {};
  } : _ref$computeExtraProp;
  return react.useMemo(function () {
    return filterDataBySkipAngle(data, skipAngle).map(function (datum) {
      var position = computeArcCenter(datum.arc, offset);
      return _objectSpread2(_objectSpread2({}, computeExtraProps(datum)), {}, {
        x: position.x,
        y: position.y,
        data: datum
      });
    });
  }, [data, offset, skipAngle, computeExtraProps]);
};

var staticStyle = {
  pointerEvents: 'none'
};
var ArcLabel = function ArcLabel(_ref) {
  var label = _ref.label,
      style = _ref.style;
  var theme = core.useTheme();
  return jsxRuntime.jsx(web.animated.g, {
    transform: style.transform,
    opacity: style.progress,
    style: staticStyle,
    children: jsxRuntime.jsx(web.animated.text, {
      textAnchor: "middle",
      dominantBaseline: "central",
      style: _objectSpread2(_objectSpread2({}, theme.labels.text), {}, {
        fill: style.textColor
      }),
      children: label
    })
  });
};

var ArcLabelsLayer = function ArcLabelsLayer(_ref) {
  var center = _ref.center,
      data = _ref.data,
      transitionMode = _ref.transitionMode,
      labelAccessor = _ref.label,
      radiusOffset = _ref.radiusOffset,
      skipAngle = _ref.skipAngle,
      textColor = _ref.textColor,
      _ref$component = _ref.component,
      component = _ref$component === void 0 ? ArcLabel : _ref$component;
  var getLabel = core.usePropertyAccessor(labelAccessor);
  var theme = core.useTheme();
  var getTextColor = colors.useInheritedColor(textColor, theme);
  var filteredData = react.useMemo(function () {
    return data.filter(function (datum) {
      return Math.abs(core.radiansToDegrees(datum.arc.endAngle - datum.arc.startAngle)) >= skipAngle;
    });
  }, [data, skipAngle]);

  var _useArcCentersTransit = useArcCentersTransition(filteredData, radiusOffset, transitionMode),
      transition = _useArcCentersTransit.transition,
      interpolate = _useArcCentersTransit.interpolate;

  var Label = component;
  return jsxRuntime.jsx("g", {
    transform: "translate(".concat(center[0], ",").concat(center[1], ")"),
    children: transition(function (transitionProps, datum) {
      return react.createElement(Label, {
        key: datum.id,
        datum: datum,
        label: getLabel(datum),
        style: _objectSpread2(_objectSpread2({}, transitionProps), {}, {
          transform: interpolate(transitionProps.startAngle, transitionProps.endAngle, transitionProps.innerRadius, transitionProps.outerRadius),
          textColor: getTextColor(datum)
        })
      });
    })
  });
};

var drawCanvasArcLabels = function drawCanvasArcLabels(ctx, labels, theme) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = "".concat(theme.labels.text.fontSize, "px ").concat(theme.labels.text.fontFamily);
  labels.forEach(function (label) {
    ctx.fillStyle = label.textColor;
    ctx.fillText("".concat(label.label), label.x, label.y);
  });
};

var useArcLabels = function useArcLabels(_ref) {
  var data = _ref.data,
      offset = _ref.offset,
      skipAngle = _ref.skipAngle,
      label = _ref.label,
      textColor = _ref.textColor;
  var getLabel = core.usePropertyAccessor(label);
  var theme = core.useTheme();
  var getTextColor = colors.useInheritedColor(textColor, theme);
  var computeExtraProps = react.useCallback(function (datum) {
    return {
      label: getLabel(datum),
      textColor: getTextColor(datum)
    };
  }, [getLabel, getTextColor]);
  return useArcCenters({
    data: data,
    offset: offset,
    skipAngle: skipAngle,
    computeExtraProps: computeExtraProps
  });
};

var computeArcLinkTextAnchor = function computeArcLinkTextAnchor(arc) {
  var centerAngle = getNormalizedAngle(arc.startAngle + (arc.endAngle - arc.startAngle) / 2 - Math.PI / 2);

  if (centerAngle < Math.PI / 2 || centerAngle > Math.PI * 1.5) {
    return 'start';
  }

  return 'end';
};
var computeArcLink = function computeArcLink(arc, offset, diagonalLength, straightLength) {
  var centerAngle = getNormalizedAngle(arc.startAngle + (arc.endAngle - arc.startAngle) / 2 - Math.PI / 2);
  var point0 = core.positionFromAngle(centerAngle, arc.outerRadius + offset);
  var point1 = core.positionFromAngle(centerAngle, arc.outerRadius + offset + diagonalLength);
  var side;
  var point2;

  if (centerAngle < Math.PI / 2 || centerAngle > Math.PI * 1.5) {
    side = 'after';
    point2 = {
      x: point1.x + straightLength,
      y: point1.y
    };
  } else {
    side = 'before';
    point2 = {
      x: point1.x - straightLength,
      y: point1.y
    };
  }

  return {
    side: side,
    points: [point0, point1, point2]
  };
};

var lineGenerator = d3Shape.line().x(function (d) {
  return d.x;
}).y(function (d) {
  return d.y;
});

var useTransitionPhases = function useTransitionPhases(_ref) {
  var offset = _ref.offset,
      diagonalLength = _ref.diagonalLength,
      straightLength = _ref.straightLength,
      textOffset = _ref.textOffset,
      getLinkColor = _ref.getLinkColor,
      getTextColor = _ref.getTextColor;
  return react.useMemo(function () {
    return {
      enter: function enter(datum) {
        return {
          startAngle: datum.arc.startAngle,
          endAngle: datum.arc.endAngle,
          innerRadius: datum.arc.innerRadius,
          outerRadius: datum.arc.outerRadius,
          offset: offset,
          diagonalLength: 0,
          straightLength: 0,
          textOffset: textOffset,
          linkColor: getLinkColor(datum),
          textColor: getTextColor(datum),
          opacity: 0
        };
      },
      update: function update(d) {
        return {
          startAngle: d.arc.startAngle,
          endAngle: d.arc.endAngle,
          innerRadius: d.arc.innerRadius,
          outerRadius: d.arc.outerRadius,
          offset: offset,
          diagonalLength: diagonalLength,
          straightLength: straightLength,
          textOffset: textOffset,
          linkColor: getLinkColor(d),
          textColor: getTextColor(d),
          opacity: 1
        };
      },
      leave: function leave(d) {
        return {
          startAngle: d.arc.startAngle,
          endAngle: d.arc.endAngle,
          innerRadius: d.arc.innerRadius,
          outerRadius: d.arc.outerRadius,
          offset: offset,
          diagonalLength: 0,
          straightLength: 0,
          textOffset: textOffset,
          linkColor: getLinkColor(d),
          textColor: getTextColor(d),
          opacity: 0
        };
      }
    };
  }, [diagonalLength, straightLength, textOffset, getLinkColor, getTextColor]);
};

var interpolateLink = function interpolateLink(startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue, offsetValue, diagonalLengthValue, straightLengthValue) {
  return web.to([startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue, offsetValue, diagonalLengthValue, straightLengthValue], function (startAngle, endAngle, innerRadius, outerRadius, offset, diagonalLengthAnimated, straightLengthAnimated) {
    var _computeArcLink = computeArcLink({
      startAngle: startAngle,
      endAngle: endAngle,
      innerRadius: innerRadius,
      outerRadius: outerRadius
    }, offset, diagonalLengthAnimated, straightLengthAnimated),
        points = _computeArcLink.points;

    return lineGenerator(points);
  });
};

var interpolateTextAnchor = function interpolateTextAnchor(startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue) {
  return web.to([startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue], function (startAngle, endAngle, innerRadius, outerRadius) {
    return computeArcLinkTextAnchor({
      startAngle: startAngle,
      endAngle: endAngle,
      innerRadius: innerRadius,
      outerRadius: outerRadius
    });
  });
};

var interpolateTextPosition = function interpolateTextPosition(startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue, offsetValue, diagonalLengthValue, straightLengthValue, textOffsetValue) {
  return web.to([startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue, offsetValue, diagonalLengthValue, straightLengthValue, textOffsetValue], function (startAngle, endAngle, innerRadius, outerRadius, offset, diagonalLengthAnimated, straightLengthAnimated, textOffset) {
    var _computeArcLink2 = computeArcLink({
      startAngle: startAngle,
      endAngle: endAngle,
      innerRadius: innerRadius,
      outerRadius: outerRadius
    }, offset, diagonalLengthAnimated, straightLengthAnimated),
        points = _computeArcLink2.points,
        side = _computeArcLink2.side;

    var position = points[2];

    if (side === 'before') {
      position.x -= textOffset;
    } else {
      position.x += textOffset;
    }

    return "translate(".concat(position.x, ",").concat(position.y, ")");
  });
};

var useArcLinkLabelsTransition = function useArcLinkLabelsTransition(_ref2) {
  var data = _ref2.data,
      _ref2$offset = _ref2.offset,
      offset = _ref2$offset === void 0 ? 0 : _ref2$offset,
      diagonalLength = _ref2.diagonalLength,
      straightLength = _ref2.straightLength,
      _ref2$skipAngle = _ref2.skipAngle,
      skipAngle = _ref2$skipAngle === void 0 ? 0 : _ref2$skipAngle,
      textOffset = _ref2.textOffset,
      linkColor = _ref2.linkColor,
      textColor = _ref2.textColor;

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var theme = core.useTheme();
  var getLinkColor = colors.useInheritedColor(linkColor, theme);
  var getTextColor = colors.useInheritedColor(textColor, theme);
  var filteredData = useFilteredDataBySkipAngle(data, skipAngle);
  var transitionPhases = useTransitionPhases({
    offset: offset,
    diagonalLength: diagonalLength,
    straightLength: straightLength,
    textOffset: textOffset,
    getLinkColor: getLinkColor,
    getTextColor: getTextColor
  });
  var transition = web.useTransition(filteredData, {
    keys: function keys(datum) {
      return datum.id;
    },
    initial: transitionPhases.update,
    from: transitionPhases.enter,
    enter: transitionPhases.update,
    update: transitionPhases.update,
    leave: transitionPhases.leave,
    config: springConfig,
    immediate: !animate
  });
  return {
    transition: transition,
    interpolateLink: interpolateLink,
    interpolateTextAnchor: interpolateTextAnchor,
    interpolateTextPosition: interpolateTextPosition
  };
};

var ArcLinkLabel = function ArcLinkLabel(_ref) {
  var label = _ref.label,
      style = _ref.style;
  var theme = core.useTheme();
  return jsxRuntime.jsxs(web.animated.g, {
    opacity: style.opacity,
    children: [jsxRuntime.jsx(web.animated.path, {
      fill: "none",
      stroke: style.linkColor,
      strokeWidth: style.thickness,
      d: style.path
    }), jsxRuntime.jsx(web.animated.text, {
      transform: style.textPosition,
      textAnchor: style.textAnchor,
      dominantBaseline: "central",
      style: _objectSpread2(_objectSpread2({}, theme.labels.text), {}, {
        fill: style.textColor
      }),
      children: label
    })]
  });
};

var ArcLinkLabelsLayer = function ArcLinkLabelsLayer(_ref) {
  var center = _ref.center,
      data = _ref.data,
      labelAccessor = _ref.label,
      skipAngle = _ref.skipAngle,
      offset = _ref.offset,
      diagonalLength = _ref.diagonalLength,
      straightLength = _ref.straightLength,
      strokeWidth = _ref.strokeWidth,
      textOffset = _ref.textOffset,
      textColor = _ref.textColor,
      linkColor = _ref.linkColor,
      _ref$component = _ref.component,
      component = _ref$component === void 0 ? ArcLinkLabel : _ref$component;
  var getLabel = core.usePropertyAccessor(labelAccessor);

  var _useArcLinkLabelsTran = useArcLinkLabelsTransition({
    data: data,
    skipAngle: skipAngle,
    offset: offset,
    diagonalLength: diagonalLength,
    straightLength: straightLength,
    textOffset: textOffset,
    linkColor: linkColor,
    textColor: textColor
  }),
      transition = _useArcLinkLabelsTran.transition,
      interpolateLink = _useArcLinkLabelsTran.interpolateLink,
      interpolateTextAnchor = _useArcLinkLabelsTran.interpolateTextAnchor,
      interpolateTextPosition = _useArcLinkLabelsTran.interpolateTextPosition;

  var Label = component;
  return jsxRuntime.jsx("g", {
    transform: "translate(".concat(center[0], ",").concat(center[1], ")"),
    children: transition(function (transitionProps, datum) {
      return react.createElement(Label, {
        key: datum.id,
        datum: datum,
        label: getLabel(datum),
        style: _objectSpread2(_objectSpread2({}, transitionProps), {}, {
          thickness: strokeWidth,
          path: interpolateLink(transitionProps.startAngle, transitionProps.endAngle, transitionProps.innerRadius, transitionProps.outerRadius, transitionProps.offset, transitionProps.diagonalLength, transitionProps.straightLength),
          textAnchor: interpolateTextAnchor(transitionProps.startAngle, transitionProps.endAngle, transitionProps.innerRadius, transitionProps.outerRadius),
          textPosition: interpolateTextPosition(transitionProps.startAngle, transitionProps.endAngle, transitionProps.innerRadius, transitionProps.outerRadius, transitionProps.offset, transitionProps.diagonalLength, transitionProps.straightLength, transitionProps.textOffset)
        })
      });
    })
  });
};

var drawCanvasArcLinkLabels = function drawCanvasArcLinkLabels(ctx, labels, theme, strokeWidth) {
  ctx.textBaseline = 'middle';
  ctx.font = "".concat(theme.labels.text.fontSize, "px ").concat(theme.labels.text.fontFamily);
  labels.forEach(function (label) {
    ctx.fillStyle = label.textColor;
    ctx.textAlign = core.textPropsByEngine.canvas.align[label.textAnchor];
    ctx.fillText("".concat(label.label), label.x, label.y);
    ctx.beginPath();
    ctx.strokeStyle = label.linkColor;
    ctx.lineWidth = strokeWidth;
    label.points.forEach(function (point, index) {
      if (index === 0) ctx.moveTo(point.x, point.y);else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });
};

var useArcLinks = function useArcLinks(_ref) {
  var data = _ref.data,
      _ref$skipAngle = _ref.skipAngle,
      skipAngle = _ref$skipAngle === void 0 ? 0 : _ref$skipAngle,
      _ref$offset = _ref.offset,
      offset = _ref$offset === void 0 ? 0.5 : _ref$offset,
      diagonalLength = _ref.diagonalLength,
      straightLength = _ref.straightLength,
      _ref$computeExtraProp = _ref.computeExtraProps,
      computeExtraProps = _ref$computeExtraProp === void 0 ? function () {
    return {};
  } : _ref$computeExtraProp;
  var links = react.useMemo(function () {
    return data.filter(function (datum) {
      return Math.abs(core.radiansToDegrees(datum.arc.endAngle - datum.arc.startAngle)) >= skipAngle;
    }).map(function (datum) {
      return _objectSpread2(_objectSpread2({}, computeArcLink(datum.arc, offset, diagonalLength, straightLength)), {}, {
        data: datum
      });
    });
  }, [data, skipAngle, offset, diagonalLength, straightLength]);
  return react.useMemo(function () {
    return links.map(function (link) {
      return _objectSpread2(_objectSpread2({}, computeExtraProps(link)), link);
    });
  }, [links, computeExtraProps]);
};

var useArcLinkLabels = function useArcLinkLabels(_ref) {
  var data = _ref.data,
      skipAngle = _ref.skipAngle,
      offset = _ref.offset,
      diagonalLength = _ref.diagonalLength,
      straightLength = _ref.straightLength,
      _ref$textOffset = _ref.textOffset,
      textOffset = _ref$textOffset === void 0 ? 0 : _ref$textOffset,
      label = _ref.label,
      linkColor = _ref.linkColor,
      textColor = _ref.textColor;
  var getLabel = core.usePropertyAccessor(label);
  var theme = core.useTheme();
  var getLinkColor = colors.useInheritedColor(linkColor, theme);
  var getTextColor = colors.useInheritedColor(textColor, theme);
  var computeExtraProps = react.useCallback(function (link) {
    var position = {
      x: link.points[2].x,
      y: link.points[2].y
    };
    var textAnchor;

    if (link.side === 'before') {
      position.x -= textOffset;
      textAnchor = 'end';
    } else {
      position.x += textOffset;
      textAnchor = 'start';
    }

    return _objectSpread2(_objectSpread2({}, position), {}, {
      label: getLabel(link.data),
      linkColor: getLinkColor(link.data),
      textAnchor: textAnchor,
      textColor: getTextColor(link.data)
    });
  }, [getLabel, getLinkColor, getTextColor, textOffset]);
  return useArcLinks({
    data: data,
    skipAngle: skipAngle,
    offset: offset,
    diagonalLength: diagonalLength,
    straightLength: straightLength,
    computeExtraProps: computeExtraProps
  });
};

var ArcShape = function ArcShape(_ref) {
  var datum = _ref.datum,
      style = _ref.style,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseMove = _ref.onMouseMove,
      onMouseLeave = _ref.onMouseLeave;
  var handleClick = react.useCallback(function (event) {
    return onClick === null || onClick === void 0 ? void 0 : onClick(datum, event);
  }, [onClick, datum]);
  var handleMouseEnter = react.useCallback(function (event) {
    return onMouseEnter === null || onMouseEnter === void 0 ? void 0 : onMouseEnter(datum, event);
  }, [onMouseEnter, datum]);
  var handleMouseMove = react.useCallback(function (event) {
    return onMouseMove === null || onMouseMove === void 0 ? void 0 : onMouseMove(datum, event);
  }, [onMouseMove, datum]);
  var handleMouseLeave = react.useCallback(function (event) {
    return onMouseLeave === null || onMouseLeave === void 0 ? void 0 : onMouseLeave(datum, event);
  }, [onMouseLeave, datum]);
  return jsxRuntime.jsx(web.animated.path, {
    d: style.path,
    opacity: style.opacity,
    fill: datum.fill || style.color,
    stroke: style.borderColor,
    strokeWidth: style.borderWidth,
    onClick: onClick ? handleClick : undefined,
    onMouseEnter: onMouseEnter ? handleMouseEnter : undefined,
    onMouseMove: onMouseMove ? handleMouseMove : undefined,
    onMouseLeave: onMouseLeave ? handleMouseLeave : undefined
  });
};

var interpolateArc = function interpolateArc(startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue, arcGenerator) {
  return web.to([startAngleValue, endAngleValue, innerRadiusValue, outerRadiusValue], function (startAngle, endAngle, innerRadius, outerRadius) {
    return arcGenerator({
      startAngle: startAngle,
      endAngle: endAngle,
      innerRadius: Math.max(0, innerRadius),
      outerRadius: Math.max(0, outerRadius)
    });
  });
};

var useArcsTransition = function useArcsTransition(data) {
  var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'innerRadius';
  var extra = arguments.length > 2 ? arguments[2] : undefined;

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var phases = useArcTransitionMode(mode, extra);
  var transition = web.useTransition(data, {
    keys: function keys(datum) {
      return datum.id;
    },
    initial: phases.update,
    from: phases.enter,
    enter: phases.update,
    update: phases.update,
    leave: phases.leave,
    config: springConfig,
    immediate: !animate
  });
  return {
    transition: transition,
    interpolate: interpolateArc
  };
};

var ArcsLayer = function ArcsLayer(_ref) {
  var center = _ref.center,
      data = _ref.data,
      arcGenerator = _ref.arcGenerator,
      borderWidth = _ref.borderWidth,
      borderColor = _ref.borderColor,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseMove = _ref.onMouseMove,
      onMouseLeave = _ref.onMouseLeave,
      transitionMode = _ref.transitionMode,
      _ref$component = _ref.component,
      component = _ref$component === void 0 ? ArcShape : _ref$component;
  var theme = core.useTheme();
  var getBorderColor = colors.useInheritedColor(borderColor, theme);

  var _useArcsTransition = useArcsTransition(data, transitionMode, {
    enter: function enter(datum) {
      return {
        opacity: 0,
        color: datum.color,
        borderColor: getBorderColor(datum)
      };
    },
    update: function update(datum) {
      return {
        opacity: 1,
        color: datum.color,
        borderColor: getBorderColor(datum)
      };
    },
    leave: function leave(datum) {
      return {
        opacity: 0,
        color: datum.color,
        borderColor: getBorderColor(datum)
      };
    }
  }),
      transition = _useArcsTransition.transition,
      interpolate = _useArcsTransition.interpolate;

  var Arc = component;
  return jsxRuntime.jsx("g", {
    transform: "translate(".concat(center[0], ",").concat(center[1], ")"),
    children: transition(function (transitionProps, datum) {
      return react.createElement(Arc, {
        key: datum.id,
        datum: datum,
        style: _objectSpread2(_objectSpread2({}, transitionProps), {}, {
          borderWidth: borderWidth,
          path: interpolate(transitionProps.startAngle, transitionProps.endAngle, transitionProps.innerRadius, transitionProps.outerRadius, arcGenerator)
        }),
        onClick: onClick,
        onMouseEnter: onMouseEnter,
        onMouseMove: onMouseMove,
        onMouseLeave: onMouseLeave
      });
    })
  });
};

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

var computeArcBoundingBox = function computeArcBoundingBox(centerX, centerY, radius, startAngle, endAngle) {
  var includeCenter = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
  var points = [];
  var p0 = core.positionFromAngle(core.degreesToRadians(startAngle), radius);
  points.push([p0.x, p0.y]);
  var p1 = core.positionFromAngle(core.degreesToRadians(endAngle), radius);
  points.push([p1.x, p1.y]);

  for (var angle = Math.round(Math.min(startAngle, endAngle)); angle <= Math.round(Math.max(startAngle, endAngle)); angle++) {
    if (angle % 90 === 0) {
      var p = core.positionFromAngle(core.degreesToRadians(angle), radius);
      points.push([p.x, p.y]);
    }
  }

  points = points.map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        x = _ref2[0],
        y = _ref2[1];

    return [centerX + x, centerY + y];
  });

  if (includeCenter === true) {
    points.push([centerX, centerY]);
  }

  var xs = points.map(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 1),
        x = _ref4[0];

    return x;
  });
  var ys = points.map(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        y = _ref6[1];

    return y;
  });
  var x0 = Math.min.apply(Math, _toConsumableArray(xs));
  var x1 = Math.max.apply(Math, _toConsumableArray(xs));
  var y0 = Math.min.apply(Math, _toConsumableArray(ys));
  var y1 = Math.max.apply(Math, _toConsumableArray(ys));
  return {
    points: points,
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0
  };
};

var isCursorInRing = function isCursorInRing(centerX, centerY, radius, innerRadius, cursorX, cursorY) {
  var distance = core.getDistance(cursorX, cursorY, centerX, centerY);
  return distance < radius && distance > innerRadius;
};
var findArcUnderCursor = function findArcUnderCursor(centerX, centerY, radius, innerRadius, arcs, cursorX, cursorY) {
  if (!isCursorInRing(centerX, centerY, radius, innerRadius, cursorX, cursorY)) {
    return undefined;
  }

  var cursorAngle = core.getAngle(cursorX, cursorY, centerX, centerY);
  return arcs.find(function (_ref) {
    var startAngle = _ref.startAngle,
        endAngle = _ref.endAngle;
    return cursorAngle >= startAngle && cursorAngle < endAngle;
  });
};

var useAnimatedArc = function useAnimatedArc(datumWithArc, arcGenerator) {
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var animatedValues = web.useSpring({
    startAngle: datumWithArc.arc.startAngle,
    endAngle: datumWithArc.arc.endAngle,
    innerRadius: datumWithArc.arc.innerRadius,
    outerRadius: datumWithArc.arc.outerRadius,
    config: springConfig,
    immediate: !animate
  });
  return _objectSpread2(_objectSpread2({}, animatedValues), {}, {
    path: interpolateArc(animatedValues.startAngle, animatedValues.endAngle, animatedValues.innerRadius, animatedValues.outerRadius, arcGenerator)
  });
};

var useArcGenerator = function useArcGenerator() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$cornerRadius = _ref.cornerRadius,
      cornerRadius = _ref$cornerRadius === void 0 ? 0 : _ref$cornerRadius,
      _ref$padAngle = _ref.padAngle,
      padAngle = _ref$padAngle === void 0 ? 0 : _ref$padAngle;

  return react.useMemo(function () {
    return d3Shape.arc().innerRadius(function (arc) {
      return arc.innerRadius;
    }).outerRadius(function (arc) {
      return arc.outerRadius;
    }).cornerRadius(cornerRadius).padAngle(padAngle);
  }, [cornerRadius, padAngle]);
};

exports.ArcLabelsLayer = ArcLabelsLayer;
exports.ArcLinkLabelsLayer = ArcLinkLabelsLayer;
exports.ArcShape = ArcShape;
exports.ArcsLayer = ArcsLayer;
exports.arcTransitionModeById = arcTransitionModeById;
exports.arcTransitionModes = arcTransitionModes;
exports.computeArcBoundingBox = computeArcBoundingBox;
exports.computeArcCenter = computeArcCenter;
exports.computeArcLink = computeArcLink;
exports.computeArcLinkTextAnchor = computeArcLinkTextAnchor;
exports.drawCanvasArcLabels = drawCanvasArcLabels;
exports.drawCanvasArcLinkLabels = drawCanvasArcLinkLabels;
exports.findArcUnderCursor = findArcUnderCursor;
exports.interpolateArc = interpolateArc;
exports.interpolateArcCenter = interpolateArcCenter;
exports.isCursorInRing = isCursorInRing;
exports.useAnimatedArc = useAnimatedArc;
exports.useArcCenters = useArcCenters;
exports.useArcCentersTransition = useArcCentersTransition;
exports.useArcGenerator = useArcGenerator;
exports.useArcLabels = useArcLabels;
exports.useArcLinkLabels = useArcLinkLabels;
exports.useArcLinkLabelsTransition = useArcLinkLabelsTransition;
exports.useArcLinks = useArcLinks;
exports.useArcTransitionMode = useArcTransitionMode;
exports.useArcsTransition = useArcsTransition;
//# sourceMappingURL=nivo-arcs.cjs.js.map
