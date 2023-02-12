import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useAppsCountQuery } from '../hooks/useAppsCountQuery';

type Variant = 'success' | 'warning' | 'danger';

const getProgressBarValues = (numberOfEnabledApps: number, enabledAppsLimit: number): { variant: Variant; percentage: number } => {
	const values = { variant: 'danger', percentage: 0 } as { variant: Variant; percentage: number };

	if (numberOfEnabledApps < enabledAppsLimit) {
		values.variant = 'success';
	}

	if (numberOfEnabledApps + 1 === enabledAppsLimit) {
		values.variant = 'warning';
	}

	values.percentage = Math.round((numberOfEnabledApps / enabledAppsLimit) * 100);

	return values;
};

const EnabledAppsCount = (): ReactElement => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const { data: appsCount, status } = useAppsCountQuery();

	if (status !== 'success') {
		return <div />;
	}

	const numberOfEnabledApps = context === 'private' ? appsCount.totalPrivateEnabled : appsCount.totalMarketplaceEnabled;
	const enabledAppsLimit = context === 'private' ? appsCount.maxPrivateApps : appsCount.maxMarketplaceApps;
	const { variant, percentage } = getProgressBarValues(numberOfEnabledApps, enabledAppsLimit);

	return (
		<Box
			display='flex'
			flexDirection='column'
			mi='16px'
			minWidth='200px'
			justifyContent='center'
			data-tooltip={t('Apps_Count_Enabled_tooltip', {
				number: enabledAppsLimit,
				context: context === 'private' ? 'private' : 'marketplace',
			})}
		>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' w='full'>
				<Box fontScale='c1'>{t('Apps_Count_Enabled', { count: numberOfEnabledApps })}</Box>

				<Box fontScale='c1' color='annotation'>
					{`${numberOfEnabledApps} / ${enabledAppsLimit}`}
				</Box>
			</Box>
			<ProgressBar variant={variant} percentage={percentage} />
		</Box>
	);
};

export default EnabledAppsCount;
