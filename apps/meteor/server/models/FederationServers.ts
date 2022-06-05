import { IndexSpecification } from 'mongodb';
import type { UpdateWriteOpResult } from 'mongodb';
import type { IFederationServer } from '@rocket.chat/core-typings';
import type { IFederationServersModel } from '@rocket.chat/model-typings';
import { registerModel, Users } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class FederationServers extends ModelClass<IFederationServer> implements IFederationServersModel {
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

const col = db.collection(`${prefix}federation_servers`);
registerModel('IFederationServersModel', new FederationServers(col, trashCollection) as IFederationServersModel);
