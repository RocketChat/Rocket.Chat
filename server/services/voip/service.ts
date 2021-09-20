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

	async getServerConfigData(serverType: ServerType): Promise<IVoipServerConfig | null> {
		switch (serverType) {
			case ServerType.MANAGEMENT: {
				return this.VoipServerConfiguration.findOne({ type: ServerType.MANAGEMENT });
			}
			case ServerType.CALL_SERVER: {
				return this.VoipServerConfiguration.findOne({ type: ServerType.CALL_SERVER });
			}
			default: {
				return null;
			}
		}
	}

	// this is a dummy function to avoid having an empty IVoipService interface
	getConfiguration(): any {
		return {};
	}
}
