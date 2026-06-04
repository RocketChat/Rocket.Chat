import { VideoConf } from '@rocket.chat/core-services';
import type { IRoom, IUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/server';
import { callbacks } from '../../../server/lib/callbacks';
import { CORE_PROVIDER_APP_ID, videoConfProviders } from '../../../server/lib/videoConfProviders';
import { videoConfTypes } from '../../../server/lib/videoConfTypes';
import { registerGroupCallReconcileCron } from '../lib/livekit/cleanup';
import { isLiveKitFullyConfigured } from '../lib/livekit/config';
import { resumeActiveRecordingPollers } from '../lib/livekit/recordingPoller';
import { generatePendingSummaries } from '../lib/livekit-agent/summary';
import { installLiveKitAgentSettingsWatchers, startLiveKitAgentSupervisor } from '../lib/livekit-agent/supervisor';
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

		videoConfTypes.registerVideoConferenceType({ type: 'videoconference', ringing: true }, async ({ _id, t }, allowRinging) => {
			if (!allowRinging || t === 'l') {
				return false;
			}

			if (t === 'd') {
				const room = await Rooms.findOneById<Pick<IRoom, 'uids'>>(_id, { projection: { uids: 1 } });
				if (room && (!room.uids || room.uids.length <= 2)) {
					return false;
				}
			}

			if ((await Subscriptions.countByRoomId(_id)) > 10) {
				return false;
			}

			return true;
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
		settings.watchByRegex(
			/^VideoConf_LiveKit_(Enabled|Url|Api_Key|Api_Secret|Recording_(Enabled|Storage|Local_Path|S3_Access_Key|S3_Secret_Key))$/,
			() => refreshLiveKitProviderRegistration(),
		);

		// Reconcile group calls against LK presence every minute so calls
		// whose participants vanished (browser crash, missed leave POST)
		// don't stay "active" indefinitely.
		await registerGroupCallReconcileCron();

		// Resume recording pollers for any recordings that were in flight
		// when the server last shut down (egressId persisted on the call doc,
		// message not yet sent). Idempotent if there's nothing to resume.
		await resumeActiveRecordingPollers();

		// Transcription agent subprocess. Idempotent — no-op when mode is
		// 'off' or required settings (LK creds + Gemini key) are missing.
		installLiveKitAgentSettingsWatchers();
		startLiveKitAgentSupervisor();

		// Backfill: any calls that ended with a transcript but no summary
		// message (server crashed between hangup and summary post). Best-
		// effort; failures here don't block license validation.
		void generatePendingSummaries();
	});
});
