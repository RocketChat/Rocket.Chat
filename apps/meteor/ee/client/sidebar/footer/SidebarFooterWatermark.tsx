import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useLicense } from '../../../../client/hooks/useLicense';

export const SidebarFooterWatermark = (): ReactElement | null => {
	const t = useTranslation();

	const response = useLicense();

	if (response.isLoading || response.isError) {
		return null;
	}

	const license = response.data;

	if (license.activeModules.includes('hide-watermark') && !license.trial) {
		return null;
	}

	const [{ name: planName } = { name: 'Community' }] = license.tags ?? [];

	return (
		<Box pi={16} pbe={8}>
			<Box is='a' href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
				<Box fontScale='micro' color='hint' pbe={4}>
					{t('Powered_by_RocketChat')}
				</Box>
				<Box fontScale='micro' color='pure-white' pbe={4}>
					{[planName, license.trial ? 'trial' : ''].filter(Boolean).join(' ')}
				</Box>
			</Box>
		</Box>
	);
};
