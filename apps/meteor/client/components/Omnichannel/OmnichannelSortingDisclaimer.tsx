import { OmnichannelSortingMechanismSettingType as OmniSortingType } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

export const OmnichannelSortingDisclaimer = () => {
	const t = useTranslation();
	const sortingMechanism = useSetting('Omnichannel_sorting_mechanism') as OmniSortingType;

	const [{ [sortingMechanism]: type }] = useState({
		[OmniSortingType.Priority]: t('Priorities'),
		[OmniSortingType.SLAs]: t('SLA_Policies'),
		[OmniSortingType.Timestamp]: '',
	});

	if (!type) {
		return null;
	}

	return (
		<Box is='li' padding='4px 12px' fontSize='14px' lineHeight='20px' maxWidth='180px'>
			{t('Omnichannel_sorting_disclaimer', { sortingMechanism: type })}
		</Box>
	);
};
