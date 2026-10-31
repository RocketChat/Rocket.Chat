import { IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import SidebarPanelHeader from './components/SidebarPanelHeader';
import { useCreateNewMenu } from '../navbar/NavBarPagesGroup/hooks/useCreateNewMenu';

type InboxHeaderProps = {
	searchId: string;
	searchOpen: boolean;
	onToggleSearch: () => void;
};

/**
 * Header of the default sidebar when the sidebar rail is on: search, as in the Teams panel, and the create new menu.
 * The room list preferences (display, sort, grouping) live in the rail, since they also shape the Teams panel.
 */
const InboxHeader = ({ searchId, searchOpen, onToggleSearch }: InboxHeaderProps) => {
	const { t } = useTranslation();
	const createNewSections = useCreateNewMenu();

	return (
		<SidebarPanelHeader title={t('Inbox')}>
			<IconButton
				icon='magnifier'
				small
				title={t('Search')}
				aria-label={t('Search_rooms')}
				aria-expanded={searchOpen}
				aria-controls={searchId}
				pressed={searchOpen}
				onClick={onToggleSearch}
			/>
			{createNewSections.length > 0 && (
				<GenericMenu icon='pencil-box' title={t('Create_new')} sections={createNewSections} is={IconButton} small placement='bottom-end' />
			)}
		</SidebarPanelHeader>
	);
};

export default InboxHeader;
