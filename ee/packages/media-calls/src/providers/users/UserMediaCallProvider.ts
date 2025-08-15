import type { IMediaCall } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

import { agentManager } from '../../agents/Manager';
import { logger } from '../../logger';
import type { CreateCallParams } from '../BaseMediaCallProvider';
import { BaseMediaCallProvider } from '../BaseMediaCallProvider';
import type { IMediaCallProvider } from '../IMediaCallProvider';

export class UserMediaCallProvider extends BaseMediaCallProvider implements IMediaCallProvider {
	public readonly providerName = 'internal';

	public readonly supportedRoles: CallRole[] = ['caller', 'callee'];

	public readonly actorType = 'user';

	public async createCall(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'UserMediaCallProvider.createCall', params });
		const { caller, callee } = params;

		const callerAgent = await agentManager.getNewAgentForActor(caller, 'caller');
		if (!callerAgent) {
			throw new Error('invalid-caller');
		}

		const calleeAgent = await agentManager.getNewAgentForActor(callee, 'callee');
		if (!calleeAgent) {
			throw new Error('invalid-callee');
		}

		const newCall = await this.createCallBetweenActors(params);

		await callerAgent.onNewCall(newCall, await calleeAgent.getContactInfo());
		await calleeAgent.onNewCall(newCall, await callerAgent.getContactInfo());

		return newCall;
	}
}
