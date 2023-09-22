import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useLicenseV2 } from '../../../../client/hooks/useLicenseV2';

export const SidebarFooterWatermark = (): ReactElement | null => {
	const t = useTranslation();

	const { isLoading, isError, license } = useLicenseV2();

	if (isError || isLoading) {
		return null;
	}

	const {
		grantedModules,
		information: {
			tags: [firstTag],
		},
	} = license;
	const isWatermarkVisible = grantedModules.find(({ module }) => module === 'rocketchat-watermark'); // TODO: Possibly change to useHasLicenseModule

	if (!isWatermarkVisible) {
		return null;
	}

	return (
		<Box pi={16} pbe={8}>
			<Box is='a' href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
				<Box fontScale='micro' color='hint' pbe={4}>
					{t('Powered_by_RocketChat')}
				</Box>
				<Box fontScale='micro' color='pure-white' pbe={4}>
					{firstTag.name}
				</Box>
			</Box>
		</Box>
	);
};
