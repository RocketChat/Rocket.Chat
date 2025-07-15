import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';

type CompactFilterOptionsProps = {
	handleExpandAll: () => void;
	handleRefreshLogs: () => void;
	isLoading: boolean;
};

const CompactFilterOptions = ({ handleExpandAll, handleRefreshLogs, isLoading, ...props }: CompactFilterOptionsProps) => {
	const t = useTranslation();

	const menuOptions = {
		expandAll: {
			label: (
				<Box data-qa='current-chats-options-clearFilters'>
					<Icon name='arrow-expand' size='x16' marginInlineEnd={4} />
					{t('Expand_all')}
				</Box>
			),
			action: handleExpandAll,
		},
		refreshLogs: {
			label: (
				<Box data-qa='current-chats-options-clearFilters'>
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
