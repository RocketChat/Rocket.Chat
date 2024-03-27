import type { RocketChatRecordDeleted, IWorkspaceCredentials } from '@rocket.chat/core-typings';
import type { IWorkspaceCredentialsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class WorkspaceCredentialsRaw extends BaseRaw<IWorkspaceCredentials> implements IWorkspaceCredentialsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IWorkspaceCredentials>>) {
		super(db, 'workspace_credentials', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { _id: 1, scopes: 1, expirationDate: 1, accessToken: 1 }, unique: true }];
	}

	getCredentialByScope(scope: string): Promise<IWorkspaceCredentials | null> {
		return this.findOne({ scope });
	}

	async unsetCredentialByScope(scope: string): Promise<void> {
		await this.deleteOne({ scopes: scope });
	}

	async updateCredentialByScope(scope: string, accessToken: string, expirationDate: Date): Promise<void> {
		const record = {
			$set: {
				scopes: [scope],
				accessToken,
				expirationDate,
			},
		};

		await this.updateOne({ scopes: scope }, record, { upsert: true });
	}

	async removeAllCredentials(): Promise<void> {
		await this.col.deleteMany({});
	}
}
