import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useLicense } from '../../../../client/hooks/useLicense';

export const SidebarFooterWatermark = (): ReactElement | null => {
	const t = useTranslation();

	const { data: { license, activeModules = [], trial: isTrial = false } = {}, isLoading, isError } = useLicense();
	const [{ name: planName }] = license?.information?.tags ?? [{ name: 'Community' }];

	const isWatermarkHidden = !isTrial && activeModules.includes('hide-watermark');

	if (isWatermarkHidden) {
		return null;
	}

	return (
		<Box pi={16} pbe={8}>
			<Box is='a' href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
				<Box fontScale='micro' color='hint' pbe={4}>
					{t('Powered_by_RocketChat')}
				</Box>
				{isLoading || isError ? (
					<Skeleton width='5rem' height='1rem' />
				) : (
					<Box fontScale='micro' color='pure-white' pbe={4}>
						{planName} {isTrial ? 'trial' : ''}
					</Box>
				)}
			</Box>
		</Box>
	);
};
