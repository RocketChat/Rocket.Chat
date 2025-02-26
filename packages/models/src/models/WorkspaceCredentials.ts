import type { IWorkspaceCredentials } from '@rocket.chat/core-typings';
import type { IWorkspaceCredentialsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class WorkspaceCredentialsRaw extends BaseRaw<IWorkspaceCredentials> implements IWorkspaceCredentialsModel {
	constructor(db: Db) {
		super(db, 'workspace_credentials');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { scope: 1, expirationDate: 1, accessToken: 1 }, unique: true }];
	}

	getCredentialByScope(scope = ''): Promise<IWorkspaceCredentials | null> {
		const query: Filter<IWorkspaceCredentials> = { scope };

		return this.findOne(query);
	}

	updateCredentialByScope({
		scope,
		accessToken,
		expirationDate,
	}: {
		scope: string;
		accessToken: string;
		expirationDate: Date;
	}): Promise<UpdateResult> {
		const record = {
			$set: {
				scope,
				accessToken,
				expirationDate,
			},
		};

		const query: Filter<IWorkspaceCredentials> = { scope };

		return this.updateOne(query, record, { upsert: true });
	}

	removeAllCredentials(): Promise<DeleteResult> {
		return this.col.deleteMany({});
	}
}
