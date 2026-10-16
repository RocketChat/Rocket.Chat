import { Box, Button, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useFilterModals } from './hooks/useFilterModals';

const SidebarRailFiltersEmpty = () => {
	const { t } = useTranslation();
	const { openCreateFilter } = useFilterModals();

	return (
		<Box display='flex' flexDirection='column' alignItems='center' textAlign='center' gap={16} padding={24}>
			<Icon name='customize' size='x32' color='font-secondary-info' aria-hidden />
			<Box fontScale='p2' color='font-secondary-info'>
				{t('Filters_empty_description')}
			</Box>
			<Button small primary icon='plus' onClick={openCreateFilter}>
				{t('Create_filter')}
			</Button>
		</Box>
	);
};

export default SidebarRailFiltersEmpty;
