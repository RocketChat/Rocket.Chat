export class RocketletsRestApi {
	constructor(manager) {
		this._manager = manager;
		this.api = new RocketChat.API.ApiClass({
			version: 'rocketlets',
			useDefaultAuth: true,
			prettyJson: false,
			enableCors: false,
			auth: RocketChat.API.getUserAuth()
		});

		this.addManagementRoutes();
	}

	_handleFile(request, fileField) {
		const Busboy = Npm.require('busboy');
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

	addManagementRoutes() {
		const manager = this._manager;
		const fileHandler = this._handleFile;

		this.api.addRoute('', { authRequired: true }, {
			get() {
				const rocketlets = manager.get().map(prl => {
					if (this.queryParams.languagesOnly) {
						return {
							id: prl.getID(),
							languages: prl.getStorageItem().languageContent
						};
					} else {
						const info = prl.getInfo();
						info.languages = prl.getStorageItem().languageContent;
						info.status = prl.getStatus();

						return info;
					}
				});

				return RocketChat.API.v1.success({ rocketlets });
			},
			post() {
				let buff;

				if (this.bodyParams.url) {
					const result = HTTP.call('GET', this.bodyParams.url, { npmRequestOptions: { encoding: 'base64' }});

					if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
						return RocketChat.API.v1.failure({ error: 'Invalid url. It doesn\'t exist or is not "application/zip".' });
					}

					buff = Buffer.from(result.content, 'base64');
				} else {
					buff = fileHandler(this.request, 'rocketlet');
				}

				if (!buff) {
					return RocketChat.API.v1.failure({ error: 'Failed to get a file to install for the Rocketlet. '});
				}

				const item = Meteor.wrapAsync((callback) => {
					manager.add(buff.toString('base64'), false).then((rl) => callback(undefined, rl)).catch((e) => {
						console.warn('Error!', e);
						callback(e);
					});
				})();

				const info = item.getInfo();
				info.status = item.getStatus();

				return RocketChat.API.v1.success({ rocketlet: info });
			}
		});

		this.api.addRoute(':id', { authRequired: true }, {
			get() {
				console.log('Getting:', this.urlParams.id);
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const info = prl.getInfo();
					info.status = prl.getStatus();

					return RocketChat.API.v1.success({ rocketlet: info });
				} else {
					return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
				}
			},
			post() {
				console.log('Updating:', this.urlParams.id);
				// TODO: Verify permissions

				const buff = fileHandler(this.request, 'rocketlet');
				const item = Meteor.wrapAsync((callback) => {
					manager.update(buff.toString('base64')).then((rl) => callback(rl)).catch((e) => callback(e));
				});

				const info = item.getInfo();
				info.status = item.getStatus();

				return RocketChat.API.v1.success({ rocketlet: info });
			}
		});

		this.api.addRoute(':id/icon', { authRequired: true }, {
			get() {
				console.log('Getting the Rocketlet\'s Icon:', this.urlParams.id);
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const info = prl.getInfo();

					return RocketChat.API.v1.success({ iconFileContent: info.iconFileContent });
				} else {
					return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
				}
			}
		});

		this.api.addRoute(':id/languages', { authRequired: true }, {
			get() {
				console.log(`Getting ${ this.urlParams.id }'s languages..`);
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const languages = prl.getStorageItem().languageContent || {};

					return RocketChat.API.v1.success({ languages });
				} else {
					return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
				}
			}
		});

		this.api.addRoute(':id/settings', { authRequired: true }, {
			get() {
				console.log(`Getting ${ this.urlParams.id }'s settings..`);
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const settings = Object.assign({}, prl.getStorageItem().settings);

					Object.keys(settings).forEach((k) => {
						if (settings[k].hidden) {
							delete settings[k];
						}
					});

					return RocketChat.API.v1.success({ settings });
				} else {
					return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
				}
			},
			post() {
				console.log(`Updating ${ this.urlParams.id }'s settings..`);
				if (!this.bodyParams || !this.bodyParams.settings) {
					return RocketChat.API.v1.failure('The settings to update must be present.');
				}

				const prl = manager.getOneById(this.urlParams.id);

				if (!prl) {
					return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
				}

				const settings = prl.getStorageItem().settings;

				const updated = [];
				this.bodyParams.settings.forEach((s) => {
					if (settings[s.id]) {
						Promise.await(manager.getSettingsManager().updateRocketletSetting(this.urlParams.id, s));
						// Updating?
						updated.push(s);
					}
				});

				return RocketChat.API.v1.success({ updated });
			}
		});

		this.api.addRoute(':id/settings/:settingId', { authRequired: true }, {
			get() {
				console.log(`Getting the Rocketlet ${ this.urlParams.id }'s setting ${ this.urlParams.settingId }`);

				try {
					const setting = manager.getSettingsManager().getRocketletSetting(this.urlParams.id, this.urlParams.settingId);

					RocketChat.API.v1.success({ setting });
				} catch (e) {
					if (e.message.includes('No setting found')) {
						return RocketChat.API.v1.notFound(`No Setting found on the Rocketlet by the id of: "${ this.urlParams.settingId }"`);
					} else if (e.message.includes('No Rocketlet found')) {
						return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
					} else {
						return RocketChat.API.v1.failure(e.message);
					}
				}
			},
			post() {
				console.log(`Updating the Rocketlet ${ this.urlParams.id }'s setting ${ this.urlParams.settingId }`);

				if (!this.bodyParams.setting) {
					return RocketChat.API.v1.failure('Setting to update to must be present on the posted body.');
				}

				try {
					Promise.await(manager.getSettingsManager().updateRocketletSetting(this.urlParams.id, this.bodyParams.setting));

					return RocketChat.API.v1.success();
				} catch (e) {
					if (e.message.includes('No setting found')) {
						return RocketChat.API.v1.notFound(`No Setting found on the Rocketlet by the id of: "${ this.urlParams.settingId }"`);
					} else if (e.message.includes('No Rocketlet found')) {
						return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
					} else {
						return RocketChat.API.v1.failure(e.message);
					}
				}
			}
		});

		this.api.addRoute(':id/status', { authRequired: true }, {
			get() {
				console.log(`Getting ${ this.urlParams.id }'s status..`);
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					return RocketChat.API.v1.success({ status: prl.getStatus() });
				} else {
					return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
				}
			},
			post() {
				if (!this.bodyParams.status || typeof this.bodyParams.status !== 'string') {
					return RocketChat.API.v1.failure('Invalid status provided, it must be "status" field and a string.');
				}

				console.log(`Updating ${ this.urlParams.id }'s status...`, this.bodyParams.status);
				const prl = manager.getOneById(this.urlParams.id);

				if (prl) {
					const result = Promise.await(manager.changeStatus(prl.getID(), this.bodyParams.status));

					return RocketChat.API.v1.success({ status: result.getStatus() });
				} else {
					return RocketChat.API.v1.notFound(`No Rocketlet found by the id of: ${ this.urlParams.id }`);
				}
			}
		});
	}
}
