import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { usePermission, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import TeamsListWrapper from './TeamsListWrapper';
import TeamsPanelCollapser from './TeamsPanelCollapser';
import TeamsPanelEmpty from './TeamsPanelEmpty';
import { useExpandedTeams } from './hooks/useExpandedTeams';
import { useTeamSubscriptions, useTeamsList } from './hooks/useTeamsList';
import { teamsPanelStore } from './teamsPanelStore';
import { useMergedRefsV2 } from '../../hooks/useMergedRefsV2';
import { useOpenedRoom } from '../../lib/RoomManager';
import CreateTeamModal from '../../navbar/NavBarPagesGroup/actions/CreateTeamModal';
import { useCreateRoomModal } from '../../navbar/NavBarPagesGroup/hooks/useCreateRoomModal';
import { useShortcutOpenMenu } from '../../views/navigation/sidebar/hooks/useShortcutOpenMenu';
import RoomListRow from '../RoomList/RoomListRow';
import RoomListRowWrapper from '../RoomList/RoomListRowWrapper';
import SidebarPanelHeader from '../components/SidebarPanelHeader';
import SidebarPanelSearch from '../components/SidebarPanelSearch';
import SidebarVirtualList from '../components/SidebarVirtualList';
import { usePreventDefault } from '../hooks/usePreventDefault';

type SidebarViewMode = 'extended' | 'medium' | 'condensed';

// The team options button only appears on hover or focus; touch screens have neither, so it stays visible there.
const touchMenuStyle = css`
	@media (hover: none), (pointer: coarse) {
		.rcx-sidebar-collapse-group__menu-wrapper {
			width: 1.25rem;
			opacity: 1;
		}
	}
`;

const sidebarRowHeight: Record<SidebarViewMode, number> = {
	condensed: 28,
	medium: 36,
	extended: 48,
};

const SIDEBAR_VIRTUAL_BUFFER_ROWS = 5;

const TeamsPanel = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const searchId = useId();
	const canCreateTeam = usePermission('create-team');
	const createTeam = useCreateRoomModal(CreateTeamModal);

	const [searchOpen, setSearchOpen] = useState(false);
	const [filterText, setFilterText] = useState('');
	const debouncedSearchText = useDebouncedValue(filterText, 100);
	// Closing the search shows every team at once, without waiting for the debounce to catch up.
	const debouncedFilterText = searchOpen ? debouncedSearchText : '';

	// Closing the search also clears it, so the panel goes back to the full list of teams.
	const toggleSearch = () => {
		setSearchOpen((open) => !open);
		setFilterText('');
	};

	const allTeams = useTeamSubscriptions();
	const { expandedTeams, toggleTeam } = useExpandedTeams(allTeams);
	const teamsUnreads = teamsPanelStore((state) => state.teamsUnreads);
	const teams = useTeamsList({ teams: allTeams, expandedTeams, filterText: debouncedFilterText, teamsUnreads });
	const hasTeams = allTeams.length > 0;
	const teamKeys = useMemo(() => allTeams.map(({ key }) => key), [allTeams]);
	const moveTeam = teamsPanelStore((state) => state.moveTeam);
	const listRef = useRef<HTMLDivElement>(null);

	// The moved team is rendered again at its new place, so focus would fall to the page; it goes back to its header.
	const handleMove = (key: string, direction: 'up' | 'down') => {
		moveTeam(teamKeys, key, direction);
		requestAnimationFrame(() =>
			listRef.current?.querySelector<HTMLElement>(`[data-team-key="${key}"] .rcx-sidebar-collapse-group__bar-button`)?.focus(),
		);
	};

	const openedRoom = useOpenedRoom() ?? '';
	const sidebarViewMode = useUserPreference<SidebarViewMode>('sidebarViewMode') || 'extended';
	const sidebarDisplayAvatar = !!useUserPreference<boolean>('sidebarDisplayAvatar');
	const bufferSize = sidebarRowHeight[sidebarViewMode] * SIDEBAR_VIRTUAL_BUFFER_ROWS;

	const itemData = useMemo(
		() => ({
			t,
			viewMode: sidebarViewMode,
			showAvatar: sidebarDisplayAvatar,
			openedRoom,
			isAnonymous: !userId,
			userId,
		}),
		[openedRoom, sidebarDisplayAvatar, sidebarViewMode, t, userId],
	);

	const virtualGroups = useMemo(
		() =>
			teams.map((team) => ({
				key: team.key,
				group: team,
				items: team.rooms,
			})),
		[teams],
	);

	const preventDefaultRef = usePreventDefault();
	const shortcutOpenMenuRef = useShortcutOpenMenu();
	const ref = useMergedRefsV2(preventDefaultRef, shortcutOpenMenuRef, listRef);

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} role='region' aria-label={t('Teams')}>
			<SidebarPanelHeader title={t('Teams')}>
				{hasTeams && (
					<IconButton
						icon='magnifier'
						small
						title={t('Search')}
						aria-label={t('Teams_panel_search_placeholder')}
						aria-expanded={searchOpen}
						aria-controls={searchId}
						pressed={searchOpen}
						onClick={toggleSearch}
					/>
				)}
				{/* The Inbox item in the rail is the way back to all rooms, so the header has no close button. */}
				{canCreateTeam && <IconButton icon='pencil-box' small title={t('Teams_New_Title')} onClick={() => createTeam()} />}
			</SidebarPanelHeader>
			{hasTeams && searchOpen && (
				<SidebarPanelSearch
					id={searchId}
					value={filterText}
					placeholder={t('Teams_panel_search_placeholder')}
					onChange={setFilterText}
					onClose={toggleSearch}
				/>
			)}
			{!hasTeams && <TeamsPanelEmpty />}
			{hasTeams && teams.length === 0 && (
				<Box paddingInline={16} paddingBlock={8} fontScale='p2' color='hint' role='status'>
					{t('No_results_found')}
				</Box>
			)}
			{teams.length > 0 && (
				<Box position='relative' overflow='hidden' flexGrow={1} minHeight={0} ref={ref} className={touchMenuStyle}>
					<SidebarVirtualList
						groups={virtualGroups}
						as={TeamsListWrapper}
						bufferSize={bufferSize}
						getItemKey={(item) => item._id}
						renderGroup={(team) => (
							<TeamsPanelCollapser
								team={team}
								// While searching, a team's neighbors may be hidden, so moving it is turned off.
								canMoveUp={!debouncedFilterText && teamKeys.indexOf(team.key) > 0}
								canMoveDown={!debouncedFilterText && teamKeys.indexOf(team.key) < teamKeys.length - 1}
								onMove={(direction) => handleMove(team.key, direction)}
								data-team-key={team.key}
								// While searching every matching team is shown expanded, so toggling would have no visible effect.
								onClick={() => !debouncedFilterText && toggleTeam(team.key)}
							/>
						)}
						renderItem={(item, _itemIndex, _team, _teamIndex, rowIndex) => (
							<RoomListRowWrapper data-index={rowIndex}>
								<RoomListRow data={itemData} item={item} />
							</RoomListRowWrapper>
						)}
					/>
				</Box>
			)}
		</Box>
	);
};

export default TeamsPanel;
