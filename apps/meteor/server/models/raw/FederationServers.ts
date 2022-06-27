import type { IFederationServer, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFederationServersModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexSpecification, UpdateWriteOpResult } from 'mongodb';
import { getCollectionName, Users } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class FederationServersRaw extends BaseRaw<IFederationServer> implements IFederationServersModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFederationServer>>) {
		super(db, getCollectionName('federation_servers'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { domain: 1 } }];
	}

	saveDomain(domain: string): Promise<UpdateWriteOpResult> {
		return this.updateOne(
			{ domain },
			{
				$setOnInsert: {
					domain,
				},
			},
			{ upsert: true },
		);
	}

	async refreshServers(): Promise<void> {
		const domains = await Users.getDistinctFederationDomains();

		for await (const domain of domains) {
			await this.saveDomain(domain);
		}

		await this.deleteMany({ domain: { $nin: domains } });
	}
}
