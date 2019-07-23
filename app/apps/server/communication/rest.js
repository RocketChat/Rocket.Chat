import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import Busboy from 'busboy';

import { API } from '../../../api/server';
import { getWorkspaceAccessToken, getUserCloudAccessToken } from '../../../cloud/server';
import { settings } from '../../../settings';
import { Info } from '../../../utils';

const getDefaultHeaders = () => ({
	'X-Apps-Engine-Version': Info.marketplaceApiVersion,
});

const purchaseTypes = new Set(['buy', 'subscription']);

export class AppsRestApi {
	constructor(orch, manager) {
		this._orch = orch;
		this._manager = manager;
		this.loadAPI();
	}

	_handleFile(request, fileField) {
		const busboy = new Busboy({ headers: request.headers });

		return Meteor.wrapAsync((callback) => {
			busboy.on('file', Meteor.bindEnvironment((fieldname, file) => {
				if (fieldname !== fileField) {
					return callback(new Meteor.Error('invalid-field', `Expected the field "${ fileField }" but got "${ fieldname }" instead.`));
				}

				const fileData = [];
				file.on('data', Meteor.bindEnvironment((data) => {
					fileData.push(data);
				}));

				file.on('end', Meteor.bindEnvironment(() => callback(undefined, Buffer.concat(fileData))));
			}));

			request.pipe(busboy);
		})();
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
		const fileHandler = this._handleFile;

		this.api.addRoute('', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const baseUrl = orchestrator.getMarketplaceUrl();

				// Gets the Apps from the marketplace
				if (this.queryParams.marketplace) {
					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					const result = HTTP.get(`${ baseUrl }/v1/apps?version=${ Info.marketplaceApiVersion }`, {
						headers,
					});

					if (result.statusCode !== 200) {
						return API.v1.failure();
					}

					return API.v1.success(result.data);
				}

				if (this.queryParams.categories) {
					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					const result = HTTP.get(`${ baseUrl }/v1/categories`, {
						headers,
					});

					if (result.statusCode !== 200) {
						return API.v1.failure();
					}

					return API.v1.success(result.data);
				}

				if (this.queryParams.buildExternalUrl && this.queryParams.appId) {
					const workspaceId = settings.get('Cloud_Workspace_Id');

					if (!this.queryParams.purchaseType || !purchaseTypes.has(this.queryParams.purchaseType)) {
						return API.v1.failure({ error: 'Invalid purchase type' });
					}

					const token = getUserCloudAccessToken(this.getLoggedInUser()._id, true, 'marketplace:purchase', false);
					if (!token) {
						return API.v1.failure({ error: 'Unauthorized' });
					}

					return API.v1.success({
						url: `${ baseUrl }/apps/${ this.queryParams.appId }/${
							this.queryParams.purchaseType === 'buy' ? this.queryParams.purchaseType : 'subscribe'
						}?workspaceId=${ workspaceId }&token=${ token }`,
					});
				}

				const apps = manager.get().map((prl) => {
					const info = prl.getInfo();
					info.languages = prl.getStorageItem().languageContent;
					info.status = prl.getStatus();

					return info;
				});

				return API.v1.success({ apps });
			},
			post() {
				let buff;
				let marketplaceInfo;

				if (this.bodyParams.url) {
					if (settings.get('Apps_Framework_Development_Mode') !== true) {
						return API.v1.failure({ error: 'Installation from url is disabled.' });
					}

					const result = HTTP.call('GET', this.bodyParams.url, { npmRequestOptions: { encoding: null } });

					if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
						return API.v1.failure({ error: 'Invalid url. It doesn\'t exist or is not "application/zip".' });
					}

					buff = result.content;
				} else if (this.bodyParams.appId && this.bodyParams.marketplace && this.bodyParams.version) {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();

					const downloadPromise = new Promise((resolve, reject) => {
						const token = getWorkspaceAccessToken(true, 'marketplace:download', false);

						HTTP.get(`${ baseUrl }/v1/apps/${ this.bodyParams.appId }/download/${ this.bodyParams.version }?token=${ token }`, {
							headers,
							npmRequestOptions: { encoding: null },
						}, (error, result) => {
							if (error) { reject(error); }

							resolve(result);
						});
					});

					const marketplacePromise = new Promise((resolve, reject) => {
						const token = getWorkspaceAccessToken();

						HTTP.get(`${ baseUrl }/v1/apps/${ this.bodyParams.appId }?appVersion=${ this.bodyParams.version }`, {
							headers: {
								Authorization: `Bearer ${ token }`,
								...headers,
							},
						}, (error, result) => {
							if (error) { reject(error); }

							resolve(result);
						});
					});


					try {
						const [downloadResult, marketplaceResult] = Promise.await(Promise.all([downloadPromise, marketplacePromise]));

						if (!downloadResult.headers['content-type'] || downloadResult.headers['content-type'] !== 'application/zip') {
							throw new Error('Invalid url. It doesn\'t exist or is not "application/zip".');
						}

						buff = downloadResult.content;
						marketplaceInfo = marketplaceResult.data[0];
					} catch (err) {
						return API.v1.failure(err.message);
					}
				} else {
					if (settings.get('Apps_Framework_Development_Mode') !== true) {
						return API.v1.failure({ error: 'Direct installation of an App is disabled.' });
					}

					buff = fileHandler(this.request, 'app');
				}

				if (!buff) {
					return API.v1.failure({ error: 'Failed to get a file to install for the App. ' });
				}

				const aff = Promise.await(manager.add(buff.toString('base64'), false, marketplaceInfo));
				const info = aff.getAppInfo();

				if (aff.hasStorageError()) {
					return API.v1.failure({ status: 'storage_error', messages: [aff.getStorageError()] });
				}

				if (aff.getCompilerErrors().length) {
					return API.v1.failure({ status: 'compiler_error', messages: aff.getCompilerErrors() });
				}

				if (aff.getLicenseValidationResult().hasErrors) {
					return API.v1.failure({ status: 'license_error', messages: aff.getLicenseValidationResult().getErrors() });
				}

				info.status = aff.getApp().getStatus();

				return API.v1.success({
					app: info,
					implemented: aff.getImplementedInferfaces(),
					warnings: aff.getLicenseValidationResult().getWarnings(),
				});
			},
		});

		this.api.addRoute('languages', { authRequired: false }, {
			get() {
				const apps = manager.get().map((prl) => ({
					id: prl.getID(),
					languages: prl.getStorageItem().languageContent,
				}));

				return API.v1.success({ apps });
			},
		});

		this.api.addRoute('bundles/:id/apps', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const baseUrl = orchestrator.getMarketplaceUrl();

				const headers = {};
				const token = getWorkspaceAccessToken();
				if (token) {
					headers.Authorization = `Bearer ${ token }`;
				}

				const result = HTTP.get(`${ baseUrl }/v1/bundles/${ this.urlParams.id }/apps`, {
					headers,
				});

				if (result.statusCode !== 200 || result.data.length === 0) {
					return API.v1.failure();
				}

				return API.v1.success({ apps: result.data });
			},
		});

		this.api.addRoute(':id', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				if (this.queryParams.marketplace && this.queryParams.version) {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					const result = HTTP.get(`${ baseUrl }/v1/apps/${ this.urlParams.id }?appVersion=${ this.queryParams.version }`, {
						headers,
					});

					if (result.statusCode !== 200 || result.data.length === 0) {
						return API.v1.failure();
					}

					return API.v1.success({ app: result.data[0] });
				}

				if (this.queryParams.marketplace && this.queryParams.update && this.queryParams.appVersion) {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					const result = HTTP.get(`${ baseUrl }/v1/apps/${ this.urlParams.id }/latest?frameworkVersion=${ Info.marketplaceApiVersion }`, {
						headers,
					});

					if (result.statusCode !== 200 || result.data.length === 0) {
						return API.v1.failure();
					}

					return API.v1.success({ app: result.data });
				}

				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const info = prl.getInfo();
					info.status = prl.getStatus();

					return API.v1.success({ app: info });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
			post() {
				let buff;

				if (this.bodyParams.url) {
					if (settings.get('Apps_Framework_Development_Mode') !== true) {
						return API.v1.failure({ error: 'Updating an App from a url is disabled.' });
					}

					const result = HTTP.call('GET', this.bodyParams.url, { npmRequestOptions: { encoding: 'binary' } });

					if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
						return API.v1.failure({ error: 'Invalid url. It doesn\'t exist or is not "application/zip".' });
					}

					buff = Buffer.from(result.content, 'binary');
				} else if (this.bodyParams.appId && this.bodyParams.marketplace && this.bodyParams.version) {
					const baseUrl = orchestrator.getMarketplaceUrl();

					const headers = getDefaultHeaders();
					const token = getWorkspaceAccessToken();
					if (token) {
						headers.Authorization = `Bearer ${ token }`;
					}

					const result = HTTP.get(`${ baseUrl }/v1/apps/${ this.bodyParams.appId }/download/${ this.bodyParams.version }`, {
						headers,
						npmRequestOptions: { encoding: 'binary' },
					});

					if (result.statusCode !== 200) {
						return API.v1.failure();
					}

					if (!result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
						return API.v1.failure({ error: 'Invalid url. It doesn\'t exist or is not "application/zip".' });
					}

					buff = Buffer.from(result.content, 'binary');
				} else {
					if (settings.get('Apps_Framework_Development_Mode') !== true) {
						return API.v1.failure({ error: 'Direct updating of an App is disabled.' });
					}

					buff = fileHandler(this.request, 'app');
				}

				if (!buff) {
					return API.v1.failure({ error: 'Failed to get a file to install for the App. ' });
				}

				const aff = Promise.await(manager.update(buff.toString('base64')));
				const info = aff.getAppInfo();

				// Should the updated version have compiler errors, no App will be returned
				if (aff.getApp()) {
					info.status = aff.getApp().getStatus();
				} else {
					info.status = 'compiler_error';
				}

				return API.v1.success({
					app: info,
					implemented: aff.getImplementedInferfaces(),
					compilerErrors: aff.getCompilerErrors(),
				});
			},
			delete() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					Promise.await(manager.remove(prl.getID()));

					const info = prl.getInfo();
					info.status = prl.getStatus();

					return API.v1.success({ app: info });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
		});

		this.api.addRoute(':id/icon', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const info = prl.getInfo();

					return API.v1.success({ iconFileContent: info.iconFileContent });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
		});

		this.api.addRoute(':id/languages', { authRequired: false }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const languages = prl.getStorageItem().languageContent || {};

					return API.v1.success({ languages });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
		});

		this.api.addRoute(':id/logs', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const { offset, count } = this.getPaginationItems();
					const { sort, fields, query } = this.parseJsonQuery();

					const ourQuery = Object.assign({}, query, { appId: prl.getID() });
					const options = {
						sort: sort || { _updatedAt: -1 },
						skip: offset,
						limit: count,
						fields,
					};

					const logs = Promise.await(orchestrator.getLogStorage().find(ourQuery, options));

					return API.v1.success({ logs });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
		});

		this.api.addRoute(':id/settings', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
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
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
			post() {
				if (!this.bodyParams || !this.bodyParams.settings) {
					return API.v1.failure('The settings to update must be present.');
				}

				const prl = manager.getOneById(this.urlParams.id);

				if (!prl) {
					return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
				}

				const { settings } = prl.getStorageItem();

				const updated = [];
				this.bodyParams.settings.forEach((s) => {
					if (settings[s.id]) {
						Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, s));
						// Updating?
						updated.push(s);
					}
				});

				return API.v1.success({ updated });
			},
		});

		this.api.addRoute(':id/settings/:settingId', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				try {
					const setting = manager.getSettingsManager().getAppSetting(this.urlParams.id, this.urlParams.settingId);

					API.v1.success({ setting });
				} catch (e) {
					if (e.message.includes('No setting found')) {
						return API.v1.notFound(`No Setting found on the App by the id of: "${ this.urlParams.settingId }"`);
					} if (e.message.includes('No App found')) {
						return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
					}
					return API.v1.failure(e.message);
				}
			},
			post() {
				if (!this.bodyParams.setting) {
					return API.v1.failure('Setting to update to must be present on the posted body.');
				}

				try {
					Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, this.bodyParams.setting));

					return API.v1.success();
				} catch (e) {
					if (e.message.includes('No setting found')) {
						return API.v1.notFound(`No Setting found on the App by the id of: "${ this.urlParams.settingId }"`);
					} if (e.message.includes('No App found')) {
						return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
					}
					return API.v1.failure(e.message);
				}
			},
		});

		this.api.addRoute(':id/apis', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					return API.v1.success({
						apis: manager.apiManager.listApis(this.urlParams.id),
					});
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
		});

		this.api.addRoute(':id/status', { authRequired: true, permissionsRequired: ['manage-apps'] }, {
			get() {
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					return API.v1.success({ status: prl.getStatus() });
				}
				return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
			},
			post() {
				if (!this.bodyParams.status || typeof this.bodyParams.status !== 'string') {
					return API.v1.failure('Invalid status provided, it must be "status" field and a string.');
				}

				const prl = manager.getOneById(this.urlParams.id);

				if (!prl) {
					return API.v1.notFound(`No App found by the id of: ${ this.urlParams.id }`);
				}

				const result = Promise.await(manager.changeStatus(prl.getID(), this.bodyParams.status));

				return API.v1.success({ status: result.getStatus() });
			},
		});
	}
}
