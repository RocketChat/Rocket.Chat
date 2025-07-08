import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';

type CompactFilterOptionsProps = {
	handleExportLogs: () => void;
	isLoading: boolean;
};

const CompactFilterOptions = ({ handleExportLogs, ...props }: CompactFilterOptionsProps) => {
	const t = useTranslation();

	const menuOptions = {
		exportLogs: {
			label: (
				<Box data-qa='current-chats-options-clearFilters'>
					<Icon name='circle-arrow-down' size='x16' marginInlineEnd={4} />
					{t('Export')}
				</Box>
			),
			action: handleExportLogs,
		},
	};
	return <Menu small={false} alignSelf='flex-end' options={menuOptions} {...props} />;
};

export default CompactFilterOptions;
