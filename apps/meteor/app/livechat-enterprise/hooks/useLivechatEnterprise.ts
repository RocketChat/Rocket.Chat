import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useHasLicenseModule } from '../../../client/hooks/useHasLicenseModule';
import { businessHourManager } from '../../livechat/client/views/app/business-hours/BusinessHours';
import type { IBusinessHourBehavior } from '../../livechat/client/views/app/business-hours/IBusinessHourBehavior';
import { SingleBusinessHourBehavior } from '../../livechat/client/views/app/business-hours/Single';
import { MultipleBusinessHoursBehavior } from '../client/views/business-hours/Multiple';

const businessHours: Record<string, IBusinessHourBehavior> = {
	multiple: new MultipleBusinessHoursBehavior(),
	single: new SingleBusinessHourBehavior(),
};

export const useLivechatEnterprise = () => {
	const businessHourType = useSetting('Livechat_business_hour_type') as string;
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	useEffect(() => {
		if (businessHourType && hasLicense) {
			businessHourManager.registerBusinessHourBehavior(businessHours[businessHourType.toLowerCase()]);
		}
	}, [businessHourType, hasLicense]);
};
