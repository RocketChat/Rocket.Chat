import { useHasLicenseModule } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MultipleBusinessHoursBehavior } from '../../../lib/omnichannel/businessHours/MultipleBusinessHoursBehavior';
import { SingleBusinessHourBehavior } from '../../../lib/omnichannel/businessHours/SingleBusinessHourBehavior';
import { businessHourManager } from '../../../lib/omnichannel/businessHours/businessHourManager';

const businessHours = {
	multiple: new MultipleBusinessHoursBehavior(),
	single: new SingleBusinessHourBehavior(),
};

export const useLivechatEnterprise = () => {
	const businessHourType = useSetting<'Single' | 'Multiple'>('Livechat_business_hour_type', 'Single');
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	useEffect(() => {
		if (businessHourType && hasLicense) {
			businessHourManager.registerBusinessHourBehavior(businessHours[businessHourType.toLowerCase() as 'single' | 'multiple']);
		}
	}, [businessHourType, hasLicense]);
};
