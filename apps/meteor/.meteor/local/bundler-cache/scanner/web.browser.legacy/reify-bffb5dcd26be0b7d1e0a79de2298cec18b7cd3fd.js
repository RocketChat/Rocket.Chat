'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ReactDOM = require('react-dom');

function _interopNamespace(e) {
	if (e && e.__esModule) return e;
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	}
	n["default"] = e;
	return Object.freeze(n);
}

var ReactDOM__namespace = /*#__PURE__*/_interopNamespace(ReactDOM);

const unstable_batchedUpdates = ReactDOM__namespace.unstable_batchedUpdates;

exports.unstable_batchedUpdates = unstable_batchedUpdates;
//# sourceMappingURL=reactBatchedUpdates.js.map
