import { MediaCall } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { registerGroupCallReconcileCron } from '../lib/livekit/cleanup';
import { addSettings } from '../settings/voip';

License.onValidateLicense(async () => {
	await addSettings();

	await MediaCall.hangupExpiredCalls();

	// Reconcile group calls against LK presence every minute so calls whose
	// participants vanished (browser crash, missed leave) don't stay "active"
	// for 8h blocking the room from starting a new one.
	await registerGroupCallReconcileCron();
});
