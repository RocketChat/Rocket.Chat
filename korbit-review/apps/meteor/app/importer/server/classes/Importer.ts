import { api } from '@rocket.chat/core-services';
import type {
	IImport,
	IImportRecord,
	IImportChannel,
	IImportUser,
	IImportProgress,
	IImporterShortSelection,
	IImportContact,
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Settings, ImportData, Imports } from '@rocket.chat/models';
import AdmZip from 'adm-zip';
import type { MatchKeysAndValues, MongoServerError } from 'mongodb';

import { Selection, SelectionChannel, SelectionUser } from '..';
import { ImportDataConverter } from './ImportDataConverter';
import type { ConverterOptions } from './ImportDataConverter';
import { ImporterProgress } from './ImporterProgress';
import { ImporterWebsocket } from './ImporterWebsocket';
import { notifyOnSettingChanged, notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { t } from '../../../utils/lib/i18n';
import { ProgressStep, ImportPreparingStartedStates } from '../../lib/ImporterProgressStep';
import type { ImporterInfo } from '../definitions/ImporterInfo';

type OldSettings = {
	allowedDomainList?: string | null;
	allowUsernameChange?: boolean | null;
	maxFileSize?: number | null;
	mediaTypeWhiteList?: string | null;
	mediaTypeBlackList?: string | null;
};

/**
 * Base class for all of the importers.
 */
export class Importer {
	private _reportProgressHandler: ReturnType<typeof setTimeout> | undefined;

	protected AdmZip = AdmZip;

	protected converter: ImportDataConverter;

	protected info: ImporterInfo;

	protected logger: Logger;

	protected oldSettings: OldSettings;

	protected _lastProgressReportTotal = 0;

	public importRecord: IImport;

	public progress: ImporterProgress;

	constructor(info: ImporterInfo, importRecord: IImport, converterOptions: ConverterOptions = {}) {
		if (!info.key || !info.importer) {
			throw new Error('Information passed in must be a valid ImporterInfo instance.');
		}

		this.info = info;
		this.logger = new Logger(`${this.info.name} Importer`);

		this.converter = new ImportDataConverter(this.logger, converterOptions);

		this.importRecord = importRecord;
		this.progress = new ImporterProgress(this.info.key, this.info.name);
		this.oldSettings = {};

		this.progress.step = this.importRecord.status;
		this._lastProgressReportTotal = 0;
		this.reloadCount();

		this.logger.debug(`Constructed a new ${this.info.name} Importer.`);
	}

	/**
	 * Registers the file name and content type on the import operation
	 */
	async startFileUpload(fileName: string, contentType?: string): Promise<IImport> {
		await this.updateProgress(ProgressStep.UPLOADING);
		return this.updateRecord({ file: fileName, ...(contentType ? { contentType } : {}) });
	}

	/**
	 * Takes the uploaded file and extracts the users, channels, and messages from it.
	 *
	 * @param {string} _fullFilePath the full path of the uploaded file
	 * @returns {ImporterProgress} The progress record of the import.
	 */
	async prepareUsingLocalFile(_fullFilePath: string): Promise<ImporterProgress> {
		return this.updateProgress(ProgressStep.PREPARING_STARTED);
	}

	/**
	 * Starts the import process. The implementing method should defer
	 * as soon as the selection is set, so the user who started the process
	 * doesn't end up with a "locked" UI while Meteor waits for a response.
	 * The returned object should be the progress.
	 *
	 * @param {IImporterShortSelection} importSelection The selection data.
	 * @returns {ImporterProgress} The progress record of the import.
	 */
	async startImport(importSelection: IImporterShortSelection, startedByUserId: string): Promise<ImporterProgress> {
		await this.updateProgress(ProgressStep.IMPORTING_STARTED);
		this.reloadCount();
		const started = Date.now();

		const beforeImportFn = async ({ data, dataType: type }: IImportRecord) => {
			if (this.importRecord.valid === false) {
				this.converter.abort();
				throw new Error('The import operation is no longer valid.');
			}

			switch (type) {
				case 'channel': {
					if (importSelection.channels?.all) {
						return true;
					}
					if (!importSelection.channels?.list?.length) {
						return false;
					}

					const channelData = data as IImportChannel;

					const id = channelData.t === 'd' ? '__directMessages__' : channelData.importIds[0];
					return importSelection.channels.list?.includes(id);
				}
				case 'user': {
					if (importSelection.users?.all) {
						return true;
					}
					if (!importSelection.users?.list?.length) {
						return false;
					}

					const userData = data as IImportUser;
					const id = userData.importIds[0];
					return importSelection.users.list.includes(id);
				}

				case 'contact': {
					if (importSelection.contacts?.all) {
						return true;
					}
					if (!importSelection.contacts?.list?.length) {
						return false;
					}

					const contactData = data as IImportContact;

					const id = contactData.importIds[0];
					return importSelection.contacts.list.includes(id);
				}
			}

			return false;
		};

		const afterImportFn = async () => {
			await this.addCountCompleted(1);

			if (this.importRecord.valid === false) {
				this.converter.abort();
				throw new Error('The import operation is no longer valid.');
			}
		};

		const afterImportAllMessagesFn = async (importedRoomIds: string[]): Promise<void> =>
			api.broadcast('notify.importedMessages', { roomIds: importedRoomIds });

		const afterBatchFn = async (successCount: number, errorCount: number) => {
			if (successCount) {
				await this.addCountCompleted(successCount);
			}
			if (errorCount) {
				await this.addCountError(errorCount);
			}

			if (this.importRecord.valid === false) {
				this.converter.abort();
				throw new Error('The import operation is no longer valid.');
			}
		};

		const afterContactsBatchFn = async (successCount: number) => {
			const value = await Settings.incrementValueById('Contacts_Importer_Count', successCount, { returnDocument: 'after' });
			if (value) {
				void notifyOnSettingChanged(value);
			}
		};

		const onErrorFn = async () => {
			await this.addCountCompleted(1);
		};

		process.nextTick(async () => {
			await this.backupSettingValues();

			try {
				await this.applySettingValues({});

				await this.updateProgress(ProgressStep.IMPORTING_USERS);
				await this.converter.convertUsers({ beforeImportFn, afterImportFn, onErrorFn, afterBatchFn });

				await this.updateProgress(ProgressStep.IMPORTING_CONTACTS);
				await this.converter.convertContacts({ beforeImportFn, afterImportFn, onErrorFn, afterBatchFn: afterContactsBatchFn });

				await this.updateProgress(ProgressStep.IMPORTING_CHANNELS);
				await this.converter.convertChannels(startedByUserId, { beforeImportFn, afterImportFn, onErrorFn });

				await this.updateProgress(ProgressStep.IMPORTING_MESSAGES);
				await this.converter.convertMessages({ afterImportFn, onErrorFn, afterImportAllMessagesFn });

				await this.updateProgress(ProgressStep.FINISHING);

				process.nextTick(async () => {
					await this.converter.clearSuccessfullyImportedData();
				});

				await this.updateProgress(ProgressStep.DONE);
			} catch (e) {
				this.logger.error(e);
				await this.updateProgress(ProgressStep.ERROR);
			} finally {
				await this.applySettingValues(this.oldSettings);
			}

			const timeTook = Date.now() - started;
			this.logger.log(`Import took ${timeTook} milliseconds.`);
		});

		return this.getProgress();
	}

	async backupSettingValues() {
		const allowUsernameChange = (await Settings.findOneById('Accounts_AllowUsernameChange'))?.value as boolean | null;
		const maxFileSize = (await Settings.findOneById('FileUpload_MaxFileSize'))?.value as number | null;
		const mediaTypeWhiteList = (await Settings.findOneById('FileUpload_MediaTypeWhiteList'))?.value as string | null;
		const mediaTypeBlackList = (await Settings.findOneById('FileUpload_MediaTypeBlackList'))?.value as string | null;

		this.oldSettings = {
			allowUsernameChange,
			maxFileSize,
			mediaTypeWhiteList,
			mediaTypeBlackList,
		};
	}

	async applySettingValues(settingValues: OldSettings) {
		const settingsIds = [
			{ _id: 'Accounts_AllowUsernameChange', value: settingValues.allowUsernameChange ?? true },
			{ _id: 'FileUpload_MaxFileSize', value: settingValues.maxFileSize ?? -1 },
			{ _id: 'FileUpload_MediaTypeWhiteList', value: settingValues.mediaTypeWhiteList ?? '*' },
			{ _id: 'FileUpload_MediaTypeBlackList', value: settingValues.mediaTypeBlackList ?? '' },
		];

		const promises = settingsIds.map((setting) => Settings.updateValueById(setting._id, setting.value));

		(await Promise.all(promises)).forEach((value, index) => {
			if (value?.modifiedCount) {
				void notifyOnSettingChangedById(settingsIds[index]._id);
			}
		});
	}

	getProgress(): ImporterProgress {
		return this.progress;
	}

	/**
	 * Updates the progress step of this importer.
	 * It also changes some internal settings at various stages of the import.
	 * This way the importer can adjust user/room information at will.
	 *
	 * @param {ProgressStep} step The progress step which this import is currently at.
	 * @returns {ImporterProgress} The progress record of the import.
	 */
	async updateProgress(step: IImportProgress['step']): Promise<ImporterProgress> {
		this.progress.step = step;

		this.logger.debug(`${this.info.name} is now at ${step}.`);
		await this.updateRecord({ status: this.progress.step });

		// Do not send the default progress report during the preparing stage - the classes are sending their own report in a different format.
		if (!ImportPreparingStartedStates.includes(this.progress.step)) {
			this.reportProgress();
		}

		return this.progress;
	}

	reloadCount() {
		this.progress.count.total = this.importRecord.count?.total || 0;
		this.progress.count.completed = this.importRecord.count?.completed || 0;
		this.progress.count.error = this.importRecord.count?.error || 0;
	}

	/**
	 * Adds the passed in value to the total amount of items needed to complete.
	 *
	 * @param {number} count The amount to add to the total count of items.
	 * @returns {ImporterProgress} The progress record of the import.
	 */
	async addCountToTotal(count: number): Promise<ImporterProgress> {
		this.progress.count.total += count;
		await this.updateRecord({ 'count.total': this.progress.count.total });

		return this.progress;
	}

	/**
	 * Adds the passed in value to the total amount of items completed.
	 *
	 * @param {number} count The amount to add to the total count of finished items.
	 * @returns {ImporterProgress} The progress record of the import.
	 */
	async addCountCompleted(count: number): Promise<ImporterProgress> {
		this.progress.count.completed += count;

		return this.maybeUpdateRecord();
	}

	async addCountError(count: number): Promise<ImporterProgress> {
		this.progress.count.error += count;

		return this.maybeUpdateRecord();
	}

	async maybeUpdateRecord() {
		// Only update the database every 500 messages (or 50 for other records)
		// Or the completed is greater than or equal to the total amount
		const count = this.progress.count.completed + this.progress.count.error;
		const range = this.progress.step === ProgressStep.IMPORTING_MESSAGES ? 500 : 50;

		if (count % range === 0 || count >= this.progress.count.total || count - this._lastProgressReportTotal > range) {
			this._lastProgressReportTotal = this.progress.count.completed + this.progress.count.error;
			await this.updateRecord({ 'count.completed': this.progress.count.completed, 'count.error': this.progress.count.error });
			this.reportProgress();
		} else if (!this._reportProgressHandler) {
			this._reportProgressHandler = setTimeout(() => {
				this.reportProgress();
			}, 250);
		}

		this.logger.log(`${this.progress.count.completed} records imported, ${this.progress.count.error} failed`);

		return this.progress;
	}

	/**
	 * Sends an updated progress to the websocket
	 */
	reportProgress() {
		if (this._reportProgressHandler) {
			clearTimeout(this._reportProgressHandler);
			this._reportProgressHandler = undefined;
		}
		ImporterWebsocket.progressUpdated(this.progress);
	}

	/**
	 * Updates the import record with the given fields being `set`.
	 */
	async updateRecord(fields: MatchKeysAndValues<IImport>): Promise<IImport> {
		if (!this.importRecord) {
			return this.importRecord;
		}

		await Imports.update({ _id: this.importRecord._id }, { $set: fields });
		// #TODO: Remove need for the typecast
		this.importRecord = (await Imports.findOne(this.importRecord._id)) as IImport;

		return this.importRecord;
	}

	async buildSelection(): Promise<Selection> {
		await this.updateProgress(ProgressStep.USER_SELECTION);

		const users = await ImportData.getAllUsersForSelection();
		const channels = await ImportData.getAllChannelsForSelection();
		const contacts = await ImportData.getAllContactsForSelection();
		const hasDM = await ImportData.checkIfDirectMessagesExists();

		const selectionUsers = users.map(
			(u) =>
				new SelectionUser(u.data.importIds[0], u.data.username, u.data.emails[0], Boolean(u.data.deleted), u.data.type === 'bot', true),
		);
		const selectionChannels = channels.map(
			(c) => new SelectionChannel(c.data.importIds[0], c.data.name, Boolean(c.data.archived), true, c.data.t === 'p', c.data.t === 'd'),
		);
		const selectionContacts = contacts.map((c) => ({
			id: c.data.importIds[0],
			name: c.data.name || '',
			emails: c.data.emails || [],
			phones: c.data.phones || [],
			do_import: true,
		}));
		const selectionMessages = await ImportData.countMessages();

		if (hasDM) {
			selectionChannels.push(new SelectionChannel('__directMessages__', t('Direct_Messages'), false, true, true, true));
		}

		const results = new Selection(this.info.name, selectionUsers, selectionChannels, selectionMessages, selectionContacts);

		return results;
	}

	/**
	 * Utility method to check if the passed in error is a `MongoServerError` with the `codeName` of `'CursorNotFound'`.
	 */
	protected isCursorNotFoundError(error: unknown): error is MongoServerError & { codeName: 'CursorNotFound' } {
		return typeof error === 'object' && error !== null && 'codeName' in error && error.codeName === 'CursorNotFound';
	}
}
