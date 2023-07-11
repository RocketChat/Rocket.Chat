import { ServiceClassInternal } from '@rocket.chat/core-services';
import { Imports, ImportData } from '@rocket.chat/models';
import type { IImportUser, IImport } from '@rocket.chat/core-typings';
import { ObjectId } from 'mongodb';

export class VideoConfService extends ServiceClassInternal {
	protected name = 'import';

	public async clear(): Promise<void> {
		await Imports.invalidateAllOperations();
		await ImportData.col.deleteMany({});
	}

	public async new(userId: string, name: string, key: string): Promise<IImport> {
		// Make sure there's no other operation running
		await this.clear();

		const importId = (
			await Imports.insertOne({
				type: name,
				importerKey: key,
				ts: new Date(),
				status: 'importer_new',
				valid: true,
				user: userId,
			})
		).insertedId;

		const operation = await Imports.findOneById(importId);
		if (!operation) {
			throw new Error('failed to create import operation');
		}

		return operation;
	}

	private getStateOfOperation(operation: IImport): 'none' | 'new' | 'loading' | 'ready' | 'importing' | 'done' | 'error' | 'canceled' {
		if (!operation.valid && operation.status !== 'importer_done') {
			return 'error';
		}

		switch (operation.status) {
			case 'importer_new':
				return 'new';
			case 'importer_uploading':
			case 'importer_downloading_file':
			case 'importer_file_loaded':
			case 'importer_preparing_started':
			case 'importer_preparing_users':
			case 'importer_preparing_channels':
			case 'importer_preparing_messages':
				return 'loading';
			case 'importer_user_selection':
				return 'ready';
			case 'importer_importing_started':
			case 'importer_importing_users':
			case 'importer_importing_channels':
			case 'importer_importing_messages':
			case 'importer_importing_files':
			case 'importer_finishing':
				return 'importing';
			case 'importer_done':
				return 'done';
			case 'importer_import_failed':
				return 'error';
			case 'importer_import_cancelled':
				return 'canceled';
		}
	}

	public async status(): Promise<any> {
		const operation = await Imports.findLastImport();

		if (!operation) {
			return {
				state: 'none',
			};
		}

		const state = this.getStateOfOperation(operation);

		return {
			state,
			operation,
		};
	}

	private async assertsValidStateForNewData(): Promise<void> {
		const operation = await Imports.findLastImport();
		if (!operation.valid) {
			throw new Error('Import operation not initialized.');
		}
		const state = this.getStateOfOperation(operation);
		switch (state) {
			case 'loading':
			case 'importing':
				throw new Error('The current import operation can not receive new data.');
			case 'done':
			case 'error':
			case 'canceled':
				throw new Error('The current import operation is already finished.');
		}
	}

	public async addUsers(users: IImportUser[]): Promise<void> {
		await this.assertsValidStateForNewData();

		await ImportData.col.insertMany(
			users.map((data) => ({
				_id: new ObjectId().toHexString(),
				data,
				dataType: 'user',
			})),
		);
	}

	public async run(): Promise<void> {
		
	}
}
