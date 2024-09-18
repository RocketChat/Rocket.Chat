import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { GenericResourceUsage } from '../../../components/GenericResourceUsage';

const EnabledAppsCount = ({
	variant,
	percentage,
	limit,
	enabled,
	context,
	tooltip,
}: {
	variant: 'warning' | 'danger' | 'success';
	percentage: number;
	limit: number;
	enabled: number;
	context: 'private' | 'explore' | 'installed' | 'premium' | 'requested';
	tooltip?: string;
}): ReactElement | null => {
	const { t } = useTranslation();

	return (
		<GenericResourceUsage
			title={context === 'private' ? t('Private_Apps_Count_Enabled', { count: enabled }) : t('Apps_Count_Enabled', { count: enabled })}
			value={enabled}
			max={limit}
			percentage={percentage}
			threshold={80}
			variant={variant}
			tooltip={tooltip}
		/>
	);
};

export default EnabledAppsCount;
