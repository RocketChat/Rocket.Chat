module.export({Surface:()=>Surface});let React;module.link('react',{default(v){React=v}},0);let SurfaceContext;module.link('../contexts/SurfaceContext',{SurfaceContext(v){SurfaceContext=v}},1);

var Surface = function (_a) {
    var children = _a.children, type = _a.type;
    return (React.createElement(SurfaceContext.Provider, { value: type }, children));
};
//# sourceMappingURL=Surface.js.map