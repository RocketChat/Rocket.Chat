import { OmnichannelSortingMechanismSettingType as OmniSortingType } from '@rocket.chat/core-typings';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import { useOmnichannelEnterpriseEnabled } from '../../hooks/omnichannel/useOmnichannelEnterpriseEnabled';

export const useOmnichannelSortingDisclaimer = () => {
	const isOmnichannelEnabled = useOmnichannelEnterpriseEnabled();

	const sortingMechanism = useSetting<OmniSortingType>('Omnichannel_sorting_mechanism') || OmniSortingType.Timestamp;

	const [{ [sortingMechanism]: type }] = useState({
		[OmniSortingType.Priority]: 'Priorities',
		[OmniSortingType.SLAs]: 'SLA_Policies',
		[OmniSortingType.Timestamp]: '',
	} as const);

	return isOmnichannelEnabled ? type : '';
};

export const OmnichannelSortingDisclaimer = () => {
	const t = useTranslation();

	const type = useOmnichannelSortingDisclaimer();

	if (!type) {
		return null;
	}

	return <>{t('Omnichannel_sorting_disclaimer', { sortingMechanism: t(type) })}</>;
};
