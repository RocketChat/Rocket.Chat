import { IVoipConnectorResult } from '@rocket.chat/core-typings';

import { CommandParams } from '../asterisk.types';
import { Command } from '../Command';

export class PingCommand extends Command {
	executeCommand(_data?: CommandParams): Promise<IVoipConnectorResult> {
		return new Promise((_resolve, _reject) => {
			_reject('unimplemented');
		});
	}
}
