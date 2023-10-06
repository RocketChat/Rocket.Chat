import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IImportService } from '@rocket.chat/core-services';
import type { IImportUser, IImport, ImportStatus } from '@rocket.chat/core-typings';
import { Imports, ImportData } from '@rocket.chat/models';
import { ObjectId } from 'mongodb';

import { Importers } from '../../../app/importer/lib/Importers';
import { Selection } from '../../../app/importer/server/classes/ImporterSelection';
import { settings } from '../../../app/settings/server';
import { validateRoleList } from '../../lib/roles/validateRoleList';
import { getNewUserRoles } from '../user/lib/getNewUserRoles';

export class ImportService extends ServiceClassInternal implements IImportService {
	protected name = 'import';

	public async clear(): Promise<void> {
		await Imports.invalidateAllOperations();
		await ImportData.col.deleteMany({});
	}

	public async newOperation(userId: string, name: string, key: string): Promise<IImport> {
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

	public async status(): Promise<ImportStatus> {
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

	private assertsValidStateForNewData(operation: IImport | null): asserts operation is IImport {
		if (!operation?.valid) {
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

	public async addUsers(users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[]): Promise<void> {
		if (!users.length) {
			return;
		}

		const operation = await Imports.findLastImport();

		this.assertsValidStateForNewData(operation);

		const defaultRoles = getNewUserRoles();
		const userRoles = new Set<string>(defaultRoles);
		for await (const user of users) {
			if (!user.emails?.some((value) => value) || !user.importIds?.some((value) => value)) {
				throw new Error('Users are missing required data.');
			}

			if (user.roles?.length) {
				for (const roleId of user.roles) {
					userRoles.add(roleId);
				}
			}
		}

		if (userRoles.size > 0 && !(await validateRoleList([...userRoles]))) {
			throw new Error('One or more of the users have been assigned invalid roles.');
		}

		await ImportData.col.insertMany(
			users.map((data) => ({
				_id: new ObjectId().toHexString(),
				data: {
					...data,
					roles: data.roles ? [...new Set(...data.roles, ...defaultRoles)] : defaultRoles,
				},
				dataType: 'user',
			})),
		);

		await Imports.increaseTotalCount(operation._id, 'users', users.length);
		await Imports.setOperationStatus(operation._id, 'importer_user_selection');
	}

	public async run(userId: string): Promise<void> {
		const operation = await Imports.findLastImport();
		if (!operation?.valid) {
			throw new Error('error-operation-not-found');
		}

		if (operation.status !== 'importer_user_selection') {
			throw new Error('error-invalid-operation-status');
		}

		const { importerKey } = operation;
		const importer = Importers.get(importerKey);
		if (!importer) {
			throw new Error('error-importer-not-defined');
		}

		// eslint-disable-next-line new-cap
		const instance = new importer.importer(importer, operation, {
			skipUserCallbacks: true,
			skipDefaultChannels: true,
			enableEmail2fa: settings.get<boolean>('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In'),
			quickUserInsertion: true,
			// Do not update the data of existing users, but add the importId to them if it's missing
			skipExistingUsers: true,
			bindSkippedUsers: true,
		});

		const selection = new Selection(importer.name, [], [], 0);
		await instance.startImport(selection, userId);
	}
}
