import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import InboxHeader from './InboxHeader';
import SidebarRoomList from './RoomList';
import SidebarPanelSearch from './components/SidebarPanelSearch';

const Inbox = () => {
	const { t } = useTranslation();
	const searchId = useId();
	const [searchOpen, setSearchOpen] = useState(false);
	const [filterText, setFilterText] = useState('');
	const debouncedFilterText = useDebouncedValue(filterText, 100);
	const appliedFilterText = searchOpen ? debouncedFilterText : '';

	const toggleSearch = () => {
		setSearchOpen((open) => !open);
		setFilterText('');
	};

	return (
		<>
			<InboxHeader searchId={searchId} searchOpen={searchOpen} onToggleSearch={toggleSearch} />
			{searchOpen && (
				<SidebarPanelSearch
					id={searchId}
					value={filterText}
					placeholder={t('Search_rooms')}
					onChange={setFilterText}
					onClose={toggleSearch}
				/>
			)}
			<SidebarRoomList filterText={appliedFilterText} />
		</>
	);
};

export default Inbox;
