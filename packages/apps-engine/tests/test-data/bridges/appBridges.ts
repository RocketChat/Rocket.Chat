import { TestOAuthAppsBridge } from './OAuthAppsBridge';
import { TestsActivationBridge } from './activationBridge';
import { TestsApiBridge } from './apiBridge';
import { TestsAppDetailChangesBridge } from './appDetailChanges';
import { TestAppCloudWorkspaceBridge } from './cloudBridge';
import { TestsCommandBridge } from './commandBridge';
import { TestContactBridge } from './contactBridge';
import { TestsEmailBridge } from './emailBridge';
import { TestsEnvironmentalVariableBridge } from './environmentalVariableBridge';
import { TestsHttpBridge } from './httpBridge';
import { TestsInternalBridge } from './internalBridge';
import { TestsInternalFederationBridge } from './internalFederationBridge';
import { TestLivechatBridge } from './livechatBridge';
import { TestsMessageBridge } from './messageBridge';
import { TestsModerationBridge } from './moderationBridge';
import { TestsPersisBridge } from './persisBridge';
import { TestsRoleBridge } from './roleBridge';
import { TestsRoomBridge } from './roomBridge';
import { TestSchedulerBridge } from './schedulerBridge';
import { TestsServerSettingBridge } from './serverSettingBridge';
import { TestsThreadBridge } from './threadBridge';
import { TestsUiIntegrationBridge } from './uiIntegrationBridge';
import { TestUploadBridge } from './uploadBridge';
import { TestsUserBridge } from './userBridge';
import { TestsVideoConferenceBridge } from './videoConferenceBridge';
import { AppBridges } from '../../../src/server/bridges';
import type {
    AppActivationBridge,
    AppDetailChangesBridge,
    ContactBridge,
    EnvironmentalVariableBridge,
    HttpBridge,
    IInternalBridge,
    IListenerBridge,
    LivechatBridge,
    MessageBridge,
    ModerationBridge,
    PersistenceBridge,
    RoleBridge,
    RoomBridge,
    SchedulerBridge,
    ServerSettingBridge,
    UiInteractionBridge,
    UploadBridge,
    UserBridge,
    VideoConferenceBridge,
} from '../../../src/server/bridges';
import type { CloudWorkspaceBridge } from '../../../src/server/bridges/CloudWorkspaceBridge';
import type { EmailBridge } from '../../../src/server/bridges/EmailBridge';
import type { IInternalFederationBridge } from '../../../src/server/bridges/IInternalFederationBridge';
import type { OAuthAppsBridge } from '../../../src/server/bridges/OAuthAppsBridge';
import type { ThreadBridge } from '../../../src/server/bridges/ThreadBridge';

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
}
