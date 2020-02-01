import https from 'https';
import http from 'http';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import {
	Base,
	ProgressStep,
	Selection,
} from '../../importer/server';
import { Messages } from '../../models';
import { FileUpload } from '../../file-upload';

export class SlackImageImporter extends Base {
	constructor(info, importRecord) {
		super(info, importRecord);
		this.userTags = [];
		this.bots = {};
	}

	prepareImageCount() {
		this.logger.debug('start preparing import operation');
		super.updateProgress(ProgressStep.PREPARING_STARTED);

		const messages = Messages.findAllSlackImportedMessagesWithFilesToDownload();
		const imageCount = messages && messages.count();

		if (imageCount > 0) {
			this.updateRecord({ 'count.messages': imageCount, messagesstatus: null });
			this.addCountToTotal(imageCount);

			const selectionMessages = this.importRecord.count.messages;
			super.updateProgress(ProgressStep.USER_SELECTION);

			const fileData = new Selection(this.name, [], [], selectionMessages);
			this.updateRecord({ fileData });

			super.updateProgress(ProgressStep.IMPORTING_IMAGES);
			Meteor.defer(() => {
				this.startImport(fileData);
			});
		}

		return imageCount;
	}

	startImport() {
		const slackFileMessageList = Messages.findAllSlackImportedMessagesWithFilesToDownload();
		const imageCount = slackFileMessageList && slackFileMessageList.count();

		if (!imageCount) {
			super.updateProgress(ProgressStep.ERROR);
			throw new Meteor.Error('error-no-images-found', 'Slack Image Importer: No pending images found.', { step: 'startImport' });
		}

		const downloadedFileIds = [];

		slackFileMessageList.forEach((message) => {
			try {
				const { slackFile } = message;
				if (!slackFile || slackFile.rocketChatUrl || downloadedFileIds.includes(slackFile.id)) {
					this.addCountCompleted(1);
					return;
				}

				const url = slackFile.url_private_download;
				if (!url || !url.startsWith('http')) {
					this.addCountCompleted(1);
					return;
				}

				const details = {
					message_id: `${ message._id }-file-${ slackFile.id }`,
					name: slackFile.name || Random.id(),
					size: slackFile.size || 0,
					userId: message.u._id,
					rid: message.rid,
				};

				const requestModule = /https/i.test(url) ? https : http;
				const fileStore = FileUpload.getStore('Uploads');
				const addCountCompleted = this.addCountCompleted.bind(this);

				Meteor.wrapAsync((callback) => {
					requestModule.get(url, Meteor.bindEnvironment(function(res) {
						const contentType = res.headers['content-type'];
						if (!details.type && contentType) {
							details.type = contentType;
						}

						const rawData = [];
						res.on('data', (chunk) => rawData.push(chunk));
						res.on('error', (error) => {
							addCountCompleted(1);
							return callback(error);
						});

						res.on('end', Meteor.bindEnvironment(() => {
							fileStore.insert(details, Buffer.concat(rawData), function(error, file) {
								if (error) {
									addCountCompleted(1);
									return callback(error);
								}

								const url = FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`);
								const attachment = {
									title: file.name,
									title_link: url,
								};

								if (/^image\/.+/.test(file.type)) {
									attachment.image_url = url;
									attachment.image_type = file.type;
									attachment.image_size = file.size;
									attachment.image_dimensions = file.identify != null ? file.identify.size : undefined;
								}

								if (/^audio\/.+/.test(file.type)) {
									attachment.audio_url = url;
									attachment.audio_type = file.type;
									attachment.audio_size = file.size;
								}

								if (/^video\/.+/.test(file.type)) {
									attachment.video_url = url;
									attachment.video_type = file.type;
									attachment.video_size = file.size;
								}

								Messages.setSlackFileRocketChatAttachment(slackFile.id, url, attachment);
								downloadedFileIds.push(slackFile.id);
								addCountCompleted(1);
								return callback();
							});
						}));
					}));
				})();
			} catch (error) {
				this.logger.error(error);
			}
		});

		super.updateProgress(ProgressStep.DONE);
		return this.getProgress();
	}
}
