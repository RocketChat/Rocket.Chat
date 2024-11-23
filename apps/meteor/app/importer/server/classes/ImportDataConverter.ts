import type { IImportRecord, IImportUser, IImportMessage, IImportChannel, IImportContact } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import { ImportData } from '@rocket.chat/models';
import { pick } from '@rocket.chat/tools';

import type { IConversionCallbacks } from '../definitions/IConversionCallbacks';
import { ContactConverter } from './converters/ContactConverter';
import { ConverterCache } from './converters/ConverterCache';
import { type MessageConversionCallbacks, MessageConverter } from './converters/MessageConverter';
import type { RecordConverter, RecordConverterOptions } from './converters/RecordConverter';
import { RoomConverter } from './converters/RoomConverter';
import { UserConverter, type UserConverterOptions } from './converters/UserConverter';

export type ConverterOptions = UserConverterOptions & Omit<RecordConverterOptions, 'deleteDbData'>;

export class ImportDataConverter {
	protected _options: ConverterOptions;

	protected _userConverter: UserConverter;

	protected _roomConverter: RoomConverter;

	protected _messageConverter: MessageConverter;

	protected _contactConverter: ContactConverter;

	protected _cache = new ConverterCache();

	public get options(): ConverterOptions {
		return this._options;
	}

	constructor(logger: Logger, options?: ConverterOptions) {
		this._options = {
			workInMemory: false,
			...(options || {}),
		};

		this.initializeUserConverter(logger);
		this.initializeContactConverter(logger);
		this.initializeRoomConverter(logger);
		this.initializeMessageConverter(logger);
	}

	protected getRecordConverterOptions(): RecordConverterOptions {
		return {
			...pick(this._options, 'workInMemory'),
			// DbData is deleted by this class directly, so the converters don't need to do it individually
			deleteDbData: false,
		};
	}

	protected getUserConverterOptions(): UserConverterOptions {
		return {
			flagEmailsAsVerified: false,
			skipExistingUsers: false,
			skipNewUsers: false,

			...pick(
				this._options,
				'flagEmailsAsVerified',
				'skipExistingUsers',
				'skipNewUsers',
				'skipUserCallbacks',
				'skipDefaultChannels',
				'quickUserInsertion',
				'enableEmail2fa',
			),
		};
	}

	protected initializeUserConverter(logger: Logger): void {
		const userOptions = {
			...this.getRecordConverterOptions(),
			...this.getUserConverterOptions(),
		};

		this._userConverter = new UserConverter(userOptions, logger, this._cache);
	}

	protected initializeContactConverter(logger: Logger): void {
		const contactOptions = {
			...this.getRecordConverterOptions(),
		};

		this._contactConverter = new ContactConverter(contactOptions, logger, this._cache);
	}

	protected initializeRoomConverter(logger: Logger): void {
		const roomOptions = {
			...this.getRecordConverterOptions(),
		};

		this._roomConverter = new RoomConverter(roomOptions, logger, this._cache);
	}

	protected initializeMessageConverter(logger: Logger): void {
		const messageOptions = {
			...this.getRecordConverterOptions(),
		};

		this._messageConverter = new MessageConverter(messageOptions, logger, this._cache);
	}

	async addContact(data: IImportContact): Promise<void> {
		return this._contactConverter.addObject(data);
	}

	async addUser(data: IImportUser): Promise<void> {
		return this._userConverter.addObject(data);
	}

	async addChannel(data: IImportChannel): Promise<void> {
		return this._roomConverter.addObject(data);
	}

	async addMessage(data: IImportMessage, useQuickInsert = false): Promise<void> {
		return this._messageConverter.addObject(data, {
			useQuickInsert: useQuickInsert || undefined,
		});
	}

	async convertContacts(callbacks: IConversionCallbacks): Promise<void> {
		return this._contactConverter.convertData(callbacks);
	}

	async convertUsers(callbacks: IConversionCallbacks): Promise<void> {
		return this._userConverter.convertData(callbacks);
	}

	async convertChannels(startedByUserId: string, callbacks: IConversionCallbacks): Promise<void> {
		return this._roomConverter.convertChannels(startedByUserId, callbacks);
	}

	async convertMessages(callbacks: MessageConversionCallbacks): Promise<void> {
		return this._messageConverter.convertData(callbacks);
	}

	async convertData(startedByUserId: string, callbacks: IConversionCallbacks = {}): Promise<void> {
		await this.convertUsers(callbacks);
		await this.convertContacts(callbacks);
		await this.convertChannels(startedByUserId, callbacks);
		await this.convertMessages(callbacks);

		process.nextTick(async () => {
			await this.clearSuccessfullyImportedData();
		});
	}

	protected getAllConverters(): RecordConverter<IImportRecord>[] {
		return [this._userConverter, this._roomConverter, this._messageConverter];
	}

	public async clearImportData(): Promise<void> {
		if (!this._options.workInMemory) {
			// Using raw collection since its faster
			await ImportData.col.deleteMany({});
		}

		await Promise.all(this.getAllConverters().map((converter) => converter.clearImportData()));
	}

	async clearSuccessfullyImportedData(): Promise<void> {
		if (!this._options.workInMemory) {
			await ImportData.col.deleteMany({
				errors: {
					$exists: false,
				},
			});
		}

		await Promise.all(this.getAllConverters().map((converter) => converter.clearSuccessfullyImportedData()));
	}

	public abort(): void {
		this.getAllConverters().forEach((converter) => {
			converter.aborted = true;
		});
	}
}
