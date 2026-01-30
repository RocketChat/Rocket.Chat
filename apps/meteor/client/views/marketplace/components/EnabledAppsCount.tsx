import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericResourceUsage } from '../../../components/GenericResourceUsage';

const EnabledAppsCount = ({
	limit,
	enabled,
	context,
	tooltip,
}: {
	limit: number;
	enabled: number;
	context: 'private' | 'explore' | 'installed' | 'premium' | 'requested';
	tooltip?: string;
}): ReactElement | null => {
	const { t } = useTranslation();

	const variant = useMemo(() => {
		if (enabled + 1 === limit) {
			return 'warning';
		}

		if (limit === 0 || enabled >= limit) {
			return 'danger';
		}

		return 'success';
	}, [enabled, limit]);

	const percentage = limit === 0 ? 100 : Math.round((enabled * 100) / limit);

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
