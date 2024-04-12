import type { LoginServiceConfiguration, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel } from '@rocket.chat/model-typings';
import type { Collection, DeleteResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LoginServiceConfigurationRaw extends BaseRaw<LoginServiceConfiguration> implements ILoginServiceConfigurationModel {
	constructor(trash?: Collection<RocketChatRecordDeleted<LoginServiceConfiguration>>) {
		super('meteor_accounts_loginServiceConfiguration', trash, {
			preventSetUpdatedAt: true,
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	async createOrUpdateService(
		serviceName: string,
		serviceData: Partial<LoginServiceConfiguration>,
	): Promise<LoginServiceConfiguration['_id']> {
		const service = serviceName.toLowerCase();

		const existing = await this.findOne({ service });
		if (!existing) {
			const insertResult = await this.insertOne({
				service,
				...serviceData,
			});

			return insertResult.insertedId;
		}

		if (Object.keys(serviceData).length > 0) {
			await this.updateOne(
				{
					_id: existing._id,
				},
				{
					$set: serviceData,
				},
			);
		}

		return existing._id;
	}

	async removeService(serviceName: string): Promise<DeleteResult> {
		const service = serviceName.toLowerCase();

		return this.deleteOne({ service });
	}
}
