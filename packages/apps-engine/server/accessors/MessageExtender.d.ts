import type { IMessageExtender } from '../../definition/accessors';
import type { IMessage, IMessageAttachment } from '../../definition/messages';
import { RocketChatAssociationModel } from '../../definition/metadata';
export declare class MessageExtender implements IMessageExtender {
    private msg;
    readonly kind: RocketChatAssociationModel.MESSAGE;
    constructor(msg: IMessage);
    addCustomField(key: string, value: any): IMessageExtender;
    addAttachment(attachment: IMessageAttachment): IMessageExtender;
    addAttachments(attachments: Array<IMessageAttachment>): IMessageExtender;
    getMessage(): IMessage;
}
