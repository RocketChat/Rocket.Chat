import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type AppsLogsFilterOptionsProps = {
	onExpandAll: () => void;
	onCollapseAll: () => void;
};

const AppsLogsFilterOptions = ({ onExpandAll, onCollapseAll, ...props }: AppsLogsFilterOptionsProps) => {
	const { t } = useTranslation();

	const menuOptions = {
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
	};
	return <Menu title={t('Options')} small={false} alignSelf='flex-end' options={menuOptions} {...props} />;
};

export default AppsLogsFilterOptions;
