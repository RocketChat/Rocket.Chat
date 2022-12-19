import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useIsEnterprise } from '../../../../client/hooks/useIsEnterprise';

export const SidebarFooterWatermark = (): ReactElement | null => {
	const t = useTranslation();

	const { isLoading, isError, data } = useIsEnterprise();

	if (isError || isLoading || data?.isEnterprise) {
		return null;
	}

	return (
		<Box pi='x16' pbe='x8'>
			<Box is='a' href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
				<Box fontScale='micro' color='hint' pbe='x4'>
					{t('Powered_by_RocketChat')}
				</Box>
				<Box fontScale='micro' color='neutral-100' pbe='x4'>
					{t('Free_Edition')}
				</Box>
			</Box>
		</Box>
	);
};
