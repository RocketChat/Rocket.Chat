import { VideoConf } from '@rocket.chat/core-services';
import type { IRoom, IUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { shouldRingVideoConference } from '../../../lib/videoConference/constants';
import { callbacks } from '../../../server/lib/callbacks';
import { CORE_PROVIDER_APP_ID, videoConfProviders } from '../../../server/lib/videoConfProviders';
import { videoConfTypes } from '../../../server/lib/videoConfTypes';
import { settings } from '../../../server/settings';
import { isLiveKitFullyConfigured } from '../lib/livekit/config';
import { registerLiveKitPresenceProbe } from '../lib/livekit/presence';
import { addSettings } from '../settings/video-conference';

// Bind/unbind LK provider in the videoConfProviders registry based on whether
// LiveKit is FULLY configured — Enabled flag + URL + API key + API secret all
// set. Only when fully configured do we expose 'livekit' as a provider option
// in admin/UI, so the camera button doesn't surface a non-functional choice.
// Done at module-load + on every relevant setting change so admins can flip
// LK on/off (or fill in missing keys) without restarting the server.
const refreshLiveKitProviderRegistration = (): void => {
	if (isLiveKitFullyConfigured()) {
		videoConfProviders.registerProvider('livekit', { mic: true, cam: true, title: true, embedded: true }, CORE_PROVIDER_APP_ID);
	} else {
		videoConfProviders.unRegisterProvider('livekit');
	}

	// Whether LiveKit can be asked who is in a room follows the same credentials, so it is decided in the same
	// place. The presence sweep works without it — this only lets it stop guessing where it doesn't have to.
	registerLiveKitPresenceProbe();
};

Meteor.startup(async () => {
	await License.onLicense('videoconference-enterprise', async () => {
		await addSettings();

		videoConfTypes.registerVideoConferenceType(
			{ type: 'direct', status: VideoConferenceStatus.CALLING },
			async ({ _id, t }, allowRinging) => {
				if (!allowRinging || t !== 'd') {
					return false;
				}

				const room = await Rooms.findOneById<Pick<IRoom, 'uids'>>(_id, { projection: { uids: 1 } });

				return Boolean(room && (!room.uids || room.uids.length === 2));
			},
		);

		/**
		 * Ringing a group of people, which is a multi-person direct message and nothing else.
		 *
		 * Channels and teams are deliberately excluded, however small. A call started in one is an invitation to
		 * whoever is around, and ringing every member of a channel to announce it interrupts a roomful of people
		 * who were not being called — the more so because a channel is a place someone joined once, not a group
		 * they assembled to talk to. Those calls are announced instead: a message in the room, and a row in the
		 * ongoing-calls list for anyone who is a member. A direct message is the opposite case — it is exactly the
		 * set of people meant, which is what makes ringing them the right thing.
		 *
		 * A two-person direct message is rung by the `direct` type above; this is the rest of them.
		 */
		videoConfTypes.registerVideoConferenceType({ type: 'videoconference', ringing: true }, async ({ _id, t }, allowRinging) => {
			if (!allowRinging || t !== 'd') {
				return false;
			}

			const room = await Rooms.findOneById<Pick<IRoom, 'uids'>>(_id, { projection: { uids: 1 } });
			if (room && (!room.uids || room.uids.length <= 2)) {
				return false;
			}

			// Starting a call rings everyone in it, so the room's size is the list being rung.
			return shouldRingVideoConference(await Subscriptions.countByRoomId(_id));
		});

		callbacks.add('onJoinVideoConference', async (callId: VideoConference['_id'], userId?: IUser['_id']) =>
			VideoConf.addUser(callId, userId),
		);

		// LiveKit embedded-SFU provider lifecycle. Runs only when the EE
		// videoconference module is licensed (we're inside its onLicense
		// already). Each bootstrap step is idempotent.

		// Register the provider in the registry now and on every relevant
		// setting change. isLiveKitFullyConfigured checks Enabled + URL +
		// API key + API secret, so we re-evaluate whenever any of those flip.
		refreshLiveKitProviderRegistration();
		settings.watchByRegex(/^VideoConf_LiveKit_(Enabled|Url|Api_Key|Api_Secret)$/, () => refreshLiveKitProviderRegistration());
	});
});
