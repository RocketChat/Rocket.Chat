import { Box, Icon, Menu } from '@rocket.chat/fuselage';
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

	const menuOptions = {
		exportLogs: {
			label: (
				<Box>
					<Icon name='circle-arrow-down' size='x16' marginInlineEnd={4} />
					{t('Export')}
				</Box>
			),
			action: onExportLogs,
		},
		expandAll: {
			label: (
				<Box>
					<Icon name='arrow-expand' size='x16' marginInlineEnd={4} />
					{t('Expand_all')}
				</Box>
			),
			action: onExpandAll,
		},
		collapseAll: {
			label: (
				<Box>
					<Icon name='arrow-collapse' size='x16' marginInlineEnd={4} />
					{t('Collapse_all')}
				</Box>
			),
			action: onCollapseAll,
		},
		refreshLogs: {
			label: (
				<Box>
					<Icon name='refresh' size='x16' marginInlineEnd={4} />
					{t('Refresh_logs')}
				</Box>
			),
			action: onRefreshLogs,
			disabled: isLoading,
		},
	};
	return <Menu title={t('Options')} small={false} alignSelf='flex-end' options={menuOptions} {...props} />;
};

export default CompactFilterOptions;
