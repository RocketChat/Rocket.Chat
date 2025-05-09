import { useTranslation } from 'react-i18next';

import { GenericResourceUsage, GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import { useActiveConnections } from '../../hooks/useActiveConnections';

const CustomUserActiveConnections = () => {
	const { t } = useTranslation();

	const result = useActiveConnections();

	if (result.isPending || result.isError) {
		return <GenericResourceUsageSkeleton title={t('Active_connections')} />;
	}

	const { current, max, percentage } = result.data;

	return <GenericResourceUsage title={t('Active_connections')} value={current} max={max} percentage={percentage} />;
};

export default CustomUserActiveConnections;
