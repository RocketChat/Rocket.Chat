import type { VideoConference } from '@rocket.chat/core-typings';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import type { Pexip } from '../Pexip';

export class PexipEndpoint {
	constructor(public readonly pexip: Pexip) {
		//
	}

	/** The conference identification out of an alias, which Pexip may give as a bare string or a SIP URI. */
	protected getIdentificationFromAlias(alias: string): string {
		if (!alias.startsWith('sip:') || !alias.includes('@')) {
			return alias;
		}

		return alias.substring(0, alias.indexOf('@')).replace('sip:', '');
	}

	protected normalizeSipExtension(identification: string): string {
		if (!identification.startsWith('+')) {
			return identification;
		}

		return identification.substring(1, identification.length);
	}

	/**
	 * The conference an identification stands for, whether it names one by SIP alias or by id.
	 *
	 * An alias is all digits and an id is not, so an all-digit identification is tried as an alias first. It
	 * still falls through to the id lookup, because the alias may have been released since it was dialled.
	 */
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
