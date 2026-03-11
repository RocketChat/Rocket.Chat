import { TestsAppBridges } from './bridges/appBridges';
import { TestSourceStorage } from './storage/TestSourceStorage';
import { TestsAppLogStorage } from './storage/logStorage';
import { TestsAppStorage } from './storage/storage';
import type { AppOutboundCommunicationProviderManager } from '../../server/managers/AppOutboundCommunicationProviderManager';
import { AppStatus } from '../../src/definition/AppStatus';
import type { IHttp, IModify, IPersistence, IRead } from '../../src/definition/accessors';
import { HttpStatusCode } from '../../src/definition/accessors';
import type { IApi, IApiRequest, IApiResponse } from '../../src/definition/api';
import { ApiSecurity, ApiVisibility } from '../../src/definition/api';
import type { IApiEndpointInfo } from '../../src/definition/api/IApiEndpointInfo';
import type { IMessage, IMessageAttachment, IMessageRaw } from '../../src/definition/messages';
import type {
	IOutboundEmailMessageProvider,
	IOutboundMessage,
	IOutboundPhoneMessageProvider,
	ProviderMetadata,
} from '../../src/definition/outboundComunication';
import type { IRoom } from '../../src/definition/rooms';
import { RoomType } from '../../src/definition/rooms';
import type { ISetting } from '../../src/definition/settings';
import { SettingType } from '../../src/definition/settings';
import type {
	ISlashCommand,
	ISlashCommandPreview,
	ISlashCommandPreviewItem,
	SlashCommandContext,
} from '../../src/definition/slashcommands';
import type { IUser } from '../../src/definition/users';
import { UserStatusConnection, UserType } from '../../src/definition/users';
import type {
	IVideoConferenceOptions,
	IVideoConfProvider,
	VideoConfData,
	VideoConfDataExtended,
} from '../../src/definition/videoConfProviders';
import type { AppVideoConference } from '../../src/definition/videoConferences/AppVideoConference';
import type { VideoConference } from '../../src/definition/videoConferences/IVideoConference';
import { VideoConferenceStatus } from '../../src/definition/videoConferences/IVideoConference';
import type { IVideoConferenceUser } from '../../src/definition/videoConferences/IVideoConferenceUser';
import type { AppManager } from '../../src/server/AppManager';
import { ProxiedApp } from '../../src/server/ProxiedApp';
import type { AppBridges } from '../../src/server/bridges';
import { AppPackageParser } from '../../src/server/compiler';
import type {
	AppExternalComponentManager,
	AppSchedulerManager,
	AppSettingsManager,
	AppSlashCommandManager,
	AppVideoConfProviderManager,
} from '../../src/server/managers';
import type { AppRuntimeManager } from '../../src/server/managers/AppRuntimeManager';
import type { UIActionButtonManager } from '../../src/server/managers/UIActionButtonManager';
import type { IMarketplaceInfo, IMarketplaceSubscriptionInfo } from '../../src/server/marketplace';
import { MarketplacePurchaseType } from '../../src/server/marketplace/MarketplacePurchaseType';
import { MarketplaceSubscriptionStatus } from '../../src/server/marketplace/MarketplaceSubscriptionStatus';
import { MarketplaceSubscriptionType } from '../../src/server/marketplace/MarketplaceSubscriptionType';
import type { IRuntimeController } from '../../src/server/runtime/IRuntimeController';
import type { AppLogStorage, AppMetadataStorage, AppSourceStorage, IAppStorageItem } from '../../src/server/storage';
import { AppInstallationSource } from '../../src/server/storage/IAppStorageItem';

export class TestInfastructureSetup {
	private appStorage: TestsAppStorage;

	private logStorage: TestsAppLogStorage;

	private bridges: TestsAppBridges;

	private sourceStorage: TestSourceStorage;

	private appManager: AppManager;

	private runtimeManager: AppRuntimeManager;

	constructor() {
		this.appStorage = new TestsAppStorage();
		this.logStorage = new TestsAppLogStorage();
		this.bridges = new TestsAppBridges();
		this.sourceStorage = new TestSourceStorage();
		this.runtimeManager = {
			startRuntimeForApp: async () => {
				return TestData.getMockRuntimeController('test');
			},
			runInSandbox: async () => {
				return {} as unknown as Promise<unknown>;
			},
			stopRuntime: () => {},
		} as unknown as AppRuntimeManager;

		this.appManager = {
			getParser() {
				if (!this.parser) {
					this.parser = new AppPackageParser();
				}

				return this.parser;
			},
			getBridges: () => {
				return this.bridges as AppBridges;
			},
			getCommandManager() {
				return {} as AppSlashCommandManager;
			},
			getExternalComponentManager() {
				return {} as AppExternalComponentManager;
			},
			getOneById(appId: string): ProxiedApp {
				return appId === 'failMePlease'
					? undefined
					: TestData.getMockApp({ info: { id: appId, name: 'testing' } } as IAppStorageItem, this);
			},
			getLogStorage(): AppLogStorage {
				return new TestsAppLogStorage();
			},
			getSchedulerManager() {
				return {} as AppSchedulerManager;
			},
			getUIActionButtonManager() {
				return {} as UIActionButtonManager;
			},
			getVideoConfProviderManager() {
				return {} as AppVideoConfProviderManager;
			},
			getOutboundCommunicationProviderManager() {
				return {} as AppOutboundCommunicationProviderManager;
			},
			getSettingsManager() {
				return {} as AppSettingsManager;
			},
			getRuntime: () => {
				return this.runtimeManager;
			},
		} as unknown as AppManager;
	}

	public getAppStorage(): AppMetadataStorage {
		return this.appStorage;
	}

	public getLogStorage(): AppLogStorage {
		return this.logStorage;
	}

	public getAppBridges(): AppBridges {
		return this.bridges;
	}

	public getSourceStorage(): AppSourceStorage {
		return this.sourceStorage;
	}

	public getMockManager(): AppManager {
		return this.appManager;
	}
}

const date = new Date();

const DEFAULT_ATTACHMENT = {
	color: '#00b2b2',
	collapsed: false,
	text: 'Just an attachment that is used for testing',
	timestampLink: 'https://google.com/',
	thumbnailUrl: 'https://avatars0.githubusercontent.com/u/850391?s=88&v=4',
	author: {
		name: 'Author Name',
		link: 'https://github.com/graywolf336',
		icon: 'https://avatars0.githubusercontent.com/u/850391?s=88&v=4',
	},
	title: {
		value: 'Attachment Title',
		link: 'https://github.com/RocketChat',
		displayDownloadLink: false,
	},
	imageUrl: 'https://rocket.chat/images/default/logo.svg',
	audioUrl: 'http://www.w3schools.com/tags/horse.mp3',
	videoUrl: 'http://www.w3schools.com/tags/movie.mp4',
	fields: [
		{
			short: true,
			title: 'Test',
			value: 'Testing out something or other',
		},
		{
			short: true,
			title: 'Another Test',
			value: '[Link](https://google.com/) something and this and that.',
		},
	],
};
export class TestData {
	public static getDate(): Date {
		return date;
	}

	public static getSetting(id?: string): ISetting {
		return {
			id: id || 'testing',
			type: SettingType.STRING,
			packageValue: 'The packageValue',
			required: false,
			public: false,
			i18nLabel: 'Testing',
		};
	}

	public static getUser(id?: string, username?: string): IUser {
		return {
			id: id || 'BBxwgCBzLeMC6esTb',
			username: username || 'testing-user',
			name: 'Testing User',
			emails: [],
			type: UserType.USER,
			isEnabled: true,
			roles: ['admin'],
			status: 'online',
			statusConnection: UserStatusConnection.ONLINE,
			utcOffset: -5,
			createdAt: date,
			updatedAt: new Date(),
			lastLoginAt: new Date(),
		};
	}

	public static getRoom(id?: string, slugifiedName?: string): IRoom {
		return {
			id: id || 'bTse6CMeLzBCgwxBB',
			slugifiedName: slugifiedName || 'testing-room',
			displayName: 'Testing Room',
			type: RoomType.CHANNEL,
			creator: TestData.getUser(),
			usernames: [TestData.getUser().username],
			isDefault: true,
			isReadOnly: false,
			displaySystemMessages: true,
			messageCount: 145,
			createdAt: date,
			updatedAt: new Date(),
			lastModifiedAt: new Date(),
		};
	}

	public static getMessage(id?: string, text?: string): IMessage {
		return {
			id: id || '4bShvoOXqB',
			room: TestData.getRoom(),
			sender: TestData.getUser(),
			text: 'This is just a test, do not be alarmed',
			createdAt: date,
			updatedAt: new Date(),
			editor: TestData.getUser(),
			editedAt: new Date(),
			emoji: ':see_no_evil:',
			avatarUrl: 'https://avatars0.githubusercontent.com/u/850391?s=88&v=4',
			alias: 'Testing Bot',
			attachments: [this.createAttachment()],
		};
	}

	public static getMessageRaw(id?: string, text?: string): IMessageRaw {
		const editorUser = TestData.getUser();
		const senderUser = TestData.getUser();

		return {
			id: id || '4bShvoOXqB',
			roomId: TestData.getRoom().id,
			sender: {
				_id: senderUser.id,
				username: senderUser.username,
				name: senderUser?.name,
			},
			text: text || 'This is just a test, do not be alarmed',
			createdAt: date,
			updatedAt: new Date(),
			editor: {
				_id: editorUser.id,
				username: editorUser.username,
			},
			editedAt: new Date(),
			emoji: ':see_no_evil:',
			avatarUrl: 'https://avatars0.githubusercontent.com/u/850391?s=88&v=4',
			alias: 'Testing Bot',
			attachments: [this.createAttachment()],
		};
	}

	private static createAttachment(attachment?: IMessageAttachment): IMessageAttachment {
		attachment = attachment || DEFAULT_ATTACHMENT;
		return {
			timestamp: new Date(),
			...attachment,
		};
	}

	public static getSlashCommand(command?: string): ISlashCommand {
		return {
			command: command || 'testing-cmd',
			i18nParamsExample: 'justATest',
			i18nDescription: 'justATest_Description',
			permission: 'create-c',
			providesPreview: true,
			executor: (context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> => {
				return Promise.resolve();
			},
			previewer: (
				context: SlashCommandContext,
				read: IRead,
				modify: IModify,
				http: IHttp,
				persis: IPersistence,
			): Promise<ISlashCommandPreview> => {
				return Promise.resolve({
					i18nTitle: 'my i18nTitle',
					items: [],
				} as ISlashCommandPreview);
			},
			executePreviewItem: (
				item: ISlashCommandPreviewItem,
				context: SlashCommandContext,
				read: IRead,
				modify: IModify,
				http: IHttp,
				persis: IPersistence,
			): Promise<void> => {
				return Promise.resolve();
			},
		};
	}

	public static getApi(
		path = 'testing-path',
		visibility: ApiVisibility = ApiVisibility.PUBLIC,
		security: ApiSecurity = ApiSecurity.UNSECURE,
	): IApi {
		return {
			visibility,
			security,
			endpoints: [
				{
					path,
					// The move to the Deno runtime now requires us to manually set what methods are available
					_availableMethods: ['get'],
					get(
						request: IApiRequest,
						endpoint: IApiEndpointInfo,
						read: IRead,
						modify: IModify,
						http: IHttp,
						persis: IPersistence,
					): Promise<IApiResponse> {
						return Promise.resolve({
							status: HttpStatusCode.OK,
						});
					},
				},
			],
		};
	}

	public static getVideoConfProvider(name = 'test'): IVideoConfProvider {
		return {
			name,

			async generateUrl(call: VideoConfData): Promise<string> {
				return `${name}/${call._id}`;
			},

			async customizeUrl(
				call: VideoConfDataExtended,
				user: IVideoConferenceUser | undefined,
				options: IVideoConferenceOptions,
			): Promise<string> {
				return `${name}/${call._id}#${user ? user.username : ''}`;
			},
		};
	}

	public static getInvalidConfProvider(name = 'invalid'): IVideoConfProvider {
		return {
			name,

			async isFullyConfigured(): Promise<boolean> {
				return false;
			},

			async generateUrl(call: VideoConfData): Promise<string> {
				return ``;
			},

			async customizeUrl(
				call: VideoConfDataExtended,
				user: IVideoConferenceUser | undefined,
				options: IVideoConferenceOptions,
			): Promise<string> {
				return ``;
			},
		};
	}

	public static getFullVideoConfProvider(name = 'test'): IVideoConfProvider {
		return {
			name,

			capabilities: {
				mic: true,
				cam: true,
				title: true,
			},

			async isFullyConfigured(): Promise<boolean> {
				return true;
			},

			async generateUrl(call: VideoConfData): Promise<string> {
				return `${name}/${call._id}`;
			},

			async customizeUrl(
				call: VideoConfDataExtended,
				user: IVideoConferenceUser | undefined,
				options: IVideoConferenceOptions,
			): Promise<string> {
				return `${name}/${call._id}#${user ? user.username : ''}`;
			},
		};
	}

	public static getVideoConferenceUser(): IVideoConferenceUser {
		return {
			_id: 'callerId',
			username: 'caller',
			name: 'John Caller',
		};
	}

	public static getVideoConfData(): VideoConfData {
		return {
			_id: 'first-call',
			type: 'videoconference',
			rid: 'roomId',
			createdBy: this.getVideoConferenceUser(),
			title: 'Test Call',
		};
	}

	public static getVideoConfDataExtended(providerName = 'test'): VideoConfDataExtended {
		return {
			...this.getVideoConfData(),
			url: '${providerName}/first-call',
		};
	}

	public static getAppVideoConference(): AppVideoConference {
		return {
			rid: 'roomId',
			createdBy: 'userId',
			title: 'Video Conference',
			providerName: 'test',
		};
	}

	public static getVideoConference(): VideoConference {
		return {
			_id: 'first-call',
			_updatedAt: new Date(),
			type: 'videoconference',
			rid: 'roomId',
			users: [
				{
					_id: 'johnId',
					name: 'John Doe',
					username: 'mrdoe',
					ts: new Date(),
				},
				{
					_id: 'janeId',
					name: 'Jane Doe',
					username: 'msdoe',
					ts: new Date(),
				},
			],
			status: VideoConferenceStatus.STARTED,
			messages: {
				started: 'messageId',
			},
			url: 'video-conf/first-call',
			createdBy: {
				_id: 'johnId',
				name: 'John Doe',
				username: 'mrdoe',
			},
			createdAt: new Date(),
			title: 'Video Conference',
			anonymousUsers: 0,
			providerName: 'test',
		};
	}

	public static getOutboundPhoneMessageProvider(name = 'Test Phone Provider'): IOutboundPhoneMessageProvider {
		return {
			type: 'phone',
			appId: `${name}-app-id`,
			name,
			supportsTemplates: true,
			documentationUrl: 'https://rocket.chat',
			sendOutboundMessage: async (message): Promise<void> => {
				console.log('Sending message', message);
			},
			getProviderMetadata: async (): Promise<ProviderMetadata> => {
				return {} as ProviderMetadata;
			},
		};
	}

	public static getOutboundEmailMessageProvider(name = 'Test Email Provider'): IOutboundEmailMessageProvider {
		return {
			type: 'email',
			appId: `${name}-app-id`,
			name,
			supportsTemplates: true,
			documentationUrl: 'https://rocket.chat',
			sendOutboundMessage: async (message): Promise<void> => {
				console.log('Sending message', message);
			},
		};
	}

	public static getOutboundMessage(): IOutboundMessage {
		return {
			to: '+123456789',
			type: 'template',
			templateProviderPhoneNumber: '+123456789',
			agentId: 'agent-id',
			departmentId: 'department-id',
			template: {
				name: 'template-name',
				language: {
					code: 'en',
					policy: 'deterministic',
				},
				components: [
					{
						type: 'body',
						parameters: [
							{
								type: 'text',
								text: 'Sample text',
							},
						],
					},
				],
				namespace: 'template-namespace',
			},
		};
	}

	public static getOAuthApp(isToCreate: boolean) {
		const OAuthApp = {
			_id: '4526fcab-b068-4dcc-b208-4fff599165b0',
			name: 'name-test',
			active: true,
			clientId: 'clientId-test',
			clientSecret: 'clientSecret-test',
			redirectUri: 'redirectUri-test',
			appId: 'app-123',
			_createdAt: '2022-07-11T14:30:48.937Z',
			_createdBy: {
				_id: 'Em5TQwMD4P7AmTs73',
				username: 'testa.bot',
			},
			_updatedAt: '2022-07-11T14:30:48.937Z',
		};

		if (isToCreate) {
			delete OAuthApp._id;
			delete OAuthApp._createdAt;
			delete OAuthApp._createdBy;
			delete OAuthApp._updatedAt;
			delete OAuthApp.appId;
		}
		return OAuthApp;
	}

	public static getMockRuntimeController(id: string): IRuntimeController {
		const mock = {
			getStatus: () => Promise.resolve(AppStatus.AUTO_ENABLED),
			sendRequest: () => Promise.resolve(undefined),
			setupApp: () => Promise.resolve(),
			stopApp: () => Promise.resolve(),
			getAppId: () => id,
			on: () => mock,
			once: () => mock,
			off: () => mock,
			emit: () => true,
			addListener: () => mock,
			removeListener: () => mock,
			removeAllListeners: () => mock,
			setMaxListeners: () => mock,
			getMaxListeners: () => 10,
			listeners: () => [],
			rawListeners: () => [],
			listenerCount: () => 0,
			prependListener: () => mock,
			prependOnceListener: () => mock,
			eventNames: () => [],
		} as IRuntimeController;

		return mock;
	}

	public static getMockApp(storageItem: Partial<IAppStorageItem>, manager: AppManager): ProxiedApp {
		const { id, name } = storageItem.info || { id: 'test-app', name: 'Test App' };

		return new ProxiedApp(
			manager,
			{ id, status: AppStatus.AUTO_ENABLED, info: { id, name }, ...storageItem } as IAppStorageItem,
			TestData.getMockRuntimeController(id),
		);
	}

	public static getMarketplaceSubscriptionInfo(overrides: Partial<IMarketplaceSubscriptionInfo> = {}): IMarketplaceSubscriptionInfo {
		return {
			seats: 10,
			maxSeats: 100,
			startDate: '2023-01-01',
			periodEnd: '2023-12-31',
			isSubscripbedViaBundle: false,
			typeOf: MarketplaceSubscriptionType.SubscriptionTypeApp,
			status: MarketplaceSubscriptionStatus.PurchaseSubscriptionStatusActive,
			license: {
				license: 'encrypted-license-data',
				version: 1,
				expireDate: new Date('2023-01-01'),
			},
			...overrides,
		};
	}

	public static getMarketplaceInfo(overrides: Partial<IMarketplaceInfo> = {}): IMarketplaceInfo {
		return {
			id: 'test-app',
			name: 'Test App',
			nameSlug: 'test-app',
			version: '1.0.0',
			description: 'Test app',
			author: { name: 'Test Author', support: 'https://test.com', homepage: 'https://test.com' },
			permissions: [],
			requiredApiVersion: '1.0.0',
			classFile: 'main.js',
			iconFile: 'icon.png',
			implements: [],
			categories: [],
			status: 'active',
			isVisible: true,
			isPurchased: false,
			isSubscribed: false,
			isBundled: false,
			createdDate: '2023-01-01',
			modifiedDate: '2023-01-01',
			price: 0,
			purchaseType: MarketplacePurchaseType.PurchaseTypeSubscription,
			subscriptionInfo: TestData.getMarketplaceSubscriptionInfo(),
			...overrides,
		};
	}

	public static getAppStorageItem(overrides: Partial<IAppStorageItem> = {}): IAppStorageItem {
		return {
			id: 'test-app',
			status: AppStatus.AUTO_ENABLED,
			info: {
				id: 'test-app',
				name: 'Test App',
				nameSlug: 'test-app',
				version: '1.0.0',
				description: 'Test app',
				author: { name: 'Test Author', support: 'https://test.com', homepage: 'https://test.com' },
				permissions: [],
				requiredApiVersion: '1.0.0',
				classFile: 'main.js',
				iconFile: 'icon.png',
				implements: [],
			},
			marketplaceInfo: [TestData.getMarketplaceInfo()],
			createdAt: new Date(),
			updatedAt: new Date(),
			installationSource: AppInstallationSource.MARKETPLACE,
			languageContent: {},
			settings: {},
			implemented: {},
			signature: 'default-signature',
			...overrides,
		};
	}

	public static getAppsOverview(subscriptionInfo?: IMarketplaceSubscriptionInfo): Array<{ latest: IMarketplaceInfo }> {
		return [
			{
				latest: TestData.getMarketplaceInfo({
					subscriptionInfo: subscriptionInfo || TestData.getMarketplaceSubscriptionInfo(),
				}),
			},
		];
	}
}

export class SimpleClass {
	private readonly world: string;

	constructor(world = 'Earith') {
		this.world = world;
	}

	public getWorld(): string {
		return this.world;
	}
}
