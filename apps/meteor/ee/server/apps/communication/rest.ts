import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import { AppInstallationSource } from '@rocket.chat/apps-engine/server/storage';
import type { IUser, IMessage } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';

import type { APIClass } from '../../../../app/api/server';
import { API } from '../../../../app/api/server';
import { getPaginationItems } from '../../../../app/api/server/helpers/getPaginationItems';
import { getUploadFormData } from '../../../../app/api/server/lib/getUploadFormData';
import { getWorkspaceAccessToken, getWorkspaceAccessTokenWithScope } from '../../../../app/cloud/server';
import { apiDeprecationLogger } from '../../../../app/lib/server/lib/deprecationWarningLogger';
import { settings } from '../../../../app/settings/server';
import { Info } from '../../../../app/utils/rocketchat.info';
import { i18n } from '../../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
import { canEnableApp, isEnterprise } from '../../../app/license/server/license';
import { formatAppInstanceForRest } from '../../../lib/misc/formatAppInstanceForRest';
import { appEnableCheck } from '../marketplace/appEnableCheck';
import { notifyAppInstall } from '../marketplace/appInstall';
import type { AppServerOrchestrator } from '../orchestrator';
import { Apps } from '../orchestrator';
import { actionButtonsHandler } from './endpoints/actionButtonsHandler';
import { appsCountHandler } from './endpoints/appsCountHandler';

const rocketChatVersion = Info.version;
const appsEngineVersionForMarketplace = Info.marketplaceApiVersion.replace(/-.*/g, '');
const getDefaultHeaders = (): Record<string, any> => ({
	'X-Apps-Engine-Version': appsEngineVersionForMarketplace,
});

const purchaseTypes = new Set(['buy', 'subscription']);

export class AppsRestApi {
	public api: APIClass<'/apps'>;

	public _orch: AppServerOrchestrator;

	public _manager: AppManager;

	constructor(orch: AppServerOrchestrator, manager: AppManager) {
		this._orch = orch;
		this._manager = manager;
		void this.loadAPI();
	}

	async loadAPI() {
		this.api = new API.ApiClass({
			version: 'apps',
			useDefaultAuth: true,
			prettyJson: false,
			enableCors: false,
			auth: API.getUserAuth(),
		});
		this.addManagementRoutes();
	}

	addManagementRoutes() {
		const orchestrator = this._orch;
		const manager = this._manager;

		const handleError = (message: string, e: any) => {
			// when there is no `response` field in the error, it means the request
			// couldn't even make it to the server
			if (!e.hasOwnProperty('response')) {
				orchestrator.getRocketChatLogger().warn(message, e.message);
				return API.v1.internalError('Could not reach the Marketplace');
			}

			orchestrator.getRocketChatLogger().error(message, e.response.data);

			if (e.response.statusCode >= 500 && e.response.statusCode <= 599) {
				return API.v1.internalError();
			}

			if (e.response.statusCode === 404) {
				return API.v1.notFound();
			}

			return API.v1.failure();
		};

		this.api.addRoute('actionButtons', ...actionButtonsHandler(this));
		this.api.addRoute('count', ...appsCountHandler(this));

		this.api.addRoute(
			'incompatibleModal',
			{ authRequired: true },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();
					const workspaceId = settings.get('Cloud_Workspace_Id');
					const { action, appId, appVersion } = this.queryParams;

					return API.v1.success({
						url: `${baseUrl}/apps/${appId}/incompatible/${appVersion}/${action}?workspaceId=${workspaceId}&rocketChatVersion=${rocketChatVersion}`,
					});
				},
			},
		);

		this.api.addRoute(
			'marketplace',
			{ authRequired: true },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();

					// Gets the Apps from the marketplace
					const headers = getDefaultHeaders();
					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					let result;
					try {
						const request = await fetch(`${baseUrl}/v1/apps`, {
							headers,
							params: {
								...(this.queryParams.isAdminUser === 'false' && { endUserID: this.user._id }),
							},
						});
						if (request.status !== 200) {
							orchestrator.getRocketChatLogger().error('Error getting the Apps:', await request.json());
							return API.v1.failure();
						}
						result = await request.json();

						if (!request.ok) {
							throw new Error(result.error);
						}
					} catch (e) {
						return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
					}

					return API.v1.success(result);
				},
			},
		);

		this.api.addRoute(
			'categories',
			{ authRequired: true },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();
					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					let result;
					try {
						const request = await fetch(`${baseUrl}/v1/categories`, { headers });
						if (request.status !== 200) {
							orchestrator.getRocketChatLogger().error('Error getting the Apps:', await request.json());
							return API.v1.failure();
						}
						result = await request.json();
					} catch (e: any) {
						orchestrator.getRocketChatLogger().error('Error getting the categories from the Marketplace:', e.response.data);
						return API.v1.internalError();
					}

					return API.v1.success(result);
				},
			},
		);

		this.api.addRoute(
			'buildExternalUrl',
			{ authRequired: true },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const workspaceId = settings.get('Cloud_Workspace_Id');

					if (!this.queryParams.purchaseType || !purchaseTypes.has(this.queryParams.purchaseType)) {
						return API.v1.failure({ error: 'Invalid purchase type' });
					}

					const response = await getWorkspaceAccessTokenWithScope('marketplace:purchase');
					if (!response.token) {
						return API.v1.failure({ error: 'Unauthorized' });
					}

					const subscribeRoute = this.queryParams.details === 'true' ? 'subscribe/details' : 'subscribe';

					const seats = await Users.getActiveLocalUserCount();

					return API.v1.success({
						url: `${baseUrl}/apps/${this.queryParams.appId}/${
							this.queryParams.purchaseType === 'buy' ? this.queryParams.purchaseType : subscribeRoute
						}?workspaceId=${workspaceId}&token=${response.token}&seats=${seats}`,
					});
				},
			},
		);

		this.api.addRoute(
			'installed',
			{ authRequired: true },
			{
				async get() {
					const apps = manager.get().map(formatAppInstanceForRest);
					return API.v1.success({ apps });
				},
			},
		);

		// WE NEED TO MOVE EACH ENDPOINT HANDLER TO IT'S OWN FILE
		this.api.addRoute(
			'',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();

					// Gets the Apps from the marketplace
					if ('marketplace' in this.queryParams && this.queryParams.marketplace) {
						apiDeprecationLogger.endpoint(this.request.route, '7.0.0', this.response, 'Use /apps/marketplace to get the apps list.');

						const headers = getDefaultHeaders();
						const token = await getWorkspaceAccessToken();
						if (token) {
							headers.Authorization = `Bearer ${token}`;
						}

						let result;
						try {
							const request = await fetch(`${baseUrl}/v1/apps`, { headers });
							if (request.status !== 200) {
								orchestrator.getRocketChatLogger().error('Error getting the Apps:', await request.json());
								return API.v1.failure();
							}
							result = await request.json();
						} catch (e) {
							return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
						}

						return API.v1.success(result);
					}

					if ('categories' in this.queryParams && this.queryParams.categories) {
						apiDeprecationLogger.endpoint(this.request.route, '7.0.0', this.response, 'Use /apps/categories to get the categories list.');
						const headers = getDefaultHeaders();
						const token = await getWorkspaceAccessToken();
						if (token) {
							headers.Authorization = `Bearer ${token}`;
						}

						let result;
						try {
							const request = await fetch(`${baseUrl}/v1/categories`, { headers });
							if (request.status !== 200) {
								orchestrator.getRocketChatLogger().error('Error getting the Apps:', await request.json());
								return API.v1.failure();
							}
							result = await request.json();
						} catch (e: any) {
							orchestrator.getRocketChatLogger().error('Error getting the categories from the Marketplace:', e);
							return API.v1.internalError();
						}

						return API.v1.success(result);
					}

					if (
						'buildExternalUrl' in this.queryParams &&
						'appId' in this.queryParams &&
						this.queryParams.buildExternalUrl &&
						this.queryParams.appId
					) {
						apiDeprecationLogger.endpoint(this.request.route, '7.0.0', this.response, 'Use /apps/buildExternalUrl to get the modal URLs.');
						const workspaceId = settings.get('Cloud_Workspace_Id');

						if (!this.queryParams.purchaseType || !purchaseTypes.has(this.queryParams.purchaseType)) {
							return API.v1.failure({ error: 'Invalid purchase type' });
						}

						const token = await getWorkspaceAccessTokenWithScope('marketplace:purchase');
						if (!token) {
							return API.v1.failure({ error: 'Unauthorized' });
						}

						const subscribeRoute = this.queryParams.details === 'true' ? 'subscribe/details' : 'subscribe';

						const seats = await Users.getActiveLocalUserCount();

						return API.v1.success({
							url: `${baseUrl}/apps/${this.queryParams.appId}/${
								this.queryParams.purchaseType === 'buy' ? this.queryParams.purchaseType : subscribeRoute
							}?workspaceId=${workspaceId}&token=${token.token}&seats=${seats}`,
						});
					}
					apiDeprecationLogger.endpoint(this.request.route, '7.0.0', this.response, 'Use /apps/installed to get the installed apps list.');

					const apps = manager.get().map(formatAppInstanceForRest);

					return API.v1.success({ apps });
				},
				async post() {
					let buff;
					let marketplaceInfo;
					let permissionsGranted;

					if (this.bodyParams.url) {
						try {
							const response = await fetch(this.bodyParams.url);

							if (response.status !== 200 || response.headers.get('content-type') !== 'application/zip') {
								return API.v1.failure({
									error: 'Invalid url. It doesn\'t exist or is not "application/zip".',
								});
							}

							buff = Buffer.from(await response.arrayBuffer());
						} catch (e: any) {
							orchestrator.getRocketChatLogger().error('Error getting the app from url:', e.response.data);
							return API.v1.internalError();
						}

						if (this.bodyParams.downloadOnly) {
							return API.v1.success({ buff });
						}
					} else if (this.bodyParams.appId && this.bodyParams.marketplace && this.bodyParams.version) {
						const baseUrl = orchestrator.getMarketplaceUrl();

						const headers = getDefaultHeaders();
						try {
							const downloadToken = await getWorkspaceAccessToken(true, 'marketplace:download', false);
							const marketplaceToken = await getWorkspaceAccessToken();

							const [downloadResponse, marketplaceResponse] = await Promise.all([
								fetch(`${baseUrl}/v2/apps/${this.bodyParams.appId}/download/${this.bodyParams.version}?token=${downloadToken}`, {
									headers,
								}),
								fetch(`${baseUrl}/v1/apps/${this.bodyParams.appId}?appVersion=${this.bodyParams.version}`, {
									headers: {
										Authorization: `Bearer ${marketplaceToken}`,
										...headers,
									},
								}),
							]);

							if (downloadResponse.headers.get('content-type') !== 'application/zip') {
								throw new Error('Invalid url. It doesn\'t exist or is not "application/zip".');
							}

							buff = Buffer.from(await downloadResponse.arrayBuffer());
							marketplaceInfo = (await marketplaceResponse.json()) as any;
							permissionsGranted = this.bodyParams.permissionsGranted;
						} catch (err: any) {
							return API.v1.failure(err.message);
						}
					} else {
						const app = await getUploadFormData(
							{
								request: this.request,
							},
							{ field: 'app', sizeLimit: settings.get('FileUpload_MaxFileSize') },
						);

						const { fields: formData } = app;

						buff = app.fileBuffer;
						permissionsGranted = (() => {
							try {
								const permissions = JSON.parse(formData?.permissions || '');
								return permissions.length ? permissions : undefined;
							} catch {
								return undefined;
							}
						})();
					}

					if (!buff) {
						return API.v1.failure({ error: 'Failed to get a file to install for the App. ' });
					}

					const user = orchestrator
						?.getConverters()
						?.get('users')
						?.convertToApp(await Meteor.userAsync());

					const aff = await manager.add(buff, { marketplaceInfo, permissionsGranted, enable: false, user });
					const info: IAppInfo & { status?: AppStatus } = aff.getAppInfo();

					if (aff.hasStorageError()) {
						return API.v1.failure({ status: 'storage_error', messages: [aff.getStorageError()] });
					}

					if (aff.hasAppUserError()) {
						return API.v1.failure({
							status: 'app_user_error',
							messages: [(aff.getAppUserError() as Record<string, any>).message],
							payload: { username: (aff.getAppUserError() as Record<string, any>).username },
						});
					}

					info.status = aff.getApp().getStatus();

					void notifyAppInstall(orchestrator.getMarketplaceUrl() as string, 'install', info);

					if (await canEnableApp(aff.getApp().getStorageItem())) {
						const success = await manager.enable(info.id);
						info.status = success ? AppStatus.AUTO_ENABLED : info.status;
					}

					void orchestrator.getNotifier().appAdded(info.id);

					return API.v1.success({
						app: info,
						implemented: aff.getImplementedInferfaces(),
						licenseValidation: aff.getLicenseValidationResult(),
					});
				},
			},
		);

		this.api.addRoute(
			'buildExternalAppRequest',
			{ authRequired: true },
			{
				async get() {
					if (!this.queryParams.appId) {
						return API.v1.failure({ error: 'Invalid request. Please ensure an appId is attached to the request.' });
					}

					const baseUrl = orchestrator.getMarketplaceUrl();
					const workspaceId = settings.get<string>('Cloud_Workspace_Id');

					const requester = {
						id: this.user._id,
						username: this.user.username,
						name: this.user.name,
						nickname: this.user.nickname,
						emails: this.user?.emails?.map((e) => e.address),
					};

					let admins: {
						id: string;
						username?: string;
						name?: string;
						nickname?: string;
					}[] = [];
					try {
						const adminsRaw = await Users.findUsersInRoles(['admin'], undefined, {
							projection: {
								username: 1,
								name: 1,
								nickname: 1,
							},
						}).toArray();

						admins = adminsRaw.map((a) => {
							return {
								id: a._id,
								username: a.username,
								name: a.name,
								nickname: a.nickname,
							};
						});
					} catch (e) {
						orchestrator.getRocketChatLogger().error('Error getting the admins to request an app be installed:', e);
					}

					const queryParams = new URLSearchParams();
					queryParams.set('workspaceId', workspaceId);
					queryParams.set('frameworkVersion', appsEngineVersionForMarketplace);
					queryParams.set('requester', Buffer.from(JSON.stringify(requester)).toString('base64'));
					queryParams.set('admins', Buffer.from(JSON.stringify(admins)).toString('base64'));

					return API.v1.success({
						url: `${baseUrl}/apps/${this.queryParams.appId}/requestAccess?${queryParams.toString()}`,
					});
				},
			},
		);

		this.api.addRoute(
			'externalComponents',
			{ authRequired: false },
			{
				get() {
					const externalComponents = orchestrator.getProvidedComponents();

					return API.v1.success({ externalComponents });
				},
			},
		);

		this.api.addRoute(
			'languages',
			{ authRequired: false },
			{
				get() {
					const apps = manager.get().map((prl) => ({
						id: prl.getID(),
						languages: prl.getStorageItem().languageContent,
					}));

					return API.v1.success({ apps });
				},
			},
		);

		this.api.addRoute(
			'externalComponentEvent',
			{ authRequired: true },
			{
				post() {
					if (
						!this.bodyParams.externalComponent ||
						!this.bodyParams.event ||
						!['IPostExternalComponentOpened', 'IPostExternalComponentClosed'].includes(this.bodyParams.event)
					) {
						return API.v1.failure({ error: 'Event and externalComponent must be provided.' });
					}

					try {
						const { event, externalComponent } = this.bodyParams;
						const result = (Apps?.getBridges()?.getListenerBridge() as Record<string, any>).externalComponentEvent(
							event,
							externalComponent,
						);

						return API.v1.success({ result });
					} catch (e: any) {
						orchestrator.getRocketChatLogger().error(`Error triggering external components' events ${e.response.data}`);
						return API.v1.internalError();
					}
				},
			},
		);

		this.api.addRoute(
			'bundles/:id/apps',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers: Record<string, any> = {};
					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					let result;
					try {
						const request = await fetch(`${baseUrl}/v1/bundles/${this.urlParams.id}/apps`, { headers });
						if (request.status !== 200) {
							orchestrator.getRocketChatLogger().error("Error getting the Bundle's Apps from the Marketplace:", await request.json());
							return API.v1.failure();
						}
						result = await request.json();
					} catch (e: any) {
						orchestrator.getRocketChatLogger().error("Error getting the Bundle's Apps from the Marketplace:", e.response.data);
						return API.v1.internalError();
					}

					return API.v1.success({ apps: result });
				},
			},
		);

		this.api.addRoute(
			'featured-apps',
			{ authRequired: true },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();
					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					let result;
					try {
						const request = await fetch(`${baseUrl}/v1/featured-apps`, { headers });
						if (request.status !== 200) {
							orchestrator.getRocketChatLogger().error('Error getting the Featured Apps from the Marketplace:', await request.json());
							return API.v1.failure();
						}
						result = await request.json();
					} catch (e) {
						return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
					}

					return API.v1.success(result);
				},
			},
		);

		this.api.addRoute(
			':id',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				async get() {
					if (this.queryParams.marketplace && this.queryParams.version) {
						const baseUrl = orchestrator.getMarketplaceUrl();

						const headers: Record<string, any> = {}; // DO NOT ATTACH THE FRAMEWORK/ENGINE VERSION HERE.
						const token = await getWorkspaceAccessToken();
						if (token) {
							headers.Authorization = `Bearer ${token}`;
						}

						let result: any;
						try {
							const request = await fetch(`${baseUrl}/v1/apps/${this.urlParams.id}?appVersion=${this.queryParams.version}`, { headers });
							if (request.status !== 200) {
								orchestrator.getRocketChatLogger().error('Error getting the App information from the Marketplace:', await request.json());
								return API.v1.failure();
							}
							result = await request.json();
						} catch (e) {
							return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
						}

						return API.v1.success({ app: result[0] });
					}

					if (this.queryParams.marketplace && this.queryParams.update && this.queryParams.appVersion) {
						const baseUrl = orchestrator.getMarketplaceUrl();

						const headers = getDefaultHeaders();
						const token = await getWorkspaceAccessToken();
						if (token) {
							headers.Authorization = `Bearer ${token}`;
						}

						let result;
						try {
							const request = await fetch(`${baseUrl}/v1/apps/${this.urlParams.id}/latest?appVersion=${this.queryParams.appVersion}`, {
								headers,
							});
							if (request.status !== 200) {
								orchestrator.getRocketChatLogger().error('Error getting the App update info from the Marketplace:', await request.json());
								return API.v1.failure();
							}
							result = await request.json();
						} catch (e) {
							return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
						}

						return API.v1.success({ app: result });
					}
					const app = manager.getOneById(this.urlParams.id);
					if (!app) {
						return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
					}

					return API.v1.success({
						app: formatAppInstanceForRest(app),
					});
				},
				async post() {
					let buff;
					let permissionsGranted;

					if (this.bodyParams.url) {
						const response = await fetch(this.bodyParams.url);

						if (response.status !== 200 || response.headers.get('content-type') !== 'application/zip') {
							return API.v1.failure({
								error: 'Invalid url. It doesn\'t exist or is not "application/zip".',
							});
						}

						buff = Buffer.from(await response.arrayBuffer());
					} else if (this.bodyParams.appId && this.bodyParams.marketplace && this.bodyParams.version) {
						const baseUrl = orchestrator.getMarketplaceUrl();

						const headers = getDefaultHeaders();
						const token = await getWorkspaceAccessToken(true, 'marketplace:download', false);

						try {
							const response = await fetch(
								`${baseUrl}/v2/apps/${this.bodyParams.appId}/download/${this.bodyParams.version}?token=${token}`,
								{
									headers,
								},
							);

							if (response.status !== 200) {
								orchestrator.getRocketChatLogger().error('Error getting the App from the Marketplace:', await response.text());
								return API.v1.failure();
							}

							if (response.headers.get('content-type') !== 'application/zip') {
								return API.v1.failure({
									error: 'Invalid url. It doesn\'t exist or is not "application/zip".',
								});
							}

							buff = Buffer.from(await response.arrayBuffer());
						} catch (e: any) {
							orchestrator.getRocketChatLogger().error('Error getting the App from the Marketplace:', e.response.data);
							return API.v1.internalError();
						}
					} else {
						const app = await getUploadFormData(
							{
								request: this.request,
							},
							{ field: 'app', sizeLimit: settings.get('FileUpload_MaxFileSize') },
						);

						const { fields: formData } = app;

						buff = app.fileBuffer;
						permissionsGranted = (() => {
							try {
								const permissions = JSON.parse(formData?.permissions || '');
								return permissions.length ? permissions : undefined;
							} catch {
								return undefined;
							}
						})();
					}

					if (!buff) {
						return API.v1.failure({ error: 'Failed to get a file to install for the App. ' });
					}

					const aff = await manager.update(buff, permissionsGranted);
					const info: IAppInfo & { status?: AppStatus } = aff.getAppInfo();

					if (aff.hasStorageError()) {
						return API.v1.failure({ status: 'storage_error', messages: [aff.getStorageError()] });
					}

					if (aff.hasAppUserError()) {
						return API.v1.failure({
							status: 'app_user_error',
							messages: [(aff.getAppUserError() as Record<string, any>).message],
							payload: { username: (aff.getAppUserError() as Record<string, any>).username },
						});
					}

					info.status = aff.getApp().getStatus();

					void notifyAppInstall(orchestrator.getMarketplaceUrl() as string, 'update', info);

					void orchestrator.getNotifier().appUpdated(info.id);

					return API.v1.success({
						app: info,
						implemented: aff.getImplementedInferfaces(),
						licenseValidation: aff.getLicenseValidationResult(),
					});
				},
				async delete() {
					const prl = manager.getOneById(this.urlParams.id);

					if (!prl) {
						return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
					}

					const user = orchestrator
						?.getConverters()
						?.get('users')
						.convertToApp(await Meteor.userAsync());

					await manager.remove(prl.getID(), { user });

					const info: IAppInfo & { status?: AppStatus } = prl.getInfo();
					info.status = prl.getStatus();

					void notifyAppInstall(orchestrator.getMarketplaceUrl() as string, 'uninstall', info);

					return API.v1.success({ app: info });
				},
			},
		);

		this.api.addRoute(
			':id/versions',
			{ authRequired: true },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers: Record<string, any> = {}; // DO NOT ATTACH THE FRAMEWORK/ENGINE VERSION HERE.
					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					let result;
					let statusCode;
					try {
						const request = await fetch(`${baseUrl}/v1/apps/${this.urlParams.id}`, { headers });
						statusCode = request.status;
						result = await request.json();

						if (!request.ok) {
							throw new Error(result.error);
						}
					} catch (e) {
						return handleError('Unable to access Marketplace. Does the server has access to the internet?', e);
					}

					if (!result || statusCode !== 200) {
						orchestrator.getRocketChatLogger().error('Error getting the App versions from the Marketplace:', result);
						return API.v1.failure();
					}

					return API.v1.success({ apps: result });
				},
			},
		);

		this.api.addRoute(
			'notify-admins',
			{ authRequired: true },
			{
				async post() {
					const { appId, appName, appVersion, message } = this.bodyParams;
					const workspaceUrl = settings.get<string>('Site_Url');

					const regex = new RegExp('\\/$', 'gm');
					const safeWorkspaceUrl = workspaceUrl.replace(regex, '');
					const learnMore = `${safeWorkspaceUrl}/marketplace/explore/info/${appId}/${appVersion}/requests`;

					try {
						const msgs: (params: { adminUser: IUser }) => Promise<Partial<IMessage>> = async ({ adminUser }) => {
							return {
								msg: i18n.t('App_Request_Admin_Message', {
									admin_name: adminUser.name || '',
									app_name: appName || '',
									user_name: `@${this.user.username}`,
									message: message || '',
									learn_more: learnMore,
								}),
							};
						};

						await sendMessagesToAdmins({ msgs });

						return API.v1.success();
					} catch (e) {
						orchestrator.getRocketChatLogger().error('Error when notifying admins that an user requested an app:', e);
						return API.v1.failure();
					}
				},
			},
		);

		this.api.addRoute(
			':id/sync',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				async post() {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();
					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					const workspaceIdSetting = await Settings.findOneById('Cloud_Workspace_Id');
					if (!workspaceIdSetting) {
						return API.v1.failure('No workspace id found');
					}

					let result;
					let statusCode;
					try {
						const request = await fetch(`${baseUrl}/v1/workspaces/${workspaceIdSetting.value}/apps/${this.urlParams.id}`, { headers });
						statusCode = request.status;
						result = await request.json();

						if (!request.ok) {
							throw new Error(result.error);
						}
					} catch (e: any) {
						orchestrator.getRocketChatLogger().error('Error syncing the App from the Marketplace:', e);
						return API.v1.internalError();
					}

					if (statusCode !== 200) {
						orchestrator.getRocketChatLogger().error('Error syncing the App from the Marketplace:', result);
						return API.v1.failure();
					}

					await Apps.updateAppsMarketplaceInfo([result]);

					return API.v1.success({ app: result });
				},
			},
		);

		this.api.addRoute(
			':id/icon',
			{ authRequired: false },
			{
				get() {
					const prl = manager.getOneById(this.urlParams.id);
					if (!prl) {
						return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
					}

					const info = prl.getInfo();
					if (!info?.iconFileContent) {
						return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
					}

					const imageData = info.iconFileContent.split(';base64,');

					const buf = Buffer.from(imageData[1], 'base64');

					return {
						statusCode: 200,
						headers: {
							'Content-Length': buf.length,
							'Content-Type': imageData[0].replace('data:', ''),
						},
						body: buf,
					};
				},
			},
		);

		this.api.addRoute(
			':id/screenshots',
			{ authRequired: false },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();
					const appId = this.urlParams.id;
					const headers = getDefaultHeaders();

					try {
						const request = await fetch(`${baseUrl}/v1/apps/${appId}/screenshots`, { headers });
						const data = await request.json();

						return API.v1.success({
							screenshots: data,
						});
					} catch (e: any) {
						orchestrator.getRocketChatLogger().error('Error getting the screenshots from the Marketplace:', e.message);
						return API.v1.failure(e.message);
					}
				},
			},
		);

		this.api.addRoute(
			':id/languages',
			{ authRequired: false },
			{
				get() {
					const prl = manager.getOneById(this.urlParams.id);

					if (prl) {
						const languages = prl.getStorageItem().languageContent || {};

						return API.v1.success({ languages });
					}
					return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
				},
			},
		);

		this.api.addRoute(
			':id/logs',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				async get() {
					const prl = manager.getOneById(this.urlParams.id);

					if (prl) {
						const { offset, count } = await getPaginationItems(this.queryParams);
						const { sort, fields, query } = await this.parseJsonQuery();

						const ourQuery = Object.assign({}, query, { appId: prl.getID() });
						const options = {
							sort: sort || { _updatedAt: -1 },
							skip: offset,
							limit: count,
							fields,
						};

						const logs = await orchestrator?.getLogStorage()?.find(ourQuery, options);

						return API.v1.success({ logs });
					}
					return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
				},
			},
		);

		this.api.addRoute(
			':id/settings',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				get() {
					const prl = manager.getOneById(this.urlParams.id);

					if (prl) {
						const settings = Object.assign({}, prl.getStorageItem().settings);

						Object.keys(settings).forEach((k) => {
							if (settings[k].hidden) {
								delete settings[k];
							}
						});

						return API.v1.success({ settings });
					}
					return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
				},
				async post() {
					if (!this.bodyParams?.settings) {
						return API.v1.failure('The settings to update must be present.');
					}

					const prl = manager.getOneById(this.urlParams.id);

					if (!prl) {
						return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
					}

					const { settings } = prl.getStorageItem();

					const updated = [];

					for await (const s of this.bodyParams.settings) {
						if (settings[s.id] && settings[s.id].value !== s.value) {
							await manager.getSettingsManager().updateAppSetting(this.urlParams.id, s);
							// Updating?
							updated.push(s);
						}
					}

					return API.v1.success({ updated });
				},
			},
		);

		this.api.addRoute(
			':id/settings/:settingId',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				get() {
					try {
						const setting = manager.getSettingsManager().getAppSetting(this.urlParams.id, this.urlParams.settingId);

						return API.v1.success({ setting });
					} catch (e: any) {
						if (e.message.includes('No setting found')) {
							return API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
						}
						if (e.message.includes('No App found')) {
							return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
						}
						return API.v1.failure(e.message);
					}
				},
				async post() {
					if (!this.bodyParams.setting) {
						return API.v1.failure('Setting to update to must be present on the posted body.');
					}

					try {
						await manager.getSettingsManager().updateAppSetting(this.urlParams.id, this.bodyParams.setting);

						return API.v1.success();
					} catch (e: any) {
						if (e.message.includes('No setting found')) {
							return API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
						}
						if (e.message.includes('No App found')) {
							return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
						}
						return API.v1.failure(e.message);
					}
				},
			},
		);

		this.api.addRoute(
			':id/apis',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				get() {
					const prl = manager.getOneById(this.urlParams.id);

					if (prl) {
						return API.v1.success({
							apis: (manager as Record<string, any>).apiManager.listApis(this.urlParams.id), // TODO: this is accessing a private property from the manager, we should expose a method to get the list of APIs
						});
					}
					return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
				},
			},
		);

		this.api.addRoute(
			':id/status',
			{ authRequired: true, permissionsRequired: ['manage-apps'] },
			{
				get() {
					const prl = manager.getOneById(this.urlParams.id);

					if (prl) {
						return API.v1.success({ status: prl.getStatus() });
					}
					return API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
				},
				async post() {
					const { id: appId } = this.urlParams;
					const { status } = this.bodyParams;

					if (!status || typeof status !== 'string') {
						return API.v1.failure('Invalid status provided, it must be "status" field and a string.');
					}

					const prl = manager.getOneById(appId);
					if (!prl) {
						return API.v1.notFound(`No App found by the id of: ${appId}`);
					}

					const storedApp = prl.getStorageItem();
					const { installationSource, marketplaceInfo } = storedApp;

					if (!isEnterprise() && installationSource === AppInstallationSource.MARKETPLACE) {
						try {
							const baseUrl = orchestrator.getMarketplaceUrl() as string;
							const headers = getDefaultHeaders();
							const { version } = prl.getInfo();

							await appEnableCheck({
								baseUrl,
								headers,
								appId,
								version,
								marketplaceInfo,
								status,
								logger: orchestrator.getRocketChatLogger(),
							});
						} catch (error: any) {
							return API.v1.failure(error.message);
						}
					}

					if (AppStatusUtils.isEnabled(status) && !(await canEnableApp(storedApp))) {
						return API.v1.failure('Enabled apps have been maxed out');
					}

					const result = await manager.changeStatus(prl.getID(), status);
					return API.v1.success({ status: result.getStatus() });
				},
			},
		);

		this.api.addRoute(
			'app-request',
			{ authRequired: true },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();
					const { appId, q = '', sort = '', limit = 25, offset = 0 } = this.queryParams;
					const headers = getDefaultHeaders();

					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					try {
						const request = await fetch(`${baseUrl}/v1/app-request?appId=${appId}&q=${q}&sort=${sort}&limit=${limit}&offset=${offset}`, {
							headers,
						});
						const result = await request.json();

						if (!request.ok) {
							throw new Error(result.error);
						}
						return API.v1.success(result);
					} catch (e: any) {
						orchestrator.getRocketChatLogger().error('Error getting all non sent app requests from the Marketplace:', e.message);

						return API.v1.failure(e.message);
					}
				},
			},
		);

		this.api.addRoute(
			'app-request/stats',
			{ authRequired: true },
			{
				async get() {
					const baseUrl = orchestrator.getMarketplaceUrl();
					const headers = getDefaultHeaders();

					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					try {
						const request = await fetch(`${baseUrl}/v1/app-request/stats`, { headers });
						const result = await request.json();
						if (!request.ok) {
							throw new Error(result.error);
						}
						return API.v1.success(result);
					} catch (e: any) {
						orchestrator.getRocketChatLogger().error('Error getting the app requests stats from marketplace', e.message);

						return API.v1.failure(e.message);
					}
				},
			},
		);

		this.api.addRoute(
			'app-request/markAsSeen',
			{ authRequired: true },
			{
				async post() {
					const baseUrl = orchestrator.getMarketplaceUrl();
					const headers = getDefaultHeaders();

					const token = await getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					const { unseenRequests } = this.bodyParams;

					try {
						const request = await fetch(`${baseUrl}/v1/app-request/markAsSeen`, {
							method: 'POST',
							headers,
							body: { ids: unseenRequests },
						});
						const result = await request.json();

						if (!request.ok) {
							throw new Error(result.error);
						}

						return API.v1.success(result);
					} catch (e: any) {
						orchestrator.getRocketChatLogger().error('Error marking app requests as seen', e.message);

						return API.v1.failure(e.message);
					}
				},
			},
		);
	}
}
