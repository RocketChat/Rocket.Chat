import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type CompactFilterOptionsProps = {
	onExpandAll: () => void;
	onCollapseAll: () => void;
	onRefreshLogs: () => void;
	onExportLogs: () => void;
	isLoading: boolean;
};

const CompactFilterOptions = ({
	onExportLogs,
	onExpandAll,
	onCollapseAll,
	onRefreshLogs,
	isLoading,
	...props
}: CompactFilterOptionsProps) => {
	const { t } = useTranslation();

	const items = [
		{
			id: 'exportLogs',
			icon: 'circle-arrow-down' as const,
			content: t('Export'),
			onClick: onExportLogs,
		},
		{
			id: 'expandAll',
			icon: 'arrow-expand' as const,
			content: t('Expand_all'),
			onClick: onExpandAll,
		},
		{
			id: 'collapseAll',
			icon: 'arrow-collapse' as const,
			content: t('Collapse_all'),
			onClick: onCollapseAll,
		},
		{
			id: 'refreshLogs',
			icon: 'refresh' as const,
			content: t('Refresh_logs'),
			onClick: onRefreshLogs,
			disabled: isLoading,
		},
	];

	return <GenericMenu title={t('Options')} large items={items} {...props} />;
};

export default CompactFilterOptions;
