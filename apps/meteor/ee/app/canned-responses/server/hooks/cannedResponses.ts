import { License } from '@rocket.chat/license';

import { settings } from '../../../../../app/settings/server';
import { BeforeSaveCannedResponse } from '../../../../server/hooks/messages/BeforeSaveCannedResponse';

void License.onToggledFeature('canned-responses', {
	up: () => {
		// when the license is enabled, we need to check if the feature is enabled
		BeforeSaveCannedResponse.enabled = settings.get('Canned_Responses_Enable');
	},
	down: () => {
		// when the license is disabled, we can just disable the feature
		BeforeSaveCannedResponse.enabled = false;
	},
});

// we also need to check if the feature is enabled via setting, which is only possible when there is a license
settings.watch<boolean>('Canned_Responses_Enable', (value) => {
	BeforeSaveCannedResponse.enabled = value;
});
