module.export({createSurfaceRenderer:()=>createSurfaceRenderer},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);
const createSurfaceRenderer = (
// eslint-disable-next-line @typescript-eslint/naming-convention
SurfaceComponent, surfaceRenderer) => function Surface(blocks, conditions = {}) {
    return (_jsx(SurfaceComponent, { children: surfaceRenderer.render(blocks, Object.assign({ engine: 'rocket.chat' }, conditions)) }));
};
//# sourceMappingURL=createSurfaceRenderer.js.map