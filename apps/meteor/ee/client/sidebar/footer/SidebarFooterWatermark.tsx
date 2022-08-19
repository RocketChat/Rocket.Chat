import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useIsEnterprise } from '../../../../client/hooks/useIsEnterprise';

export const SidebarFooterWatermark = (): ReactElement | null => {
	const t = useTranslation();

	const { isEnterprise, isLoading } = useIsEnterprise();

	if (isEnterprise || isLoading) {
		return null;
	}

	return (
		<Box pi='x16' pbe='x8'>
			<Box is='a' href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
				<Box fontScale='micro' color='hint' pbe='x4'>
					{t('Powered_by_RocketChat')}
				</Box>
				<Box fontScale='micro' color={colors.n100} pbe='x4'>
					{t('Free_Edition')}
				</Box>
			</Box>
		</Box>
	);
};
