module.export({BannerSurfaceRenderer:()=>BannerSurfaceRenderer});let FuselageSurfaceRenderer,renderTextObject;module.link('./FuselageSurfaceRenderer',{FuselageSurfaceRenderer(v){FuselageSurfaceRenderer=v},renderTextObject(v){renderTextObject=v}},0);
class BannerSurfaceRenderer extends FuselageSurfaceRenderer {
    constructor() {
        super(...arguments);
        this.plain_text = renderTextObject;
        this.mrkdwn = renderTextObject;
    }
}
//# sourceMappingURL=BannerSurfaceRenderer.js.map