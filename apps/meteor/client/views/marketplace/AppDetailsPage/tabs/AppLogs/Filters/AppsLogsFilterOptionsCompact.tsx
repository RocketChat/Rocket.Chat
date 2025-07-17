import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type CompactFilterOptionsProps = {
	handleExpandAll: () => void;
	handleRefreshLogs: () => void;
	handleExportLogs: () => void;
	isLoading: boolean;
};

const CompactFilterOptions = ({ handleExportLogs, handleExpandAll, handleRefreshLogs, isLoading, ...props }: CompactFilterOptionsProps) => {
	const { t } = useTranslation();

	const menuOptions = {
		exportLogs: {
			label: (
				<Box>
					<Icon name='circle-arrow-down' size='x16' marginInlineEnd={4} />
					{t('Export')}
				</Box>
			),
			action: handleExportLogs,
		},
		expandAll: {
			label: (
				<Box>
					<Icon name='arrow-expand' size='x16' marginInlineEnd={4} />
					{t('Expand_all')}
				</Box>
			),
			action: handleExpandAll,
		},
		refreshLogs: {
			label: (
				<Box>
					<Icon name='refresh' size='x16' marginInlineEnd={4} />
					{t('Refresh_logs')}
				</Box>
			),
			action: handleRefreshLogs,
			disabled: isLoading,
		},
	};
	return <Menu title={t('Options')} small={false} alignSelf='flex-end' options={menuOptions} {...props} />;
};

export default CompactFilterOptions;
