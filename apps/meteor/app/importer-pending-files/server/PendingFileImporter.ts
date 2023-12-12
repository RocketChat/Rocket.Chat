import http from 'http';
import https from 'https';

import type { IImport, MessageAttachment, IUpload } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { FileUpload } from '../../file-upload/server';
import { Importer, ProgressStep, Selection } from '../../importer/server';
import type { IConverterOptions } from '../../importer/server/classes/ImportDataConverter';
import type { ImporterProgress } from '../../importer/server/classes/ImporterProgress';
import type { ImporterInfo } from '../../importer/server/definitions/ImporterInfo';

export class PendingFileImporter extends Importer {
	constructor(info: ImporterInfo, importRecord: IImport, converterOptions: IConverterOptions = {}) {
		super(info, importRecord, converterOptions);
	}

	async prepareFileCount() {
		this.logger.debug('start preparing import operation');
		await super.updateProgress(ProgressStep.PREPARING_STARTED);

		const fileCount = await Messages.countAllImportedMessagesWithFilesToDownload();
		if (fileCount === 0) {
			await super.updateProgress(ProgressStep.DONE);
			return 0;
		}

		await this.updateRecord({ 'count.messages': fileCount, 'messagesstatus': null });
		await this.addCountToTotal(fileCount);

		const fileData = new Selection(this.info.name, [], [], fileCount);
		await this.updateRecord({ fileData });

		await super.updateProgress(ProgressStep.IMPORTING_FILES);
		setImmediate(() => {
			void this.startImport(fileData);
		});

		return fileCount;
	}

	async startImport(importSelection: Selection): Promise<ImporterProgress> {
		const downloadedFileIds: string[] = [];
		const maxFileCount = 10;
		const maxFileSize = 1024 * 1024 * 500;

		let count = 0;
		let currentSize = 0;
		let nextSize = 0;

		const waitForFiles = async () => {
			if (count + 1 < maxFileCount && currentSize + nextSize < maxFileSize) {
				return;
			}

			return new Promise<void>((resolve) => {
				const handler = setInterval(() => {
					if (count + 1 >= maxFileCount) {
						return;
					}

					if (currentSize + nextSize >= maxFileSize && count > 0) {
						return;
					}

					clearInterval(handler);
					resolve();
				}, 1000);
			});
		};

		const completeFile = async (details: { size: number }) => {
			await this.addCountCompleted(1);
			count--;
			currentSize -= details.size;
		};

		const logError = this.logger.error.bind(this.logger);

		try {
			const pendingFileMessageList = Messages.findAllImportedMessagesWithFilesToDownload();
			for await (const message of pendingFileMessageList) {
				try {
					const { _importFile } = message;

					if (!_importFile || _importFile.downloaded || downloadedFileIds.includes(_importFile.id)) {
						await this.addCountCompleted(1);
						continue;
					}

					const url = _importFile.downloadUrl;
					if (!url?.startsWith('http')) {
						await this.addCountCompleted(1);
						continue;
					}

					const details: { message_id: string; name: string; size: number; userId: string; rid: string; type?: string } = {
						message_id: `${message._id}-file-${_importFile.id}`,
						name: _importFile.name || Random.id(),
						size: _importFile.size || 0,
						userId: message.u._id,
						rid: message.rid,
					};

					const requestModule = /https/i.test(url) ? https : http;
					const fileStore = FileUpload.getStore('Uploads');

					nextSize = details.size;
					await waitForFiles();
					count++;
					currentSize += nextSize;
					downloadedFileIds.push(_importFile.id);

					requestModule.get(url, (res) => {
						const contentType = res.headers['content-type'];
						if (!details.type && contentType) {
							details.type = contentType;
						}

						const rawData: Uint8Array[] = [];
						res.on('data', (chunk) => {
							rawData.push(chunk);

							// Update progress more often on large files
							this.reportProgress();
						});
						res.on('error', async (error) => {
							await completeFile(details);
							logError(error);
						});

						res.on('end', async () => {
							try {
								// Bypass the fileStore filters
								const file = await fileStore._doInsert(details, Buffer.concat(rawData));

								const url = FileUpload.getPath(`${file._id}/${encodeURI(file.name || '')}`);
								const attachment = this.getMessageAttachment(file, url);

								await Messages.setImportFileRocketChatAttachment(_importFile.id, url, attachment);
								await completeFile(details);
							} catch (error) {
								await completeFile(details);
								logError(error);
							}
						});
					});
				} catch (error) {
					this.logger.error(error);
				}
			}
		} catch (error) {
			// If the cursor expired, restart the method
			if (this.isCursorNotFoundError(error)) {
				this.logger.info('CursorNotFound');
				return this.startImport(importSelection);
			}

			await super.updateProgress(ProgressStep.ERROR);
			throw error;
		}

		await super.updateProgress(ProgressStep.DONE);
		return this.getProgress();
	}

	getMessageAttachment(file: IUpload, url: string): MessageAttachment {
		if (file.type) {
			if (/^image\/.+/.test(file.type)) {
				return {
					title: file.name,
					title_link: url,
					image_url: url,
					image_type: file.type,
					image_size: file.size,
					image_dimensions: file.identify ? file.identify.size : undefined,
				};
			}

			if (/^audio\/.+/.test(file.type)) {
				return {
					title: file.name,
					title_link: url,
					audio_url: url,
					audio_type: file.type,
					audio_size: file.size,
				};
			}

			if (/^video\/.+/.test(file.type)) {
				return {
					title: file.name,
					title_link: url,
					video_url: url,
					video_type: file.type,
					video_size: file.size,
				};
			}
		}

		return {
			title: file.name,
			title_link: url,
		};
	}
}
