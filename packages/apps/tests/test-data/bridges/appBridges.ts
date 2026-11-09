import { TestOAuthAppsBridge } from './OAuthAppsBridge.js';
import { TestsActivationBridge } from './activationBridge.js';
import { TestsApiBridge } from './apiBridge.js';
import { TestsAppDetailChangesBridge } from './appDetailChanges.js';
import { TestsCallHistoryBridge } from './callHistoryBridge.js';
import { TestAppCloudWorkspaceBridge } from './cloudBridge.js';
import { TestsCommandBridge } from './commandBridge.js';
import { TestContactBridge } from './contactBridge.js';
import { TestsEmailBridge } from './emailBridge.js';
import { TestsEnvironmentalVariableBridge } from './environmentalVariableBridge.js';
import { TestExperimentalBridge } from './experimentalBridge.js';
import { TestsHttpBridge } from './httpBridge.js';
import { TestsInternalBridge } from './internalBridge.js';
import { TestsInternalFederationBridge } from './internalFederationBridge.js';
import { TestLivechatBridge } from './livechatBridge.js';
import { TestsMessageBridge } from './messageBridge.js';
import { TestsModerationBridge } from './moderationBridge.js';
import { TestOutboundCommunicationBridge } from './outboundComms.js';
import { TestsPersisBridge } from './persisBridge.js';
import { TestsRoleBridge } from './roleBridge.js';
import { TestsRoomBridge } from './roomBridge.js';
import { TestSchedulerBridge } from './schedulerBridge.js';
import { TestsServerSettingBridge } from './serverSettingBridge.js';
import { TestsThreadBridge } from './threadBridge.js';
import { TestsUiIntegrationBridge } from './uiIntegrationBridge.js';
import { TestUploadBridge } from './uploadBridge.js';
import { TestsUserBridge } from './userBridge.js';
import { TestsVideoConferenceBridge } from './videoConferenceBridge.js';
import type { CloudWorkspaceBridge } from '../../../src/server/bridges/CloudWorkspaceBridge.js';
import type { EmailBridge } from '../../../src/server/bridges/EmailBridge.js';
import type { IInternalFederationBridge } from '../../../src/server/bridges/IInternalFederationBridge.js';
import type { OAuthAppsBridge } from '../../../src/server/bridges/OAuthAppsBridge.js';
import type { ThreadBridge } from '../../../src/server/bridges/ThreadBridge.js';
import type {
	AppActivationBridge,
	AppDetailChangesBridge,
	ContactBridge,
	EnvironmentalVariableBridge,
	ExperimentalBridge,
	HttpBridge,
	IInternalBridge,
	IListenerBridge,
	CallHistoryBridge,
	LivechatBridge,
	MessageBridge,
	ModerationBridge,
	OutboundMessageBridge,
	PersistenceBridge,
	RoleBridge,
	RoomBridge,
	SchedulerBridge,
	ServerSettingBridge,
	UiInteractionBridge,
	UploadBridge,
	UserBridge,
	VideoConferenceBridge,
} from '../../../src/server/bridges/index.js';
import { AppBridges } from '../../../src/server/bridges/index.js';

export class TestsAppBridges extends AppBridges {
	private readonly appDetails: TestsAppDetailChangesBridge;

	private readonly cmdBridge: TestsCommandBridge;

	private readonly apiBridge: TestsApiBridge;

	private readonly setsBridge: TestsServerSettingBridge;

	private readonly envBridge: TestsEnvironmentalVariableBridge;

	private readonly rlActBridge: TestsActivationBridge;

	private readonly msgBridge: TestsMessageBridge;

	private readonly moderationBridge: TestsModerationBridge;

	private readonly persisBridge: TestsPersisBridge;

	private readonly roleBridge: TestsRoleBridge;

	private readonly roomBridge: TestsRoomBridge;

	private readonly internalBridge: TestsInternalBridge;

	private readonly userBridge: TestsUserBridge;

	private readonly httpBridge: TestsHttpBridge;

	private readonly livechatBridge: TestLivechatBridge;

	private readonly uploadBridge: TestUploadBridge;

	private readonly emailBridge: EmailBridge;

	private readonly contactBridge: ContactBridge;

	private readonly uiIntegrationBridge: TestsUiIntegrationBridge;

	private readonly schedulerBridge: TestSchedulerBridge;

	private readonly cloudWorkspaceBridge: TestAppCloudWorkspaceBridge;

	private readonly videoConfBridge: TestsVideoConferenceBridge;

	private readonly oauthBridge: OAuthAppsBridge;

	private readonly internalFederationBridge: IInternalFederationBridge;

	private readonly threadBridge: ThreadBridge;

	private readonly outboundCommsBridge: TestOutboundCommunicationBridge;

	private readonly experimentalBridge: TestExperimentalBridge;

	private readonly callHistoryBridge: TestsCallHistoryBridge;

	constructor() {
		super();
		this.appDetails = new TestsAppDetailChangesBridge();
		this.cmdBridge = new TestsCommandBridge();
		this.apiBridge = new TestsApiBridge();
		this.setsBridge = new TestsServerSettingBridge();
		this.envBridge = new TestsEnvironmentalVariableBridge();
		this.rlActBridge = new TestsActivationBridge();
		this.msgBridge = new TestsMessageBridge();
		this.moderationBridge = new TestsModerationBridge();
		this.persisBridge = new TestsPersisBridge();
		this.roleBridge = new TestsRoleBridge();
		this.roomBridge = new TestsRoomBridge();
		this.internalBridge = new TestsInternalBridge();
		this.userBridge = new TestsUserBridge();
		this.httpBridge = new TestsHttpBridge();
		this.livechatBridge = new TestLivechatBridge();
		this.uploadBridge = new TestUploadBridge();
		this.uiIntegrationBridge = new TestsUiIntegrationBridge();
		this.schedulerBridge = new TestSchedulerBridge();
		this.cloudWorkspaceBridge = new TestAppCloudWorkspaceBridge();
		this.videoConfBridge = new TestsVideoConferenceBridge();
		this.oauthBridge = new TestOAuthAppsBridge();
		this.internalFederationBridge = new TestsInternalFederationBridge();
		this.threadBridge = new TestsThreadBridge();
		this.emailBridge = new TestsEmailBridge();
		this.contactBridge = new TestContactBridge();
		this.outboundCommsBridge = new TestOutboundCommunicationBridge();
		this.experimentalBridge = new TestExperimentalBridge();
		this.callHistoryBridge = new TestsCallHistoryBridge();
	}

	public getCommandBridge(): TestsCommandBridge {
		return this.cmdBridge;
	}

	public getApiBridge(): TestsApiBridge {
		return this.apiBridge;
	}

	public getServerSettingBridge(): ServerSettingBridge {
		return this.setsBridge;
	}

	public getEnvironmentalVariableBridge(): EnvironmentalVariableBridge {
		return this.envBridge;
	}

	public getAppDetailChangesBridge(): AppDetailChangesBridge {
		return this.appDetails;
	}

	public getHttpBridge(): HttpBridge {
		return this.httpBridge;
	}

	public getListenerBridge(): IListenerBridge {
		throw new Error('Method not implemented.');
	}

	public getMessageBridge(): MessageBridge {
		return this.msgBridge;
	}

	public getModerationBridge(): ModerationBridge {
		return this.moderationBridge;
	}

	public getPersistenceBridge(): PersistenceBridge {
		return this.persisBridge;
	}

	public getAppActivationBridge(): AppActivationBridge {
		return this.rlActBridge;
	}

	public getThreadBridge(): ThreadBridge {
		return this.threadBridge;
	}

	public getRoleBridge(): RoleBridge {
		return this.roleBridge;
	}

	public getRoomBridge(): RoomBridge {
		return this.roomBridge;
	}

	public getInternalBridge(): IInternalBridge {
		return this.internalBridge;
	}

	public getUserBridge(): UserBridge {
		return this.userBridge;
	}

	public getLivechatBridge(): LivechatBridge {
		return this.livechatBridge;
	}

	public getEmailBridge(): EmailBridge {
		return this.emailBridge;
	}

	public getUploadBridge(): UploadBridge {
		return this.uploadBridge;
	}

	public getUiInteractionBridge(): UiInteractionBridge {
		return this.uiIntegrationBridge;
	}

	public getSchedulerBridge(): SchedulerBridge {
		return this.schedulerBridge;
	}

	public getCloudWorkspaceBridge(): CloudWorkspaceBridge {
		return this.cloudWorkspaceBridge;
	}

	public getVideoConferenceBridge(): VideoConferenceBridge {
		return this.videoConfBridge;
	}

	public getOAuthAppsBridge(): OAuthAppsBridge {
		return this.oauthBridge;
	}

	public getInternalFederationBridge(): IInternalFederationBridge {
		return this.internalFederationBridge;
	}

	public getContactBridge(): ContactBridge {
		return this.contactBridge;
	}

	public getOutboundMessageBridge(): OutboundMessageBridge {
		return this.outboundCommsBridge;
	}

	public getExperimentalBridge(): ExperimentalBridge {
		return this.experimentalBridge;
	}

	public getCallHistoryBridge(): CallHistoryBridge {
		return this.callHistoryBridge;
	}
}
