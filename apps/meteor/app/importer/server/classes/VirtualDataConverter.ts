import type {
	IImportUser,
	IImportUserRecord,
	IImportChannelRecord,
	IImportMessageRecord,
	IImportRecord,
	IImportRecordType,
	IImportData,
	IImportChannel,
} from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { ImportDataConverter } from './ImportDataConverter';
import type { IConverterOptions } from './ImportDataConverter';

export class VirtualDataConverter extends ImportDataConverter {
	protected _userRecords: Array<IImportUserRecord>;

	protected _channelRecords: Array<IImportChannelRecord>;

	protected _messageRecords: Array<IImportMessageRecord>;

	protected useVirtual: boolean;

	constructor(virtual = true, options?: IConverterOptions) {
		super(options);

		this.useVirtual = virtual;
		if (virtual) {
			this.clearVirtualData();
		}
	}

	public async clearImportData(): Promise<void> {
		if (!this.useVirtual) {
			return super.clearImportData();
		}

		this.clearVirtualData();
	}

	public async clearSuccessfullyImportedData(): Promise<void> {
		if (!this.useVirtual) {
			return super.clearSuccessfullyImportedData();
		}

		this.clearVirtualData();
	}

	public addUserSync(data: IImportUser, options?: Record<string, any>): void {
		return this.addObjectSync('user', data, options);
	}

	protected async addObject(type: IImportRecordType, data: IImportData, options: Record<string, any> = {}): Promise<void> {
		if (!this.useVirtual) {
			return super.addObject(type, data, options);
		}

		this.addObjectSync(type, data, options);
	}

	protected addObjectSync(type: IImportRecordType, data: IImportData, options: Record<string, any> = {}): void {
		if (!this.useVirtual) {
			throw new Error('Sync operations can only be used on virtual converter');
		}

		const list = this.getObjectList(type);

		list.push({
			_id: Random.id(),
			data,
			dataType: type,
			options,
		});
	}

	protected async getUsersToImport(): Promise<Array<IImportUserRecord>> {
		if (!this.useVirtual) {
			return super.getUsersToImport();
		}

		return this._userRecords;
	}

	protected async saveError(importId: string, error: Error): Promise<void> {
		if (!this.useVirtual) {
			return super.saveError(importId, error);
		}

		const record = this.getVirtualRecordById(importId);

		if (!record) {
			return;
		}

		if (!record.errors) {
			record.errors = [];
		}

		record.errors.push({
			message: error.message,
			stack: error.stack,
		});
	}

	protected async skipRecord(_id: string): Promise<void> {
		if (!this.useVirtual) {
			return super.skipRecord(_id);
		}

		const record = this.getVirtualRecordById(_id);

		if (record) {
			record.skipped = true;
		}
	}

	protected async getMessagesToImport(): Promise<IImportMessageRecord[]> {
		if (!this.useVirtual) {
			return super.getMessagesToImport();
		}

		return this._messageRecords;
	}

	protected async getChannelsToImport(): Promise<IImportChannelRecord[]> {
		if (!this.useVirtual) {
			return super.getChannelsToImport();
		}

		return this._channelRecords;
	}

	private clearVirtualData(): void {
		this._userRecords = [];
		this._channelRecords = [];
		this._messageRecords = [];
	}

	private getObjectList(type: IImportRecordType): Array<IImportRecord> {
		switch (type) {
			case 'user':
				return this._userRecords;
			case 'channel':
				return this._channelRecords;
			case 'message':
				return this._messageRecords;
		}
	}

	private getVirtualRecordById(id: string): IImportRecord | undefined {
		for (const store of [this._userRecords, this._channelRecords, this._messageRecords]) {
			for (const record of store) {
				if (record._id === id) {
					return record;
				}
			}
		}
	}
}
