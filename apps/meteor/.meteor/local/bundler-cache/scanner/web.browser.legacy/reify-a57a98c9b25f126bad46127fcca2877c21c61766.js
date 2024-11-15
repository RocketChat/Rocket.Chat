"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInactiveBanner = exports.BannerPlatform = void 0;
var BannerPlatform;
(function (BannerPlatform) {
    BannerPlatform["Web"] = "web";
    BannerPlatform["Mobile"] = "mobile";
})(BannerPlatform || (exports.BannerPlatform = BannerPlatform = {}));
const isInactiveBanner = (banner) => banner.active === false;
exports.isInactiveBanner = isInactiveBanner;
//# sourceMappingURL=IBanner.js.map