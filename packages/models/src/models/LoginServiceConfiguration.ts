import type { LoginServiceConfiguration, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, Db, Document } from 'mongodb';

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

	removeByService(serviceName: LoginServiceConfiguration['service']): Promise<Pick<LoginServiceConfiguration, '_id'> | null> {
		return this.findOneAndDelete({ service: serviceName.toLowerCase() }, { projection: { _id: 1 } });
	}

	async findOneByService<
		P extends Document = LoginServiceConfiguration,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(serviceName: LoginServiceConfiguration['service'], options?: O): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ service: serviceName.toLowerCase() }, options);
	}
}
