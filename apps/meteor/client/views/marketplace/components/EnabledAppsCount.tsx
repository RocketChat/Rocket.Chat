import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const getBarColor = (numberOfEnabledApps: number): string => {
	if (numberOfEnabledApps < 4) {
		return 'font-on-success';
	}

	if (numberOfEnabledApps === 4) {
		return 'font-on-warning';
	}

	return 'font-on-danger';
};

const EnabledAppsCount = (): ReactElement => {
	const t = useTranslation();
	// TODO: get from some context;
	const numberOfEnabledApps = 1;

	return (
		<Box display='flex' flexDirection='column' mi='16px' minWidth='200px' justifyContent='center'>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' w='full'>
				<Box fontScale='c1'>{t('Apps_Count_Enabled', { count: numberOfEnabledApps })}</Box>

				<Box fontScale='c1' color='annotation'>
					{`${numberOfEnabledApps} / 5`}
				</Box>
			</Box>
			<ProgressBar
				borderRadius='full'
				overflow='hidden'
				percentage={numberOfEnabledApps <= 5 ? numberOfEnabledApps * 20 : 100}
				barColor={getBarColor(numberOfEnabledApps)}
				animated={false}
			/>
		</Box>
	);
};

export default EnabledAppsCount;
