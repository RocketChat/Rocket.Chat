/* eslint-disable react/no-multi-comp */
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { GenericResourceUsage } from '../../../components/GenericResourceUsage/GenericResourceUsage';
import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage/GenericResourceUsageSkeleton';
import { useActiveConnections } from './hooks/useActiveConnections';

const CustomUserActiveConnections = () => {
	const t = useTranslation();

	const result = useActiveConnections();

	if (result.isLoading || result.isError) {
		return <GenericResourceUsageSkeleton title={t('Active_connections')} />;
	}

	const { current, max, percentage } = result.data;

	return <GenericResourceUsage title={t('Active_connections')} value={current} max={max} percentage={percentage} />;
};

export default CustomUserActiveConnections;
