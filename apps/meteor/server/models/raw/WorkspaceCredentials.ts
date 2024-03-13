import type { RocketChatRecordDeleted, IWorkspaceCredentials } from '@rocket.chat/core-typings';
import type { IWorkspaceCredentialsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, Filter, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class WorkspaceCredentialsRaw extends BaseRaw<IWorkspaceCredentials> implements IWorkspaceCredentialsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IWorkspaceCredentials>>) {
		super(db, 'workspace_credentials', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { id: 1 } }];
	}

	getCredentialById(id: IWorkspaceCredentials['id']): Promise<IWorkspaceCredentials | null> {
		return this.findOne({ id });
	}

	async updateCredential(id: IWorkspaceCredentials['id'], value: IWorkspaceCredentials['value']): Promise<void> {
		const query: Filter<IWorkspaceCredentials> = { id };
		const update = { $set: { value } };

		await this.updateOne(query, update, { upsert: true });
	}

	async unsetCredentialValue(id: IWorkspaceCredentials['id']): Promise<void> {
		const query: Filter<IWorkspaceCredentials> = { id };
		await this.deleteOne(query);
	}
}
