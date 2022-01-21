import { UpdateWriteOpResult } from 'mongodb';

import { Users } from './index';
import { IFederationServer } from '../../../../definition/Federation';
import { BaseRaw, IndexSpecification } from './BaseRaw';

export class FederationServersRaw extends BaseRaw<IFederationServer> {
	protected indexes: IndexSpecification[] = [{ key: { domain: 1 } }];

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
