import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type AppsLogsFilterOptionsProps = {
	onExpandAll: () => void;
	onCollapseAll: () => void;
};

const AppsLogsFilterOptions = ({ onExpandAll, onCollapseAll, ...props }: AppsLogsFilterOptionsProps) => {
	const { t } = useTranslation();

	const items = [
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
	];

	return <GenericMenu large title={t('Options')} items={items} {...props} />;
};

export default AppsLogsFilterOptions;
