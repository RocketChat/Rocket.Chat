import { Db } from 'mongodb';

import { IVoipService } from '../../sdk/types/IVoipService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { VoipServerConfigurationRaw } from '../../../app/models/server/raw/VoipServerConfiguration';
import { ServerType, IVoipServerConfig } from '../../../definition/IVoipServerConfig';

export class VoipService extends ServiceClass implements IVoipService {
	protected name = 'voip';

	// this will hold the multiple call server connection settings that can be supported
	// They should only be modified through this service
	private VoipServerConfiguration: VoipServerConfigurationRaw;

	constructor(db: Db) {
		super();

		this.VoipServerConfiguration = new VoipServerConfigurationRaw(db.collection('rocketchat_voip_server_configuration'));
	}

	async addServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean> {
		const { type } = config;

		const existingConfig = await this.getServerConfigData(type);
		if (existingConfig) {
			throw new Error(`Error! There already exists an active record of type ${ type }`);
		}

		await this.VoipServerConfiguration.insertOne(config);

		return true;
	}

	async updateServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean> {
		const { type } = config;

		const existingConfig = await this.getServerConfigData(type);
		if (!existingConfig) {
			throw new Error(`Error! No active record exists of type ${ type }`);
		}

		await this.VoipServerConfiguration.updateOne({ type, configActive: true }, config);

		return true;
	}

	// in-future, if we want to keep a track of duration during which a server config was active, then we'd need to modify the
	// 		IVoipServerConfig interface and add columns like "valid_from_ts" and "valid_to_ts"
	async deactivateServerConfigDataIfAvailable(type: ServerType): Promise<boolean> {
		await this.VoipServerConfiguration.updateMany({ type, configActive: true }, { $set: { configActive: false } });
		return true;
	}

	async getServerConfigData(type: ServerType): Promise<IVoipServerConfig | null> {
		return this.VoipServerConfiguration.findOne({ type, configActive: true });
	}

	// this is a dummy function to avoid having an empty IVoipService interface
	getConfiguration(): any {
		return {};
	}
}
