import { MediaCall } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { registerGroupCallReconcileCron } from '../lib/livekit/cleanup';
import { resumeActiveRecordingPollers } from '../lib/livekit/recordingPoller';
import { generatePendingSummaries } from '../lib/livekit-agent/summary';
import { installLiveKitAgentSettingsWatchers, startLiveKitAgentSupervisor } from '../lib/livekit-agent/supervisor';
import { addSettings } from '../settings/voip';

License.onValidateLicense(async () => {
	await addSettings();

	await MediaCall.hangupExpiredCalls();

	// Reconcile group calls against LK presence every minute so calls whose
	// participants vanished (browser crash, missed leave) don't stay "active"
	// for 8h blocking the room from starting a new one.
	await registerGroupCallReconcileCron();

	// Recording poller resumes for any recordings that were in flight when the
	// server last shut down (egressId persisted on the call doc, message not
	// yet sent). Idempotent if there's nothing to resume.
	await resumeActiveRecordingPollers();

	// Transcription agent subprocess. Idempotent — no-op when mode is 'off'
	// or required settings (LK creds + Gemini key) are missing.
	installLiveKitAgentSettingsWatchers();
	startLiveKitAgentSupervisor();

	// Pick up any ended calls whose summary message was never posted (server
	// crashed between hangup and summary generation). Best-effort; failures
	// during boot don't block license validation.
	void generatePendingSummaries();
});
