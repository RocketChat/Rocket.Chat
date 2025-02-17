"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlashCommandPreviewItemType = void 0;
var SlashCommandPreviewItemType;
(function (SlashCommandPreviewItemType) {
    /** Represents image preview. Could be `png`, `gif`, etc. */
    SlashCommandPreviewItemType["IMAGE"] = "image";
    /** Represents video preview. */
    SlashCommandPreviewItemType["VIDEO"] = "video";
    /** Represents audio preview. */
    SlashCommandPreviewItemType["AUDIO"] = "audio";
    /** Represents text preview. */
    SlashCommandPreviewItemType["TEXT"] = "text";
    /** As the name says, an unknown type (try not to use). */
    SlashCommandPreviewItemType["OTHER"] = "other";
})(SlashCommandPreviewItemType || (exports.SlashCommandPreviewItemType = SlashCommandPreviewItemType = {}));
//# sourceMappingURL=ISlashCommandPreview.js.map