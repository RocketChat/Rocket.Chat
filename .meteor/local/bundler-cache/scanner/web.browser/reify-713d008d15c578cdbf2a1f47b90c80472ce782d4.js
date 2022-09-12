module.export({createSurfaceRenderer:()=>createSurfaceRenderer});let React;module.link('react',{default(v){React=v}},0);var __assign = (this && this.__assign) || function () {
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

var createSurfaceRenderer = function (SurfaceComponent, surfaceRenderer) {
    return function Surface(blocks, conditions) {
        if (conditions === void 0) { conditions = {}; }
        return (React.createElement(SurfaceComponent, null, surfaceRenderer.render(blocks, __assign({ engine: 'rocket.chat' }, conditions))));
    };
};
//# sourceMappingURL=createSurfaceRenderer.js.map