(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BugsnagPluginReact = f()}})(function(){var define,module,exports;
var _$src_1 = {};
function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

_$src_1 = /*#__PURE__*/function () {
  function BugsnagPluginReact() {
    // Fetch React from the window object, if it exists
    var globalReact = typeof window !== 'undefined' && window.React;
    this.name = 'react';
    this.lazy = arguments.length === 0 && !globalReact;

    if (!this.lazy) {
      this.React = (arguments.length <= 0 ? undefined : arguments[0]) || globalReact;
      if (!this.React) throw new Error('@bugsnag/plugin-react reference to `React` was undefined');
    }
  }

  var _proto = BugsnagPluginReact.prototype;

  _proto.load = function load(client) {
    if (!this.lazy) {
      var ErrorBoundary = createClass(this.React, client);

      ErrorBoundary.createErrorBoundary = function () {
        return ErrorBoundary;
      };

      return ErrorBoundary;
    }

    var BugsnagPluginReactLazyInitializer = function () {
      throw new Error("@bugsnag/plugin-react was used incorrectly. Valid usage is as follows:\nPass React to the plugin constructor\n\n  `Bugsnag.start({ plugins: [new BugsnagPluginReact(React)] })`\nand then call `const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary()`\n\nOr if React is not available until after Bugsnag has started,\nconstruct the plugin with no arguments\n  `Bugsnag.start({ plugins: [new BugsnagPluginReact()] })`,\nthen pass in React when available to construct your error boundary\n  `const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)`");
    };

    BugsnagPluginReactLazyInitializer.createErrorBoundary = function (React) {
      if (!React) throw new Error('@bugsnag/plugin-react reference to `React` was undefined');
      return createClass(React, client);
    };

    return BugsnagPluginReactLazyInitializer;
  };

  return BugsnagPluginReact;
}();

var formatComponentStack = function (str) {
  var lines = str.split(/\s*\n\s*/g);
  var ret = '';

  for (var line = 0, len = lines.length; line < len; line++) {
    if (lines[line].length) ret += "" + (ret.length ? '\n' : '') + lines[line];
  }

  return ret;
};

var createClass = function (React, client) {
  return /*#__PURE__*/function (_React$Component) {
    _inheritsLoose(ErrorBoundary, _React$Component);

    function ErrorBoundary(props) {
      var _this;

      _this = _React$Component.call(this, props) || this;
      _this.state = {
        error: null,
        info: null
      };
      _this.handleClearError = _this.handleClearError.bind(_assertThisInitialized(_this));
      return _this;
    }

    var _proto2 = ErrorBoundary.prototype;

    _proto2.handleClearError = function handleClearError() {
      this.setState({
        error: null,
        info: null
      });
    };

    _proto2.componentDidCatch = function componentDidCatch(error, info) {
      var onError = this.props.onError;
      var handledState = {
        severity: 'error',
        unhandled: true,
        severityReason: {
          type: 'unhandledException'
        }
      };
      var event = client.Event.create(error, true, handledState, 1);
      if (info && info.componentStack) info.componentStack = formatComponentStack(info.componentStack);
      event.addMetadata('react', info);

      client._notify(event, onError);

      this.setState({
        error: error,
        info: info
      });
    };

    _proto2.render = function render() {
      var error = this.state.error;

      if (error) {
        var FallbackComponent = this.props.FallbackComponent;
        if (FallbackComponent) return React.createElement(FallbackComponent, _extends({}, this.state, {
          clearError: this.handleClearError
        }));
        return null;
      }

      return this.props.children;
    };

    return ErrorBoundary;
  }(React.Component);
};

_$src_1.formatComponentStack = formatComponentStack;
_$src_1["default"] = _$src_1;

return _$src_1;

});
//# sourceMappingURL=bugsnag-react.js.map
