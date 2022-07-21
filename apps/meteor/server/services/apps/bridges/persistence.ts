import { PersistenceBridge } from '@rocket.chat/apps-engine/server/bridges/PersistenceBridge';
import type { RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import type { AppServerOrchestrator } from '../orchestrator';

export class AppPersistenceBridge extends PersistenceBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async purge(appId: string): Promise<void> {
		this.orch.debugLog(`The App's persistent storage is being purged: ${appId}`);

		this.orch.getPersistenceModel().remove({ appId });
	}

	protected async create(data: object, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is storing a new object in their persistence.`, data);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		return this.orch.getPersistenceModel().insert({ appId, data });
	}

	protected async createWithAssociations(data: object, associations: Array<RocketChatAssociationRecord>, appId: string): Promise<string> {
		this.orch.debugLog(
			`The App ${appId} is storing a new object in their persistence that is associated with some models.`,
			data,
			associations,
		);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		return this.orch.getPersistenceModel().insert({ appId, associations, data });
	}

	protected async readById(id: string, appId: string): Promise<object> {
		this.orch.debugLog(`The App ${appId} is reading their data in their persistence with the id: "${id}"`);

		const record = this.orch.getPersistenceModel().findOneById(id);

		return record.data;
	}

	protected async readByAssociations(associations: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>> {
		this.orch.debugLog(`The App ${appId} is searching for records that are associated with the following:`, associations);

		const records = this.orch
			.getPersistenceModel()
			.find({
				appId,
				associations: { $all: associations },
			})
			.fetch();

		return Array.isArray(records) ? records.map((r) => r.data) : [];
	}

	protected async remove(id: string, appId: string): Promise<object | undefined> {
		this.orch.debugLog(`The App ${appId} is removing one of their records by the id: "${id}"`);

		const record = this.orch.getPersistenceModel().findOne({ _id: id, appId });

		if (!record) {
			return undefined;
		}

		this.orch.getPersistenceModel().remove({ _id: id, appId });

		return record.data;
	}

	protected async removeByAssociations(
		associations: Array<RocketChatAssociationRecord>,
		appId: string,
	): Promise<Array<object> | undefined> {
		this.orch.debugLog(`The App ${appId} is removing records with the following associations:`, associations);

		const query = {
			appId,
			associations: {
				$all: associations,
			},
		};

		const records = this.orch.getPersistenceModel().find(query).fetch();

		if (!records) {
			return undefined;
		}

		this.orch.getPersistenceModel().remove(query);

		return Array.isArray(records) ? records.map((r) => r.data) : [];
	}

	protected async update(id: string, data: object, _upsert: boolean, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is updating the record "${id}" to:`, data);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		throw new Error('Not implemented.');
	}

	protected async updateByAssociations(
		associations: Array<RocketChatAssociationRecord>,
		data: object,
		upsert: boolean,
		appId: string,
	): Promise<string> {
		this.orch.debugLog(`The App ${appId} is updating the record with association to data as follows:`, associations, data);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		const query = {
			appId,
			associations,
		};

		return this.orch.getPersistenceModel().upsert(query, { $set: { data } }, { upsert });
	}
}
