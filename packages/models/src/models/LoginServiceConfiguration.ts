import type { LoginServiceConfiguration, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, Db, Document, IndexDescription } from 'mongodb';

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

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { service: 1 }, unique: true }];
	}

	async createOrUpdateService(
		serviceName: LoginServiceConfiguration['service'],
		serviceData: Partial<LoginServiceConfiguration>,
	): Promise<LoginServiceConfiguration['_id']> {
		const service = serviceName.toLowerCase();

		const result = await this.findOneAndUpdate(
			{ service },
			{ $set: { ...serviceData, service } },
			{ upsert: true, returnDocument: 'after', projection: { _id: 1 } },
		);
		if (!result) {
			throw new Error(`Login service ${service} was not saved`);
		}

		return result._id;
	}

	async removeAll(): Promise<LoginServiceConfiguration['_id'][]> {
		const ids = await this.find({}, { projection: { _id: 1 } })
			.map(({ _id }) => _id)
			.toArray();
		await this.removeByIds(ids);
		return ids;
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
