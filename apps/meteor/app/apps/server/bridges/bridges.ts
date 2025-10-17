import { AppBridges } from '@rocket.chat/apps-engine/server/bridges';

import { AppActivationBridge } from './activation';
import { AppApisBridge } from './api';
import { AppCloudBridge } from './cloud';
import { AppCommandsBridge } from './commands';
import { AppContactBridge } from './contact';
import { AppDetailChangesBridge } from './details';
import { AppEmailBridge } from './email';
import { AppEnvironmentalVariableBridge } from './environmental';
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

	constructor(orch: any) {
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
	}

	getCommandBridge(): AppCommandsBridge {
		return this._cmdBridge;
	}

	getApiBridge(): AppApisBridge {
		return this._apiBridge;
	}

	getEnvironmentalVariableBridge(): AppEnvironmentalVariableBridge {
		return this._envBridge;
	}

	getHttpBridge(): AppHttpBridge {
		return this._httpBridge;
	}

	getListenerBridge(): AppListenerBridge {
		return this._lisnBridge;
	}

	getMessageBridge(): AppMessageBridge {
		return this._msgBridge;
	}

	getThreadBridge(): AppThreadBridge {
		return this._threadBridge;
	}

	getPersistenceBridge(): AppPersistenceBridge {
		return this._persistBridge;
	}

	getAppActivationBridge(): AppActivationBridge {
		return this._actBridge;
	}

	getAppDetailChangesBridge(): AppDetailChangesBridge {
		return this._detBridge;
	}

	getRoomBridge(): AppRoomBridge {
		return this._roomBridge;
	}

	getInternalBridge(): AppInternalBridge {
		return this._internalBridge;
	}

	getServerSettingBridge(): AppSettingBridge {
		return this._setsBridge;
	}

	getUserBridge(): AppUserBridge {
		return this._userBridge;
	}

	getLivechatBridge(): AppLivechatBridge {
		return this._livechatBridge;
	}

	getUploadBridge(): AppUploadBridge {
		return this._uploadBridge;
	}

	getUiInteractionBridge(): UiInteractionBridge {
		return this._uiInteractionBridge;
	}

	getSchedulerBridge(): AppSchedulerBridge {
		return this._schedulerBridge;
	}

	getCloudWorkspaceBridge(): AppCloudBridge {
		return this._cloudWorkspaceBridge;
	}

	getVideoConferenceBridge(): AppVideoConferenceBridge {
		return this._videoConfBridge;
	}

	getOutboundMessageBridge(): OutboundCommunicationBridge {
		return this._outboundMessageBridge;
	}

	getOAuthAppsBridge(): AppOAuthAppsBridge {
		return this._oAuthBridge;
	}

	getInternalFederationBridge(): AppInternalFederationBridge {
		return this._internalFedBridge;
	}

	getModerationBridge(): AppModerationBridge {
		return this._moderationBridge;
	}

	getRoleBridge(): AppRoleBridge {
		return this._roleBridge;
	}

	getEmailBridge(): AppEmailBridge {
		return this._emailBridge;
	}

	getContactBridge(): AppContactBridge {
		return this._contactBridge;
	}
}
