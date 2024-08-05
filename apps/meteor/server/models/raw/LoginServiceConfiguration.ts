import type { LoginServiceConfiguration, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult, Document, FindOptions, ModifyResult } from 'mongodb';

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
	): Promise<{ operation: 'created' | 'updated' | 'no-op'; result: ModifyResult<LoginServiceConfiguration> }> {
		const service = serviceName.toLowerCase();

		const updateResult = await this.findOneAndUpdate(
			{ service },
			{
				$set: serviceData,
				$setOnInsert: { service },
			},
			{
				returnDocument: 'after',
				upsert: true,
			},
		);

		const { lastErrorObject } = updateResult;
		let operation: 'created' | 'updated' | 'no-op';

		if (lastErrorObject?.upserted) {
			operation = 'created';
		} else if (Object.keys(serviceData).length === 0) {
			operation = 'no-op';
		} else {
			operation = 'updated';
		}

		return { operation, result: updateResult };
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
