import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import type { IBusinessHourBehavior } from '../../../lib/omnichannel/businessHours/IBusinessHourBehavior';
import { MultipleBusinessHoursBehavior } from '../../../lib/omnichannel/businessHours/MultipleBusinessHoursBehavior';
import { SingleBusinessHourBehavior } from '../../../lib/omnichannel/businessHours/SingleBusinessHourBehavior';
import { businessHourManager } from '../../../lib/omnichannel/businessHours/businessHourManager';

const businessHours: Record<string, IBusinessHourBehavior> = {
	multiple: new MultipleBusinessHoursBehavior(),
	single: new SingleBusinessHourBehavior(),
};

export const useLivechatEnterprise = () => {
	const businessHourType = useSetting('Livechat_business_hour_type') as string;
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	useEffect(() => {
		if (businessHourType && hasLicense) {
			businessHourManager.registerBusinessHourBehavior(businessHours[businessHourType.toLowerCase()]);
		}
	}, [businessHourType, hasLicense]);
};
