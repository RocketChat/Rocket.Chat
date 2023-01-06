import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import EnabledAppsCount from './EnabledAppsCount';

const MarketplaceHeaderComponent = ({ numberOfEnabledApps, width }: { numberOfEnabledApps: number; width: string | number }) => {
	const t = useTranslation();

	return (
		// should we add more padding? pb='x16' pi='x24'
		<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexWrap='wrap'>
			<Box fontSize='h2' fontScale='h2'>
				{t('Explore')}
			</Box>

			<Box display='flex' flexDirection='row' flexWrap='wrap'>
				<EnabledAppsCount numberOfEnabledApps={numberOfEnabledApps} width={width} />
				<Box
					is={Button}
					fontSize='p2'
					fontWeight='p2'
					mis='x16'
					onClick={() => {
						console.log('click');
					}}
				>
					{t('Enable unlimited apps')}
				</Box>
			</Box>
		</Box>
	);
};

export default MarketplaceHeaderComponent;
