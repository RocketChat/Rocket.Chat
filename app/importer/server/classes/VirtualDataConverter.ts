import { Random } from 'meteor/random';

import { IImportChannel } from '../definitions/IImportChannel';
import { ImportDataConverter } from './ImportDataConverter';
import type { IConverterOptions } from './ImportDataConverter';

export class VirtualDataConverter extends ImportDataConverter {
	protected _objects: Record<string, Array<Record<string, any>>>;

	protected useVirtual: boolean;

	constructor(virtual = true, options?: IConverterOptions) {
		super(options);

		this.useVirtual = virtual;
		if (virtual) {
			this.clearVirtualData();
		}
	}

	addObject(type: string, data: Record<string, any>, options: Record<string, any> = {}): void {
		if (!this.useVirtual) {
			return super.addObject(type, data, options);
		}

		if (!this._objects[type]) {
			this._objects[type] = [];
		}

		this._objects[type].push({
			_id: Random.id(),
			data,
			dataType: type,
			...options,
		});
	}

	getUsersToImport(): any {
		if (!this.useVirtual) {
			return super.getUsersToImport();
		}

		return this._objects.user || [];
	}

	getVirtualRecordById(id: string): Record<string, any> | undefined {
		for (const dataType in this._objects) {
			if (!(dataType in this._objects)) {
				continue;
			}

			const store = this._objects[dataType];
			for (const record of store) {
				if (record._id === id) {
					return record;
				}
			}
		}
	}

	saveNewId(importId: string, newId: string): void {
		if (!this.useVirtual) {
			return super.saveNewId(importId, newId);
		}

		const record = this.getVirtualRecordById(importId);

		if (record) {
			record.id = newId;
		}
	}

	saveError(importId: string, error: Error): void {
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

	skipRecord(_id: string): void {
		if (!this.useVirtual) {
			return super.skipRecord(_id);
		}

		const record = this.getVirtualRecordById(_id);

		if (record) {
			record.skipped = true;
		}
	}

	getMessagesToImport(): any {
		if (!this.useVirtual) {
			return super.getMessagesToImport();
		}

		return this._objects.message || [];
	}

	findDMForImportedUsers(...users: Array<string>): IImportChannel | undefined {
		if (!this.useVirtual) {
			return super.findDMForImportedUsers(...users);
		}

		// The original method is only used by the hipchat importer so we probably don't need to implement this on the virtual converter.
		return undefined;
	}

	getChannelsToImport(): any {
		if (!this.useVirtual) {
			return super.getChannelsToImport();
		}

		return this._objects.channel || [];
	}

	clearImportData(): void {
		if (!this.useVirtual) {
			return super.clearImportData();
		}

		this.clearVirtualData();
	}

	clearVirtualData(): void {
		this._objects = {
			user: [],
			channel: [],
			message: [],
		};
	}

	clearSuccessfullyImportedData(): void {
		if (!this.useVirtual) {
			return super.clearSuccessfullyImportedData();
		}

		this.clearVirtualData();
	}
}
