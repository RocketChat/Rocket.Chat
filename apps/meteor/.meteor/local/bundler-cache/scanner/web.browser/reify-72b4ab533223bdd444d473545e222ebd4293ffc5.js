module.export({ModalSurfaceRenderer:()=>ModalSurfaceRenderer});let FuselageSurfaceRenderer,renderTextObject;module.link('./FuselageSurfaceRenderer',{FuselageSurfaceRenderer(v){FuselageSurfaceRenderer=v},renderTextObject(v){renderTextObject=v}},0);
class ModalSurfaceRenderer extends FuselageSurfaceRenderer {
    constructor() {
        super([
            'actions',
            'context',
            'divider',
            'image',
            'input',
            'section',
            'preview',
            'callout',
        ]);
        this.plain_text = renderTextObject;
        this.mrkdwn = renderTextObject;
    }
}
//# sourceMappingURL=ModalSurfaceRenderer.js.map