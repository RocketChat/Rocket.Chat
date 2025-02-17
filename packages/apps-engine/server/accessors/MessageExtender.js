"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageExtender = void 0;
const metadata_1 = require("../../definition/metadata");
const Utilities_1 = require("../misc/Utilities");
class MessageExtender {
    constructor(msg) {
        this.msg = msg;
        this.kind = metadata_1.RocketChatAssociationModel.MESSAGE;
        if (!Array.isArray(msg.attachments)) {
            this.msg.attachments = [];
        }
    }
    addCustomField(key, value) {
        if (!this.msg.customFields) {
            this.msg.customFields = {};
        }
        if (this.msg.customFields[key]) {
            throw new Error(`The message already contains a custom field by the key: ${key}`);
        }
        if (key.includes('.')) {
            throw new Error(`The given key contains a period, which is not allowed. Key: ${key}`);
        }
        this.msg.customFields[key] = value;
        return this;
    }
    addAttachment(attachment) {
        this.msg.attachments.push(attachment);
        return this;
    }
    addAttachments(attachments) {
        this.msg.attachments = this.msg.attachments.concat(attachments);
        return this;
    }
    getMessage() {
        return Utilities_1.Utilities.deepClone(this.msg);
    }
}
exports.MessageExtender = MessageExtender;
//# sourceMappingURL=MessageExtender.js.map