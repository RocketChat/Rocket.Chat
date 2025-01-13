import type { ApiBridge } from './ApiBridge';
import type { AppActivationBridge } from './AppActivationBridge';
import type { AppDetailChangesBridge } from './AppDetailChangesBridge';
import type { CloudWorkspaceBridge } from './CloudWorkspaceBridge';
import type { CommandBridge } from './CommandBridge';
import type { ContactBridge } from './ContactBridge';
import type { EmailBridge } from './EmailBridge';
import type { EnvironmentalVariableBridge } from './EnvironmentalVariableBridge';
import type { HttpBridge } from './HttpBridge';
import type { IInternalBridge } from './IInternalBridge';
import type { IInternalFederationBridge } from './IInternalFederationBridge';
import type { IListenerBridge } from './IListenerBridge';
import type { LivechatBridge } from './LivechatBridge';
import type { MessageBridge } from './MessageBridge';
import type { ModerationBridge } from './ModerationBridge';
import type { OAuthAppsBridge } from './OAuthAppsBridge';
import type { PersistenceBridge } from './PersistenceBridge';
import type { RoleBridge } from './RoleBridge';
import type { RoomBridge } from './RoomBridge';
import type { SchedulerBridge } from './SchedulerBridge';
import type { ServerSettingBridge } from './ServerSettingBridge';
import type { ThreadBridge } from './ThreadBridge';
import type { UiInteractionBridge } from './UiInteractionBridge';
import type { UploadBridge } from './UploadBridge';
import type { UserBridge } from './UserBridge';
import type { VideoConferenceBridge } from './VideoConferenceBridge';

export type Bridge =
    | CommandBridge
    | ContactBridge
    | ApiBridge
    | AppDetailChangesBridge
    | EnvironmentalVariableBridge
    | HttpBridge
    | IListenerBridge
    | LivechatBridge
    | MessageBridge
    | PersistenceBridge
    | AppActivationBridge
    | RoomBridge
    | IInternalBridge
    | ServerSettingBridge
    | EmailBridge
    | UploadBridge
    | UserBridge
    | UiInteractionBridge
    | SchedulerBridge
    | VideoConferenceBridge
    | OAuthAppsBridge
    | ModerationBridge
    | RoleBridge;

export abstract class AppBridges {
    public abstract getCommandBridge(): CommandBridge;

    public abstract getContactBridge(): ContactBridge;

    public abstract getApiBridge(): ApiBridge;

    public abstract getAppDetailChangesBridge(): AppDetailChangesBridge;

    public abstract getEnvironmentalVariableBridge(): EnvironmentalVariableBridge;

    public abstract getHttpBridge(): HttpBridge;

    public abstract getListenerBridge(): IListenerBridge;

    public abstract getLivechatBridge(): LivechatBridge;

    public abstract getMessageBridge(): MessageBridge;

    public abstract getPersistenceBridge(): PersistenceBridge;

    public abstract getAppActivationBridge(): AppActivationBridge;

    public abstract getRoomBridge(): RoomBridge;

    public abstract getInternalBridge(): IInternalBridge;

    public abstract getInternalFederationBridge(): IInternalFederationBridge;

    public abstract getServerSettingBridge(): ServerSettingBridge;

    public abstract getUploadBridge(): UploadBridge;

    public abstract getEmailBridge(): EmailBridge;

    public abstract getUserBridge(): UserBridge;

    public abstract getUiInteractionBridge(): UiInteractionBridge;

    public abstract getSchedulerBridge(): SchedulerBridge;

    public abstract getCloudWorkspaceBridge(): CloudWorkspaceBridge;

    public abstract getVideoConferenceBridge(): VideoConferenceBridge;

    public abstract getOAuthAppsBridge(): OAuthAppsBridge;

    public abstract getModerationBridge(): ModerationBridge;

    public abstract getThreadBridge(): ThreadBridge;

    public abstract getRoleBridge(): RoleBridge;
}
