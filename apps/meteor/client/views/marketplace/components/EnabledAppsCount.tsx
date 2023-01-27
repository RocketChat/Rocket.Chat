import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useNumberOfEnabledApps } from '../AppsContext';

const getVariant = (numberOfEnabledApps: number): 'success' | 'warning' | 'danger' => {
	if (numberOfEnabledApps < 4) {
		return 'success';
	}

	if (numberOfEnabledApps === 4) {
		return 'warning';
	}

	return 'danger';
};

const EnabledAppsCount = (): ReactElement => {
	const t = useTranslation();
	const numberOfEnabledApps = useNumberOfEnabledApps();

	return (
		<Box display='flex' flexDirection='column' mi='16px' minWidth='200px' justifyContent='center'>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' w='full'>
				<Box fontScale='c1'>{t('Apps_Count_Enabled', { count: numberOfEnabledApps })}</Box>

				<Box fontScale='c1' color='annotation'>
					{`${numberOfEnabledApps} / 5`}
				</Box>
			</Box>
			<ProgressBar variant={getVariant(numberOfEnabledApps)} percentage={numberOfEnabledApps <= 5 ? numberOfEnabledApps * 20 : 100} />
		</Box>
	);
};

export default EnabledAppsCount;
