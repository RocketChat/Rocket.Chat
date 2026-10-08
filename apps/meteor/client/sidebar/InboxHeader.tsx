import { IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import SidebarPanelHeader from './components/SidebarPanelHeader';
import { useCreateNewMenu } from '../navbar/NavBarPagesGroup/hooks/useCreateNewMenu';
import { useSortMenu } from '../navbar/NavBarPagesGroup/hooks/useSortMenu';

/**
 * Header of the default sidebar when the sidebar rail is on. It holds the room list's preferences (display, sort
 * and grouping) and the create new menu, which the rail kept as items of its own before.
 */
const InboxHeader = () => {
	const { t } = useTranslation();
	const preferencesSections = useSortMenu();
	const createNewSections = useCreateNewMenu();

	return (
		<SidebarPanelHeader title={t('Inbox')}>
			<GenericMenu
				icon='customize'
				title={t('Preferences')}
				sections={preferencesSections}
				selectionMode='multiple'
				is={IconButton}
				small
				placement='bottom-end'
			/>
			{createNewSections.length > 0 && (
				<GenericMenu icon='pencil-box' title={t('Create_new')} sections={createNewSections} is={IconButton} small placement='bottom-end' />
			)}
		</SidebarPanelHeader>
	);
};

export default InboxHeader;
