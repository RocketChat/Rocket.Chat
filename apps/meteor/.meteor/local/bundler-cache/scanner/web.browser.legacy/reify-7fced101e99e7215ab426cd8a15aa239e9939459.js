"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiKitParserContextualBar = void 0;
var SurfaceRenderer_1 = require("../../rendering/SurfaceRenderer");
var UiKitParserContextualBar = /** @class */ (function (_super) {
    __extends(UiKitParserContextualBar, _super);
    function UiKitParserContextualBar() {
        return _super.call(this, ['actions', 'context', 'divider', 'image', 'input', 'section']) || this;
    }
    return UiKitParserContextualBar;
}(SurfaceRenderer_1.SurfaceRenderer));
exports.UiKitParserContextualBar = UiKitParserContextualBar;
//# sourceMappingURL=UiKitParserContextualBar.js.map