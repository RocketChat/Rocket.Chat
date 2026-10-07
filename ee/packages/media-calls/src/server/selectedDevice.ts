import type { IUser, IUserMediaCallDevice } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { CallRejectedError } from '../definition/common';
import { logger } from '../logger';

/** The external device a user takes calls on, or `null` when they take them in Rocket.Chat. */
export async function getSelectedDevice(uid: IUser['_id']): Promise<IUserMediaCallDevice | null> {
	const user = await Users.findOneById<Pick<IUser, '_id' | 'mediaCallDevice'>>(uid, { projection: { mediaCallDevice: 1 } });

	return user?.mediaCallDevice ?? null;
}

/**
 * Refuses a call that does not reach the user where they said to reach them.
 *
 * Choosing a device moves a user off Rocket.Chat entirely: they are reachable on that device and
 * nowhere else, so a call to their Rocket.Chat client is refused rather than ringing a client they
 * are no longer listening to. Choosing nothing is the mirror image — they take calls in Rocket.Chat,
 * so a call aimed at a device is refused.
 */
export async function assertCallReachesSelectedDevice(uid: IUser['_id'], service: 'webrtc' | 'cti', device?: string): Promise<void> {
	const selected = await getSelectedDevice(uid);

	if (!selected) {
		if (service === 'cti') {
			logger.debug({ msg: 'Refusing a device call for a user who takes calls in Rocket.Chat', uid });
			throw new CallRejectedError('unavailable');
		}
		return;
	}

	if (service !== 'cti' || device !== selected.id) {
		logger.debug({ msg: 'Refusing a call that does not reach the device the user selected', uid, service, device });
		throw new CallRejectedError('unavailable');
	}
}
