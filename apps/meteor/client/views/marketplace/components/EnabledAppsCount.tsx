import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { useNumberOfPrivateEnabledApps, useNumberOfMarketplaceEnabledApps } from '../AppsContext';

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
	const numberOfMarketplaceEnabledApps = useNumberOfMarketplaceEnabledApps();
	const numberOfPrivateEnabledApps = useNumberOfPrivateEnabledApps();

	const numberOfEnabledApps = useMemo(() => {
		return context === 'private' ? numberOfPrivateEnabledApps : numberOfMarketplaceEnabledApps;
	}, [context, numberOfMarketplaceEnabledApps, numberOfPrivateEnabledApps]);

	const enabledAppsLimit = useMemo(() => (context === 'private' ? 3 : 5), [context]);

	const { variant, percentage } = useMemo(() => {
		return getProgressBarValues(numberOfEnabledApps, enabledAppsLimit);
	}, [enabledAppsLimit, numberOfEnabledApps]);

	return (
		<Box display='flex' flexDirection='column' mi='16px' minWidth='200px' justifyContent='center'>
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
