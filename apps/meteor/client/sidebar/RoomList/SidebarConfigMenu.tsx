import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from '../../navbar/NavBarPagesGroup/hooks/useSortMenu';

/**
 * The sidebar display/sort configuration menu. Rendered small, in the top-right of the sidebar filter row
 * (moved here from the top navbar for the classic sidebar).
 */
const SidebarConfigMenu = () => {
	const { t } = useTranslation();
	const sections = useSortMenu();

	return <GenericMenu tiny icon='customize' title={t('Display')} sections={sections} selectionMode='multiple' placement='bottom-end' />;
};

export default SidebarConfigMenu;
