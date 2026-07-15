import { License } from '@rocket.chat/license';
import { patchOmniCore } from '@rocket.chat/omni-core-ee';
import { Meteor } from 'meteor/meteor';

import '../../../server/hooks/omnichannel/afterTakeInquiry';
import '../../../server/hooks/omnichannel/beforeNewInquiry';
import '../../../server/hooks/omnichannel/beforeNewRoom';
import '../../../server/hooks/omnichannel/beforeRoutingChat';
import '../../../server/hooks/omnichannel/checkAgentBeforeTakeInquiry';
import '../../../server/hooks/omnichannel/handleNextAgentPreferredEvents';
import '../../../server/hooks/omnichannel/onCheckRoomParamsApi';
import '../../../server/hooks/omnichannel/onLoadConfigApi';
import '../../../server/hooks/omnichannel/onSaveVisitorInfo';
import '../../../server/hooks/omnichannel/scheduleAutoTransfer';
import '../../../server/hooks/omnichannel/resumeOnHold';
import '../../../server/hooks/omnichannel/afterOnHold';
import '../../../server/hooks/omnichannel/onTransferFailure';
import './lib/routing/LoadBalancing';
import './lib/routing/LoadRotation';
import './lib/AutoCloseOnHoldScheduler';
import './business-hour';
import '../../../server/api/v1/omnichannel';
import { createDefaultPriorities } from './priorities';

patchOmniCore();

await License.onLicense('livechat-enterprise', async () => {
	require('../../../server/hooks/omnichannel');
	await import('./startup');
	const { createPermissions } = await import('./permissions');
	const { createSettings } = await import('./settings');
	await import('./lib/unit');

	Meteor.startup(() => {
		void createSettings();
		void createPermissions();
		void createDefaultPriorities();
	});
});
