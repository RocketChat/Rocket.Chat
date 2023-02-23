import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const EnabledAppsCount = ({
	variant,
	percentage,
	limit,
	enabled,
	context,
}: {
	variant: 'warning' | 'danger' | 'success';
	percentage: number;
	limit: number;
	enabled: number;
	context: 'private' | 'explore' | 'installed' | 'enterprise' | 'requested';
}): ReactElement | null => {
	const t = useTranslation();

	return (
		<Box
			display='flex'
			flexDirection='column'
			mi='16px'
			minWidth='200px'
			justifyContent='center'
			data-tooltip={t('Apps_Count_Enabled_tooltip', {
				number: enabled,
				context: context === 'private' ? 'private' : 'marketplace',
			})}
		>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' w='full'>
				<Box fontScale='c1'>{t('Apps_Count_Enabled', { count: enabled })}</Box>

				<Box fontScale='c1' color='annotation'>
					{`${enabled} / ${limit}`}
				</Box>
			</Box>
			<ProgressBar variant={variant} percentage={percentage} />
		</Box>
	);
};

export default EnabledAppsCount;
