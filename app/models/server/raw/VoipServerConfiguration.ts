import { Collection, DeleteWriteOpResultObject } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IVoipServerConfig, ServerType } from '../../../../definition/IVoipServerConfig';

export class VoipServerConfigurationRaw extends BaseRaw<IVoipServerConfig> {
	constructor(
		public readonly col: Collection<IVoipServerConfig>,
		public readonly trash?: Collection<IVoipServerConfig>,
	) {
		super(col, trash);
	}

	removeByType(type: ServerType): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteOne({ type });
	}
}
