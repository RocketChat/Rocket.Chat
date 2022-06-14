import type { VideoConference as AppVideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import type { IVideoConference } from '@rocket.chat/core-typings';

import { VideoConf } from '../../../../server/sdk';
import type { AppServerOrchestrator } from '../orchestrator';

export class AppVideoConferencesConverter {
	// @ts-ignore
	private orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(callId: string): Promise<AppVideoConference | undefined> {
		const call = await VideoConf.getUnfiltered(callId);

		return this.convertVideoConference(call);
	}

	convertVideoConference(call: IVideoConference | null): AppVideoConference | undefined {
		if (!call) {
			return;
		}

		return {
			...call,
		} as AppVideoConference;
	}

	convertAppVideoConference(call: AppVideoConference): IVideoConference {
		return {
			...call,
		} as IVideoConference;
	}
}
