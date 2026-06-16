import type { VideoConference } from '@rocket.chat/core-typings';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import type { Pexip } from '../Pexip';

export class PexipEndpoint {
	constructor(public readonly pexip: Pexip) {
		//
	}

	protected getIdentificationFromAlias(alias: string): string {
		if (!alias.startsWith('sip:') || !alias.includes('@')) {
			return alias;
		}

		return alias.substring(0, alias.indexOf('@')).replace('sip:', '');
	}

	protected async getCallByIdentification(identification: string): Promise<VideoConference | null> {
		if (!identification.match(/\D/g)) {
			const call = await VideoConferenceModel.findOneByProviderNameAndSipAlias('core.pexip', identification);
			if (call) {
				return call;
			}
		}

		return VideoConferenceModel.findOneById(identification);
	}
}
