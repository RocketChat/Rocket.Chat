import { IconButton, SidepanelHeader, SidepanelHeaderActions, SidepanelHeaderTitle, SidepanelSearch } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRoomList from './RoomList';

const Inbox = () => {
	const { t } = useTranslation();
	const searchId = useId();
	const searchButtonRef = useRef<HTMLButtonElement>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [filterText, setFilterText] = useState('');
	const sidebarViewMode = useUserPreference('sidebarViewMode');

	const closeSearch = () => {
		setSearchOpen(false);
		setFilterText('');
		searchButtonRef.current?.focus();
	};

	return (
		<>
			<SidepanelHeader>
				<SidepanelHeaderTitle role='heading' aria-level={2}>
					{t('Inbox')}
				</SidepanelHeaderTitle>
				<SidepanelHeaderActions>
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
				</SidepanelHeaderActions>
			</SidepanelHeader>
			{searchOpen && (
				<SidepanelSearch
					variant='rooms-list'
					id={searchId}
					small={sidebarViewMode === 'condensed'}
					autoFocus
					value={filterText}
					onChange={(event: ChangeEvent<HTMLInputElement>) => setFilterText(event.currentTarget.value)}
					onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
						if (event.key === 'Escape') {
							closeSearch();
						}
					}}
					placeholder={t('Search_rooms')}
					aria-label={t('Search_rooms')}
				/>
			)}
			<SidebarRoomList filterText={filterText} />
		</>
	);
};

export default Inbox;
