import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import SidebarPanelHeader from './components/SidebarPanelHeader';

type InboxHeaderProps = {
	searchId: string;
	searchOpen: boolean;
	onToggleSearch: () => void;
};

const InboxHeader = ({ searchId, searchOpen, onToggleSearch }: InboxHeaderProps) => {
	const { t } = useTranslation();

	return (
		<SidebarPanelHeader title={t('Inbox')}>
			<IconButton
				icon='magnifier'
				size='small'
				title={t('Search')}
				aria-label={t('Search_rooms')}
				aria-expanded={searchOpen}
				aria-controls={searchId}
				pressed={searchOpen}
				onClick={onToggleSearch}
			/>
		</SidebarPanelHeader>
	);
};

export default InboxHeader;
