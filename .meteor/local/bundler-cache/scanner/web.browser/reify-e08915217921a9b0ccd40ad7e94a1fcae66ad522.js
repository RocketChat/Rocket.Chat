module.export({SurfaceContext:()=>SurfaceContext,useSurfaceType:()=>useSurfaceType});let createContext,useContext;module.link('react',{createContext(v){createContext=v},useContext(v){useContext=v}},0);
var SurfaceContext = createContext('message');
var useSurfaceType = function () {
    return useContext(SurfaceContext);
};
//# sourceMappingURL=SurfaceContext.js.map