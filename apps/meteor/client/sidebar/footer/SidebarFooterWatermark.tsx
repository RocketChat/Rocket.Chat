import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { useQuery } from 'react-query';

export const SidebarFooterWatermark = (): ReactElement | null => {
	const t = useTranslation();
	const isEnterpriseEdition = useEndpoint('GET', '/v1/licenses.isEnterprise');
	const result = useQuery(['licenses.isEnterprise'], () => isEnterpriseEdition(), {
		refetchOnWindowFocus: false,
	});

	if (!result.isSuccess || result.isLoading || result.data.isEnterprise) {
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
