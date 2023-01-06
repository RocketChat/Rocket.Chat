import { Box, ProgressBar } from '@rocket.chat/fuselage';
// import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const EnabledAppsCount = ({ numberOfEnabledApps, width }: { numberOfEnabledApps: number; width: string | number }): ReactElement => {
	// const t = useTranslation();

	// eslint-disable-next-line no-nested-ternary
	const barColor = numberOfEnabledApps < 5 ? 'font-on-success' : numberOfEnabledApps === 5 ? 'font-on-warning' : 'font-on-danger';

	return (
		<Box display='flex' flexDirection='column' mb='x8' w={width}>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' w='full'>
				<Box is='span' color='default' fontScale='p2m'>
					{/* TODO: fix translation */}
					{`${numberOfEnabledApps} apps enabled`}
				</Box>

				<Box is='span' color='annotation' fontScale='p2m'>
					{`${numberOfEnabledApps} / 5`}
				</Box>
			</Box>
			<ProgressBar
				borderRadius='x8'
				overflow='hidden'
				percentage={numberOfEnabledApps <= 5 ? numberOfEnabledApps * 20 : 100}
				barColor={barColor}
				animated={false}
				w='full'
				mb='x4'
			/>
		</Box>
	);
};

export default EnabledAppsCount;
