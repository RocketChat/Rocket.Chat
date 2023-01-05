import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const EnabledAppsCount = ({ numberOfEnabledApps, width }: { numberOfEnabledApps: number; width: string | number }): ReactElement => {
	const t = useTranslation();

	if (numberOfEnabledApps > 5) {
		throw new Error('You have enabled more than 5 apps');
	}

	return (
		<Box display='flex' flexDirection='column' mbe='x16' w={width}>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' w='full'>
				<Box is='span' color='default' fontScale='p2m'>
					{/* TODO: fix translation */}
					{`${numberOfEnabledApps} ${t('apps enabled')}`}
				</Box>

				<Box is='span' color='annotation' fontScale='p2m'>
					{`${numberOfEnabledApps} / 5`}
				</Box>
			</Box>
			<ProgressBar
				borderRadius='x8'
				overflow='hidden'
				percentage={numberOfEnabledApps * 20}
				barColor={numberOfEnabledApps < 5 ? 'font-on-success' : 'font-on-warning'}
				animated={false}
				w='full'
			/>
		</Box>
	);
};

export default EnabledAppsCount;
