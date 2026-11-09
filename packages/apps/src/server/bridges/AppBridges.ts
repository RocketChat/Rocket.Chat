import type { ApiBridge } from './ApiBridge.js';
import type { AppActivationBridge } from './AppActivationBridge.js';
import type { AppDetailChangesBridge } from './AppDetailChangesBridge.js';
import type { CallHistoryBridge } from './CallHistoryBridge.js';
import type { CloudWorkspaceBridge } from './CloudWorkspaceBridge.js';
import type { CommandBridge } from './CommandBridge.js';
import type { ContactBridge } from './ContactBridge.js';
import type { EmailBridge } from './EmailBridge.js';
import type { EnvironmentalVariableBridge } from './EnvironmentalVariableBridge.js';
import type { ExperimentalBridge } from './ExperimentalBridge.js';
import type { HttpBridge } from './HttpBridge.js';
import type { IInternalBridge } from './IInternalBridge.js';
import type { IInternalFederationBridge } from './IInternalFederationBridge.js';
import type { IListenerBridge } from './IListenerBridge.js';
import type { LivechatBridge } from './LivechatBridge.js';
import type { MessageBridge } from './MessageBridge.js';
import type { ModerationBridge } from './ModerationBridge.js';
import type { OAuthAppsBridge } from './OAuthAppsBridge.js';
import type { OutboundMessageBridge } from './OutboundMessagesBridge.js';
import type { PersistenceBridge } from './PersistenceBridge.js';
import type { RoleBridge } from './RoleBridge.js';
import type { RoomBridge } from './RoomBridge.js';
import type { SchedulerBridge } from './SchedulerBridge.js';
import type { ServerSettingBridge } from './ServerSettingBridge.js';
import type { ThreadBridge } from './ThreadBridge.js';
import type { UiInteractionBridge } from './UiInteractionBridge.js';
import type { UploadBridge } from './UploadBridge.js';
import type { UserBridge } from './UserBridge.js';
import type { VideoConferenceBridge } from './VideoConferenceBridge.js';

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
	| ExperimentalBridge
	| UploadBridge
	| UserBridge
	| UiInteractionBridge
	| SchedulerBridge
	| VideoConferenceBridge
	| OAuthAppsBridge
	| ModerationBridge
	| RoleBridge
	| OutboundMessageBridge
	| CallHistoryBridge;

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

	public abstract getOutboundMessageBridge(): OutboundMessageBridge;

	public abstract getExperimentalBridge(): ExperimentalBridge;

	public abstract getCallHistoryBridge(): CallHistoryBridge;
}
