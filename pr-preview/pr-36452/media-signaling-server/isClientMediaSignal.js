"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClientMediaSignal = void 0;
const media_signaling_1 = require("@rocket.chat/media-signaling");
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default({ discriminator: true });
const schema = media_signaling_1.clientMediaSignalSchema;
exports.isClientMediaSignal = ajv.compile(schema);
//# sourceMappingURL=isClientMediaSignal.js.map