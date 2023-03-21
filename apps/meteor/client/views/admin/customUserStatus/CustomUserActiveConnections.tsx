import { Box, ProgressBar, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useActiveConnections } from './hooks/useActiveConnections';

const CustomUserActiveConnections = () => {
	const t = useTranslation();

	const result = useActiveConnections();

	if (result.isLoading || result.isError) {
		return (
			<Box w='x180' h='x40' mi='x8' fontScale='c1' display='flex' flexDirection='column' justifyContent='space-around'>
				<Box color='default'>{t('Active_connections')}</Box>
				<Skeleton w='full' />
			</Box>
		);
	}

	const { current, max, percentage } = result.data;

	return (
		<Box w='x180' h='x40' mi='x8' fontScale='c1' display='flex' flexDirection='column' justifyContent='space-around'>
			<Box display='flex' justifyContent='space-between'>
				<Box color='default'>{t('Active_connections')}</Box>
				<Box color='hint'>
					{current}/{max}
				</Box>
			</Box>
			<ProgressBar percentage={percentage} variant={percentage < 80 ? 'success' : 'danger'} />
		</Box>
	);
};

export default CustomUserActiveConnections;
