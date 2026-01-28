import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { AppBridges } from '@rocket.chat/apps-engine/server/bridges';
import type {
	ApiBridge,
	CloudWorkspaceBridge,
	CommandBridge,
	ContactBridge,
	EmailBridge,
	EnvironmentalVariableBridge,
	ExperimentalBridge,
	HttpBridge,
	IInternalBridge,
	IInternalFederationBridge,
	LivechatBridge,
	MessageBridge,
	ModerationBridge,
	OutboundMessageBridge,
	PersistenceBridge,
	RoleBridge,
	RoomBridge,
	SchedulerBridge,
	ServerSettingBridge,
	ThreadBridge,
	UserBridge,
	VideoConferenceBridge,
} from '@rocket.chat/apps-engine/server/bridges';
import type { OAuthAppsBridge } from '@rocket.chat/apps-engine/server/bridges/OAuthAppsBridge';
import type { UploadBridge } from '@rocket.chat/apps-engine/server/bridges/UploadBridge';

import { AppActivationBridge } from './activation';
import { AppApisBridge } from './api';
import { AppCloudBridge } from './cloud';
import { AppCommandsBridge } from './commands';
import { AppContactBridge } from './contact';
import { AppDetailChangesBridge } from './details';
import { AppEmailBridge } from './email';
import { AppEnvironmentalVariableBridge } from './environmental';
import { AppExperimentalBridge } from './experimental';
import { AppHttpBridge } from './http';
import { AppInternalBridge } from './internal';
import { AppInternalFederationBridge } from './internalFederation';
import { AppListenerBridge } from './listeners';
import { AppLivechatBridge } from './livechat';
import { AppMessageBridge } from './messages';
import { AppModerationBridge } from './moderation';
import { AppOAuthAppsBridge } from './oauthApps';
import { OutboundCommunicationBridge } from './outboundCommunication';
import { AppPersistenceBridge } from './persistence';
import { AppRoleBridge } from './roles';
import { AppRoomBridge } from './rooms';
import { AppSchedulerBridge } from './scheduler';
import { AppSettingBridge } from './settings';
import { AppThreadBridge } from './thread';
import { UiInteractionBridge } from './uiInteraction';
import { AppUploadBridge } from './uploads';
import { AppUserBridge } from './users';
import { AppVideoConferenceBridge } from './videoConferences';

export class RealAppBridges extends AppBridges {
	private _actBridge: AppActivationBridge;

	private _cmdBridge: AppCommandsBridge;

	private _apiBridge: AppApisBridge;

	private _detBridge: AppDetailChangesBridge;

	private _envBridge: AppEnvironmentalVariableBridge;

	private _httpBridge: AppHttpBridge;

	private _lisnBridge: AppListenerBridge;

	private _msgBridge: AppMessageBridge;

	private _persistBridge: AppPersistenceBridge;

	private _roomBridge: AppRoomBridge;

	private _internalBridge: AppInternalBridge;

	private _setsBridge: AppSettingBridge;

	private _userBridge: AppUserBridge;

	private _livechatBridge: AppLivechatBridge;

	private _uploadBridge: AppUploadBridge;

	private _uiInteractionBridge: UiInteractionBridge;

	private _schedulerBridge: AppSchedulerBridge;

	private _cloudWorkspaceBridge: AppCloudBridge;

	private _videoConfBridge: AppVideoConferenceBridge;

	private _oAuthBridge: AppOAuthAppsBridge;

	private _internalFedBridge: AppInternalFederationBridge;

	private _moderationBridge: AppModerationBridge;

	private _threadBridge: AppThreadBridge;

	private _roleBridge: AppRoleBridge;

	private _emailBridge: AppEmailBridge;

	private _contactBridge: AppContactBridge;

	private _outboundMessageBridge: OutboundCommunicationBridge;

	private _experimentalBridge: AppExperimentalBridge;

	constructor(orch: IAppServerOrchestrator) {
		super();

		this._actBridge = new AppActivationBridge(orch);
		this._cmdBridge = new AppCommandsBridge(orch);
		this._apiBridge = new AppApisBridge(orch);
		this._detBridge = new AppDetailChangesBridge(orch);
		this._envBridge = new AppEnvironmentalVariableBridge(orch);
		this._httpBridge = new AppHttpBridge(orch);
		this._lisnBridge = new AppListenerBridge(orch);
		this._msgBridge = new AppMessageBridge(orch);
		this._persistBridge = new AppPersistenceBridge(orch);
		this._roomBridge = new AppRoomBridge(orch);
		this._internalBridge = new AppInternalBridge(orch);
		this._setsBridge = new AppSettingBridge(orch);
		this._userBridge = new AppUserBridge(orch);
		this._livechatBridge = new AppLivechatBridge(orch);
		this._uploadBridge = new AppUploadBridge(orch);
		this._uiInteractionBridge = new UiInteractionBridge(orch);
		this._schedulerBridge = new AppSchedulerBridge(orch);
		this._cloudWorkspaceBridge = new AppCloudBridge(orch);
		this._videoConfBridge = new AppVideoConferenceBridge(orch);
		this._oAuthBridge = new AppOAuthAppsBridge(orch);
		this._internalFedBridge = new AppInternalFederationBridge();
		this._moderationBridge = new AppModerationBridge(orch);
		this._threadBridge = new AppThreadBridge(orch);
		this._roleBridge = new AppRoleBridge(orch);
		this._emailBridge = new AppEmailBridge(orch);
		this._contactBridge = new AppContactBridge(orch);
		this._outboundMessageBridge = new OutboundCommunicationBridge(orch);
		this._experimentalBridge = new AppExperimentalBridge(orch);
	}

	getCommandBridge(): CommandBridge {
		return this._cmdBridge;
	}

	getApiBridge(): ApiBridge {
		return this._apiBridge;
	}

	getEnvironmentalVariableBridge(): EnvironmentalVariableBridge {
		return this._envBridge;
	}

	getHttpBridge(): HttpBridge {
		return this._httpBridge;
	}

	getListenerBridge() {
		return this._lisnBridge as any; // FIXME: AppListenerBridge does not implement IListenerBridge
	}

	getMessageBridge(): MessageBridge {
		return this._msgBridge;
	}

	getThreadBridge(): ThreadBridge {
		return this._threadBridge;
	}

	getPersistenceBridge(): PersistenceBridge {
		return this._persistBridge;
	}

	getAppActivationBridge(): AppActivationBridge {
		return this._actBridge;
	}

	getAppDetailChangesBridge(): AppDetailChangesBridge {
		return this._detBridge;
	}

	getRoomBridge(): RoomBridge {
		return this._roomBridge;
	}

	getInternalBridge(): IInternalBridge {
		return this._internalBridge;
	}

	getServerSettingBridge(): ServerSettingBridge {
		return this._setsBridge;
	}

	getUserBridge(): UserBridge {
		return this._userBridge;
	}

	getLivechatBridge(): LivechatBridge {
		return this._livechatBridge;
	}

	getUploadBridge(): UploadBridge {
		return this._uploadBridge;
	}

	getUiInteractionBridge(): UiInteractionBridge {
		return this._uiInteractionBridge;
	}

	getSchedulerBridge(): SchedulerBridge {
		return this._schedulerBridge;
	}

	getCloudWorkspaceBridge(): CloudWorkspaceBridge {
		return this._cloudWorkspaceBridge;
	}

	getVideoConferenceBridge(): VideoConferenceBridge {
		return this._videoConfBridge;
	}

	getOutboundMessageBridge(): OutboundMessageBridge {
		return this._outboundMessageBridge;
	}

	getOAuthAppsBridge(): OAuthAppsBridge {
		return this._oAuthBridge;
	}

	getInternalFederationBridge(): IInternalFederationBridge {
		return this._internalFedBridge;
	}

	getModerationBridge(): ModerationBridge {
		return this._moderationBridge;
	}

	getRoleBridge(): RoleBridge {
		return this._roleBridge;
	}

	getEmailBridge(): EmailBridge {
		return this._emailBridge;
	}

	getContactBridge(): ContactBridge {
		return this._contactBridge;
	}

	getExperimentalBridge(): ExperimentalBridge {
		return this._experimentalBridge;
	}
}
