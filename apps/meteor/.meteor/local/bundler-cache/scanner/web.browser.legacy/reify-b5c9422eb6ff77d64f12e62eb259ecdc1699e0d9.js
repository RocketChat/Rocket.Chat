'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function shouldThrowError(_useErrorBoundary, params) {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(...params);
  }

  return !!_useErrorBoundary;
}

exports.shouldThrowError = shouldThrowError;
//# sourceMappingURL=utils.js.map
