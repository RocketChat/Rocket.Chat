import { MediaCall } from '@rocket.chat/core-services';
import { cronJobs } from '@rocket.chat/cron';
import { License } from '@rocket.chat/license';

import { addSettings } from '../settings/voip';

License.onValidateLicense(async () => {
	await addSettings();

	await cronJobs.add('expire-media-calls', '* * * * *', () => MediaCall.hangupExpiredCalls());
});
