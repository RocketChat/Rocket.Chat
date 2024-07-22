import type { RocketChatRecordDeleted, IWorkspaceCredentials } from '@rocket.chat/core-typings';
import type { IWorkspaceCredentialsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, Filter, IndexDescription } from 'mongodb';

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

	async unsetCredentialByScope(scope: string): Promise<void> {
		const query: Filter<IWorkspaceCredentials> = {
			scopes: {
				$all: [scope],
				$size: 1,
			},
		};

		await this.deleteOne(query);
	}

	async updateCredentialByScope(scope: string, accessToken: string, expirationDate: Date): Promise<void> {
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

		await this.updateOne(query, record, { upsert: true });
	}

	async removeAllCredentials(): Promise<void> {
		await this.col.deleteMany({});
	}
}
