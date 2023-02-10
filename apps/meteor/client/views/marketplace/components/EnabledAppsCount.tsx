import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useRouteParameter, useTooltipClose, useTooltipOpen, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useRef } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import { useAppsCount } from '../AppsContext';

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
	const appsCount = useAppsCount();

	const elRef = useRef<HTMLDivElement>(null);
	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();

	const numberOfEnabledApps = useMemo(() => {
		return context === 'private' ? appsCount.totalPrivateEnabled : appsCount.totalMarketplaceEnabled;
	}, [context, appsCount.totalMarketplaceEnabled, appsCount.totalPrivateEnabled]);

	const enabledAppsLimit = useMemo(
		() => (context === 'private' ? appsCount.maxPrivateApps : appsCount.maxMarketplaceApps),
		[context, appsCount.maxMarketplaceApps, appsCount.maxPrivateApps],
	);

	const { variant, percentage } = useMemo(() => {
		const enabled = Number(numberOfEnabledApps) || 0;
		const limit = Number(enabledAppsLimit) || 0;
		return getProgressBarValues(enabled, limit);
	}, [enabledAppsLimit, numberOfEnabledApps]);

	return (
		<Box
			display='flex'
			flexDirection='column'
			mi='16px'
			minWidth='200px'
			justifyContent='center'
			ref={elRef}
			onMouseOver={(e): void => {
				e.stopPropagation();
				e.preventDefault();
				elRef.current &&
					openTooltip(
						<MarkdownText
							content={t('Apps_Count_Enabled_tooltip', {
								number: enabledAppsLimit,
								context,
							})}
							variant='inline'
						/>,
						elRef.current,
					);
			}}
			onMouseLeave={(): void => {
				closeTooltip();
			}}
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
