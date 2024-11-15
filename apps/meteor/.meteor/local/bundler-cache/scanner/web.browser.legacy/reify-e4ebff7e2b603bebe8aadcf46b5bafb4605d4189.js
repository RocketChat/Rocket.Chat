"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalSurfaceRenderer = void 0;
const FuselageSurfaceRenderer_1 = require("./FuselageSurfaceRenderer");
class ModalSurfaceRenderer extends FuselageSurfaceRenderer_1.FuselageSurfaceRenderer {
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
        this.plain_text = FuselageSurfaceRenderer_1.renderTextObject;
        this.mrkdwn = FuselageSurfaceRenderer_1.renderTextObject;
    }
}
exports.ModalSurfaceRenderer = ModalSurfaceRenderer;
//# sourceMappingURL=ModalSurfaceRenderer.js.map