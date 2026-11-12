import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import InboxHeader from './InboxHeader';
import SidebarRoomList from './RoomList';
import SidebarPanelSearch from './components/SidebarPanelSearch';

const Inbox = () => {
	const { t } = useTranslation();
	const searchId = useId();
	const searchButtonRef = useRef<HTMLButtonElement>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [filterText, setFilterText] = useState('');
	const debouncedFilterText = useDebouncedValue(filterText, 100);
	const appliedFilterText = searchOpen ? debouncedFilterText : '';

	const toggleSearch = () => {
		setSearchOpen((open) => !open);
		setFilterText('');
	};

	const closeSearch = () => {
		toggleSearch();
		searchButtonRef.current?.focus();
	};

	return (
		<>
			<InboxHeader searchId={searchId} searchButtonRef={searchButtonRef} searchOpen={searchOpen} onToggleSearch={toggleSearch} />
			{searchOpen && (
				<SidebarPanelSearch
					id={searchId}
					value={filterText}
					placeholder={t('Search_rooms')}
					onChange={setFilterText}
					onClose={closeSearch}
				/>
			)}
			<SidebarRoomList filterText={appliedFilterText} />
		</>
	);
};

export default Inbox;
