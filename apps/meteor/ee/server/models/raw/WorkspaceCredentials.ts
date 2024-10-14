import type { RocketChatRecordDeleted, IWorkspaceCredentials } from '@rocket.chat/core-typings';
import type { IWorkspaceCredentialsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult, Filter, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class WorkspaceCredentialsRaw extends BaseRaw<IWorkspaceCredentials> implements IWorkspaceCredentialsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IWorkspaceCredentials>>) {
		super(db, 'workspace_credentials', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { _id: 1, scopes: 1, expirationDate: 1, accessToken: 1 }, unique: true }];
	}

	getCredentialByScope(scope: string): Promise<IWorkspaceCredentials | null> {
		const query: Filter<IWorkspaceCredentials> = {
			scopes: {
				$all: [scope],
				$size: 1,
			},
		};

		return this.findOne(query);
	}

	unsetCredentialByScope(scope: string): Promise<DeleteResult> {
		const query: Filter<IWorkspaceCredentials> = {
			scopes: {
				$all: [scope],
				$size: 1,
			},
		};

		return this.deleteOne(query);
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
				scopes: [scope],
				accessToken,
				expirationDate,
			},
		};

		const query: Filter<IWorkspaceCredentials> = {
			scopes: {
				$all: [scope],
				$size: 1,
			},
		};

		return this.updateOne(query, record, { upsert: true });
	}

	removeAllCredentials(): Promise<DeleteResult> {
		return this.col.deleteMany({});
	}
}
