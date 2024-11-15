"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStyles = void 0;
function createStyles(disableDefaultStyles) {
    var trackStyleDefault = __assign({ position: 'absolute', right: 2, bottom: 2, zIndex: 100 }, (!disableDefaultStyles && { borderRadius: 3 }));
    return {
        containerStyleDefault: {
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
        },
        containerStyleAutoHeight: {
            height: 'auto',
        },
        viewStyleDefault: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'scroll',
            WebkitOverflowScrolling: 'touch',
        },
        viewStyleAutoHeight: {
            position: 'relative',
            top: undefined,
            left: undefined,
            right: undefined,
            bottom: undefined,
        },
        viewStyleUniversalInitial: {
            overflow: 'hidden',
            marginRight: 0,
            marginBottom: 0,
        },
        trackHorizontalStyleDefault: __assign(__assign({}, trackStyleDefault), { left: 2, height: 6 }),
        trackVerticalStyleDefault: __assign(__assign({}, trackStyleDefault), { top: 2, width: 6 }),
        thumbStyleDefault: __assign({ position: 'relative', display: 'block', height: '100%', cursor: 'pointer', borderRadius: 'inherit' }, (!disableDefaultStyles && { backgroundColor: 'rgba(0,0,0,.2)' })),
        disableSelectStyle: {
            userSelect: 'none',
        },
        disableSelectStyleReset: {
            userSelect: 'auto',
        },
    };
}
exports.createStyles = createStyles;
