import { Transform, type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { api } from '@rocket.chat/core-services';
import type { MessageAttachment, IUpload, IImporterShortSelection, IMessageWithPendingFileImport } from '@rocket.chat/core-typings';
import { Messages, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { serverFetch } from '@rocket.chat/server-fetch';

import { FileUpload } from '../../file-upload/server';
import { parseFileIntoMessageAttachments } from '../../file-upload/server/methods/sendFileMessage';
import { Importer, ProgressStep } from '../../importer/server';
import type { ImporterProgress } from '../../importer/server/classes/ImporterProgress';
import { settings } from '../../settings/server';

const LEASE_MS = 2 * 60 * 1000;

export class PendingFileImporter extends Importer {
	async prepareFileCount() {
		this.logger.debug('start preparing import operation');
		await super.updateProgress(ProgressStep.PREPARING_STARTED);

		const fileCount = await Messages.countAllImportedMessagesWithFilesToDownload();
		if (fileCount === 0) {
			await super.updateProgress(ProgressStep.DONE);
			return 0;
		}

		this.progress.count.total += fileCount;
		await this.updateRecord({
			'count.messages': fileCount,
			'count.total': fileCount,
			'messagesstatus': null,
			'status': ProgressStep.IMPORTING_FILES,
		});
		this.reportProgress();

		setImmediate(() => {
			this.startImport({}).catch(() => undefined);
		});

		return fileCount;
	}

	override async startImport(_importSelection: IImporterShortSelection): Promise<ImporterProgress> {
		const importedRoomIds = new Set<string>();
		const inFlightFileIds = new Set<string>();
		const skipMessageIds = new Set<string>();

		const processMessage = async (message: IMessageWithPendingFileImport) => {
			const { _importFile } = message;
			const url = _importFile.downloadUrl;

			if (!url?.startsWith('http')) {
				skipMessageIds.add(message._id);
				await this.addCountError(1);
				return;
			}

			if (inFlightFileIds.has(_importFile.id)) {
				skipMessageIds.add(message._id);
				return;
			}
			inFlightFileIds.add(_importFile.id);

			const details: { message_id: string; name: string; size: number; userId: string; rid: string; type?: string } = {
				message_id: `${message._id}-file-${_importFile.id}`,
				name: _importFile.name || Random.id(),
				size: _importFile.size || 0,
				userId: message.u._id,
				rid: message.rid,
			};

			const renewal = setInterval(() => void Messages.renewPendingFileImportLease(message._id, LEASE_MS), LEASE_MS / 4);

			try {
				const fileStream = await this.downloadFile(url, details);

				// Bypass the fileStore filters
				const file = await FileUpload.getStore('Uploads')._doInsert(details, fileStream);

				const rocketChatUrl = FileUpload.getPath(`${file._id}/${encodeURI(file.name || '')}`);
				const user = await Users.findOneById(message.u._id);
				const attachment = user
					? (await parseFileIntoMessageAttachments(file, message.rid, user)).attachments[0]
					: this.getMessageAttachment(file, rocketChatUrl);

				const result = await Messages.setImportFileRocketChatAttachment(_importFile.id, rocketChatUrl, attachment);
				await this.addCountCompleted('modifiedCount' in result ? result.modifiedCount : 1);
				importedRoomIds.add(message.rid);
			} catch (err) {
				this.logger.error({ msg: 'Failed to download pending file', url: url.split('?')[0], err });
				skipMessageIds.add(message._id);
				inFlightFileIds.delete(_importFile.id);
				await this.addCountError(1);
			} finally {
				clearInterval(renewal);
			}
		};

		const worker = async () => {
			for (;;) {
				const message = await Messages.findOneAndClaimPendingFileImport(LEASE_MS, Array.from(skipMessageIds));
				if (!message) {
					return;
				}

				await processMessage(message);
			}
		};

		const results = await Promise.allSettled(Array.from({ length: 10 }, () => worker()));

		const crashes = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
		if (crashes.length > 0) {
			crashes.forEach((crash) => this.logger.error({ msg: 'Pending file worker crashed', err: crash.reason }));
			await super.updateProgress(ProgressStep.ERROR);
			throw crashes[0].reason;
		}

		void api.broadcast('notify.importedMessages', { roomIds: Array.from(importedRoomIds) });

		await super.updateProgress(ProgressStep.DONE);
		return this.getProgress();
	}

	private async downloadFile(url: string, details: { type?: string }): Promise<Readable> {
		const response = await serverFetch(url, { ignoreSsrfValidation: false, allowList: settings.get<string>('SSRF_Allowlist') });

		if (!response.ok) {
			response.body.resume();
			throw new Error(`Unexpected response status ${response.status}`);
		}

		if (!details.type) {
			details.type = response.headers.get('content-type') || 'application/octet-stream';
		}

		// serverFetch only times out connecting; fail the download if the body goes idle for 60s.
		// Per-chunk reset (not a total cap) so large files aren't cut off mid-download.
		let idle: ReturnType<typeof setTimeout>;
		const meter = new Transform({
			transform(chunk, _encoding, callback) {
				idle.refresh();
				callback(null, chunk);
			},
		});
		idle = setTimeout(() => meter.destroy(new Error('Download stalled')), 60 * 1000);
		meter.on('close', () => clearTimeout(idle));

		void pipeline(response.body, meter).catch(() => undefined);
		return meter;
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
