import type { LoginServiceConfiguration, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult, Document, FindOptions } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LoginServiceConfigurationRaw extends BaseRaw<LoginServiceConfiguration> implements ILoginServiceConfigurationModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<LoginServiceConfiguration>>) {
		super(db, 'meteor_accounts_loginServiceConfiguration', trash, {
			preventSetUpdatedAt: true,
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	async createOrUpdateService(
		serviceName: LoginServiceConfiguration['service'],
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

	async removeService(_id: LoginServiceConfiguration['_id']): Promise<DeleteResult> {
		return this.deleteOne({ _id });
	}

	async findOneByService<P extends Document = LoginServiceConfiguration>(
		serviceName: LoginServiceConfiguration['service'],
		options?: FindOptions<P>,
	): Promise<P | null> {
		return this.findOne({ service: serviceName.toLowerCase() }, options);
	}
}
