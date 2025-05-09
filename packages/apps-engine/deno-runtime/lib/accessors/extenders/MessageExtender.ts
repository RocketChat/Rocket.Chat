import type { IMessageExtender } from '@rocket.chat/apps-engine/definition/accessors/IMessageExtender.ts';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.ts';
import type { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages/IMessageAttachment.ts';

import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class MessageExtender implements IMessageExtender {
    public readonly kind: _RocketChatAssociationModel.MESSAGE;

    constructor(private msg: IMessage) {
        this.kind = RocketChatAssociationModel.MESSAGE;

        if (!Array.isArray(msg.attachments)) {
            this.msg.attachments = [];
        }
    }

    public addCustomField(key: string, value: unknown): IMessageExtender {
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

    public addAttachment(attachment: IMessageAttachment): IMessageExtender {
        this.ensureAttachment();

        this.msg.attachments!.push(attachment);

        return this;
    }

    public addAttachments(attachments: Array<IMessageAttachment>): IMessageExtender {
        this.ensureAttachment();

        this.msg.attachments = this.msg.attachments!.concat(attachments);

        return this;
    }

    public getMessage(): IMessage {
        return structuredClone(this.msg);
    }

    private ensureAttachment(): void {
        if (!Array.isArray(this.msg.attachments)) {
            this.msg.attachments = [];
        }
    }
}
