import { IndexSpecification } from 'mongodb';
import type { UpdateWriteOpResult } from 'mongodb';
import type { IFederationServer } from '@rocket.chat/core-typings';
import type { IFederationServersModel } from '@rocket.chat/model-typings';
import { Users } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';

export class FederationServersRaw extends ModelClass<IFederationServer> implements IFederationServersModel {
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
