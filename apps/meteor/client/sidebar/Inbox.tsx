import { IconButton } from '@rocket.chat/fuselage';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRoomList from './RoomList';
import SidebarPanelHeader from './components/SidebarPanelHeader';
import SidebarPanelSearch from './components/SidebarPanelSearch';

const Inbox = () => {
	const { t } = useTranslation();
	const searchId = useId();
	const searchButtonRef = useRef<HTMLButtonElement>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [filterText, setFilterText] = useState('');

	const closeSearch = () => {
		setSearchOpen(false);
		setFilterText('');
		searchButtonRef.current?.focus();
	};

	return (
		<>
			<SidebarPanelHeader title={t('Inbox')}>
				<IconButton
					ref={searchButtonRef}
					icon='magnifier'
					size='small'
					title={t('Search')}
					aria-label={t('Search_rooms')}
					aria-expanded={searchOpen}
					aria-controls={searchId}
					pressed={searchOpen}
					onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
				/>
			</SidebarPanelHeader>
			{searchOpen && (
				<SidebarPanelSearch
					id={searchId}
					value={filterText}
					placeholder={t('Search_rooms')}
					onChange={setFilterText}
					onClose={closeSearch}
				/>
			)}
			<SidebarRoomList filterText={filterText} />
		</>
	);
};

export default Inbox;
