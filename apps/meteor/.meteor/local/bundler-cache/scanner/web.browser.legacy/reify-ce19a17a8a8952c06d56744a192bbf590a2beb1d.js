'use client';
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');

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

var React__namespace = /*#__PURE__*/_interopNamespace(React);

const IsRestoringContext = /*#__PURE__*/React__namespace.createContext(false);
const useIsRestoring = () => React__namespace.useContext(IsRestoringContext);
const IsRestoringProvider = IsRestoringContext.Provider;

exports.IsRestoringProvider = IsRestoringProvider;
exports.useIsRestoring = useIsRestoring;
//# sourceMappingURL=isRestoring.js.map
