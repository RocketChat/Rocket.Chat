import type { IDiscussionBuilder, ILivechatCreator, ILivechatMessageBuilder, IMessageBuilder, IModifyCreator, IRoomBuilder, IUploadCreator, IUserBuilder, IVideoConferenceBuilder } from '../../definition/accessors';
import type { IContactCreator } from '../../definition/accessors/IContactCreator';
import type { IEmailCreator } from '../../definition/accessors/IEmailCreator';
import type { ILivechatMessage } from '../../definition/livechat/ILivechatMessage';
import type { IMessage } from '../../definition/messages';
import type { IRoom } from '../../definition/rooms';
import { BlockBuilder } from '../../definition/uikit';
import type { IBotUser } from '../../definition/users/IBotUser';
import type { AppVideoConference } from '../../definition/videoConferences';
import type { AppBridges } from '../bridges';
export declare class ModifyCreator implements IModifyCreator {
    private readonly bridges;
    private readonly appId;
    private livechatCreator;
    private uploadCreator;
    private emailCreator;
    private contactCreator;
    constructor(bridges: AppBridges, appId: string);
    getLivechatCreator(): ILivechatCreator;
    getUploadCreator(): IUploadCreator;
    getEmailCreator(): IEmailCreator;
    getContactCreator(): IContactCreator;
    /**
     * @deprecated please prefer the rocket.chat/ui-kit components
     */
    getBlockBuilder(): BlockBuilder;
    startMessage(data?: IMessage): IMessageBuilder;
    startLivechatMessage(data?: ILivechatMessage): ILivechatMessageBuilder;
    startRoom(data?: IRoom): IRoomBuilder;
    startDiscussion(data?: Partial<IRoom>): IDiscussionBuilder;
    startVideoConference(data?: Partial<AppVideoConference>): IVideoConferenceBuilder;
    startBotUser(data?: Partial<IBotUser>): IUserBuilder;
    finish(builder: IMessageBuilder | ILivechatMessageBuilder | IRoomBuilder | IDiscussionBuilder | IVideoConferenceBuilder | IUserBuilder): Promise<string>;
    private _finishMessage;
    private _finishLivechatMessage;
    private _finishRoom;
    private _finishDiscussion;
    private _finishVideoConference;
    private _finishUser;
}
