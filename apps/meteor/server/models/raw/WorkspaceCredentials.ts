import type { IWorkspaceCredentials } from '@rocket.chat/core-typings';
import type { IWorkspaceCredentialsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class WorkspaceCredentialsRaw extends BaseRaw<IWorkspaceCredentials> implements IWorkspaceCredentialsModel {
	constructor(db: Db) {
		super(db, 'workspace_credentials');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { scopes: 1, expirationDate: 1, accessToken: 1 }, unique: true }];
	}

	getCredentialByScopes(scopes: string[] = []): Promise<IWorkspaceCredentials | null> {
		const query: Filter<IWorkspaceCredentials> = {
			scopes: {
				$eq: scopes,
			},
		};

		return this.findOne(query);
	}

	updateCredentialByScopes({
		scopes,
		accessToken,
		expirationDate,
	}: {
		scopes: string[];
		accessToken: string;
		expirationDate: Date;
	}): Promise<UpdateResult> {
		const record = {
			$set: {
				scopes,
				accessToken,
				expirationDate,
			},
		};

		const query: Filter<IWorkspaceCredentials> = {
			scopes: {
				$eq: scopes,
			},
		};

		return this.updateOne(query, record, { upsert: true });
	}

	removeAllCredentials(): Promise<DeleteResult> {
		return this.col.deleteMany({});
	}
}
