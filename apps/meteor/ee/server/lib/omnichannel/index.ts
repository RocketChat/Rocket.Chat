import { License } from '@rocket.chat/license';
import { patchOmniCore } from '@rocket.chat/omni-core-ee';
import { Meteor } from 'meteor/meteor';

import '../../hooks/omnichannel/afterTakeInquiry';
import '../../hooks/omnichannel/beforeNewInquiry';
import '../../hooks/omnichannel/beforeNewRoom';
import '../../hooks/omnichannel/beforeRoutingChat';
import '../../hooks/omnichannel/checkAgentBeforeTakeInquiry';
import '../../hooks/omnichannel/handleNextAgentPreferredEvents';
import '../../hooks/omnichannel/onCheckRoomParamsApi';
import '../../hooks/omnichannel/onLoadConfigApi';
import '../../hooks/omnichannel/onSaveVisitorInfo';
import '../../hooks/omnichannel/scheduleAutoTransfer';
import '../../hooks/omnichannel/resumeOnHold';
import '../../hooks/omnichannel/afterOnHold';
import '../../hooks/omnichannel/onTransferFailure';
import './routing/LoadBalancing';
import './routing/LoadRotation';
import './AutoCloseOnHoldScheduler';
import './business-hour';
import '../../api/v1/omnichannel';
import { createDefaultPriorities } from './priorities';

patchOmniCore();

await License.onLicense('livechat-enterprise', async () => {
	require('../../hooks/omnichannel');
	await import('./startup');
	const { createPermissions } = await import('./permissions');
	const { createSettings } = await import('./settings');
	await import('./unit');

	Meteor.startup(() => {
		void createSettings();
		void createPermissions();
		void createDefaultPriorities();
	});
});
