"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerSurfaceRenderer = void 0;
const FuselageSurfaceRenderer_1 = require("./FuselageSurfaceRenderer");
class BannerSurfaceRenderer extends FuselageSurfaceRenderer_1.FuselageSurfaceRenderer {
    constructor() {
        super(...arguments);
        this.plain_text = FuselageSurfaceRenderer_1.renderTextObject;
        this.mrkdwn = FuselageSurfaceRenderer_1.renderTextObject;
    }
}
exports.BannerSurfaceRenderer = BannerSurfaceRenderer;
//# sourceMappingURL=BannerSurfaceRenderer.js.map