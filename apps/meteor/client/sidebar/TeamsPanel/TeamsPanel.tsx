import { Box, IconButton, SidepanelHeader, SidepanelHeaderActions, SidepanelHeaderTitle, SidepanelSearch } from '@rocket.chat/fuselage';
import { GenericNoResults, useMergedRefsV2, useShortTimeAgo } from '@rocket.chat/ui-client';
import { usePermission, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import TeamsListWrapper from './TeamsListWrapper';
import TeamsPanelCollapser from './TeamsPanelCollapser';
import TeamsPanelEmpty from './TeamsPanelEmpty';
import { useTeamSubscriptions, useTeamsList } from './hooks/useTeamsList';
import { teamsPanelStore } from './teamsPanelStore';
import type { RoomListItemViewMode } from '../../components/RoomListItem/RoomListItem';
import CreateTeamModal from '../../navbar/NavBarPagesGroup/actions/CreateTeamModalWithData';
import { useCreateRoomModal } from '../../navbar/NavBarPagesGroup/hooks/useCreateRoomModal';
import RoomListRow from '../RoomList/RoomListRow';
import RoomListRowWrapper from '../RoomList/RoomListRowWrapper';
import SidebarVirtualList from '../components/SidebarVirtualList';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';

const TeamsPanel = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const canCreateTeam = usePermission('create-team');
	const createTeam = useCreateRoomModal(CreateTeamModal);

	const searchId = useId();
	const searchButtonRef = useRef<HTMLButtonElement>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [filterText, setFilterText] = useState('');
	const filtering = Boolean(filterText.trim());

	const closeSearch = () => {
		setSearchOpen(false);
		setFilterText('');
		searchButtonRef.current?.focus();
	};

	const allTeams = useTeamSubscriptions();
	const expandedTeams = teamsPanelStore((state) => state.expandedTeams);
	const toggleTeam = teamsPanelStore((state) => state.toggleTeam);
	const teamsUnreads = teamsPanelStore((state) => state.teamsUnreads);
	const moveTeam = teamsPanelStore((state) => state.moveTeam);
	const teams = useTeamsList({ teams: allTeams, expandedTeams, filterText, teamsUnreads });
	const teamKeys = useMemo(() => allTeams.map(({ key }) => key), [allTeams]);
	const hasTeams = allTeams.length > 0;

	const formatTime = useShortTimeAgo();
	const sidebarViewMode = useUserPreference<RoomListItemViewMode>('sidebarViewMode') || 'extended';
	const sidebarDisplayAvatar = !!useUserPreference<boolean>('sidebarDisplayAvatar');

	const itemData = useMemo(
		() => ({
			t,
			viewMode: sidebarViewMode,
			showAvatar: sidebarDisplayAvatar,
			formatTime,
			isAnonymous: !userId,
			userId,
		}),
		[formatTime, sidebarDisplayAvatar, sidebarViewMode, t, userId],
	);

	const virtualGroups = useMemo(() => teams.map((team) => ({ key: team.key, group: team, items: team.rooms })), [teams]);

	const preventDefaultRef = usePreventDefault();
	const shortcutOpenMenuRef = useShortcutOpenMenu();
	const ref = useMergedRefsV2(preventDefaultRef, shortcutOpenMenuRef);

	return (
		<>
			<SidepanelHeader>
				<SidepanelHeaderTitle role='heading' aria-level={2}>
					{t('Teams')}
				</SidepanelHeaderTitle>
				<SidepanelHeaderActions>
					{hasTeams && (
						<IconButton
							ref={searchButtonRef}
							icon='magnifier'
							size='small'
							title={t('Search')}
							aria-label={t('Teams_panel_search')}
							aria-expanded={searchOpen}
							aria-controls={searchId}
							pressed={searchOpen}
							onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
						/>
					)}
					{canCreateTeam && <IconButton icon='pencil-box' size='small' title={t('Teams_New_Title')} onClick={createTeam} />}
				</SidepanelHeaderActions>
			</SidepanelHeader>
			{hasTeams && searchOpen && (
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
					placeholder={t('Teams_panel_search')}
					aria-label={t('Teams_panel_search')}
				/>
			)}
			{!hasTeams && <TeamsPanelEmpty />}
			{hasTeams && teams.length === 0 && <GenericNoResults />}
			{teams.length > 0 && (
				<Box position='relative' overflow='hidden' height='full' ref={ref}>
					<SidebarVirtualList
						groups={virtualGroups}
						as={TeamsListWrapper}
						getItemKey={(item) => item._id}
						renderGroup={(team) => (
							<TeamsPanelCollapser
								team={team}
								canMoveUp={!filtering && teamKeys.indexOf(team.key) > 0}
								canMoveDown={!filtering && teamKeys.indexOf(team.key) < teamKeys.length - 1}
								onMoveUp={() => moveTeam(teamKeys, team.key, 'up')}
								onMoveDown={() => moveTeam(teamKeys, team.key, 'down')}
								onToggle={() => !filtering && toggleTeam(team.key)}
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
		</>
	);
};

export default TeamsPanel;
