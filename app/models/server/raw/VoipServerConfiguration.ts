import { Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IVoipServerConfig } from '../../../../definition/IVoipServerConfig';

export class VoipServerConfigurationRaw extends BaseRaw<IVoipServerConfig> {
	constructor(
		public readonly col: Collection<IVoipServerConfig>,
		public readonly trash?: Collection<IVoipServerConfig>,
	) {
		super(col, trash);
	}
}
