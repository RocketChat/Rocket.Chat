import { UpdateWriteOpResult } from 'mongodb';
import type { IFederationServer } from '@rocket.chat/core-typings';

import { Users } from './index';
import { BaseRaw, IndexSpecification } from './BaseRaw';

export class FederationServersRaw extends BaseRaw<IFederationServer> {
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
