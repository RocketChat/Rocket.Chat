import type { IFederationServer, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFederationServersModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { Users } from '../index';

export class FederationServersRaw extends BaseRaw<IFederationServer> implements IFederationServersModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFederationServer>>) {
		super(db, 'federation_servers', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { domain: 1 } }];
	}

	saveDomain(domain: string): Promise<UpdateResult> {
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
		// TODO remove model dependency - this logs should be inside a function/service and not in a model
		const domains = await Users.getDistinctFederationDomains();

		for await (const domain of domains) {
			await this.saveDomain(domain);
		}

		await this.deleteMany({ domain: { $nin: domains } });
	}
}
