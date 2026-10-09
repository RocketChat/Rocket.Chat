import { Box, Icon, IconButton, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import TeamsListWrapper from './TeamsListWrapper';
import TeamsPanelCollapser from './TeamsPanelCollapser';
import TeamsPanelEmpty from './TeamsPanelEmpty';
import { useExpandedTeams } from './hooks/useExpandedTeams';
import { useTeamSubscriptions, useTeamsList } from './hooks/useTeamsList';
import { useTeamsPanel } from './hooks/useTeamsPanel';
import { useMergedRefsV2 } from '../../hooks/useMergedRefsV2';
import { useOpenedRoom } from '../../lib/RoomManager';
import RoomListRow from '../RoomList/RoomListRow';
import RoomListRowWrapper from '../RoomList/RoomListRowWrapper';
import SidebarPanelHeader from '../components/SidebarPanelHeader';
import SidebarVirtualList from '../components/SidebarVirtualList';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

type SidebarViewMode = 'extended' | 'medium' | 'condensed';

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
	const { close } = useTeamsPanel();

	const [searchOpen, setSearchOpen] = useState(false);
	const [filterText, setFilterText] = useState('');
	const debouncedFilterText = useDebouncedValue(filterText, 100);

	// Closing the search also clears it, so the panel goes back to the full list of teams.
	const toggleSearch = () => {
		setSearchOpen((open) => !open);
		setFilterText('');
	};

	const allTeams = useTeamSubscriptions();
	const { expandedTeams, toggleTeam, handleKeyDown } = useExpandedTeams(allTeams);
	const teams = useTeamsList({ teams: allTeams, expandedTeams, filterText: debouncedFilterText });
	const hasTeams = allTeams.length > 0;

	const avatarTemplate = useAvatarTemplate();
	const sideBarItemTemplate = useTemplateByViewMode();
	const openedRoom = useOpenedRoom() ?? '';
	const sidebarViewMode = useUserPreference<SidebarViewMode>('sidebarViewMode') || 'extended';
	const bufferSize = sidebarRowHeight[sidebarViewMode] * SIDEBAR_VIRTUAL_BUFFER_ROWS;

	const extended = sidebarViewMode === 'extended';
	const itemData = useMemo(
		() => ({
			extended,
			t,
			SidebarItemTemplate: sideBarItemTemplate,
			AvatarTemplate: avatarTemplate,
			openedRoom,
			sidebarViewMode,
			isAnonymous: !userId,
			userId,
		}),
		[avatarTemplate, extended, openedRoom, sideBarItemTemplate, sidebarViewMode, t, userId],
	);

	const virtualGroups = useMemo(
		() =>
			teams.map((team) => ({
				key: team.key,
				group: team,
				items: team.expanded ? team.rooms : [],
			})),
		[teams],
	);

	const preventDefaultRef = usePreventDefault();
	const shortcutOpenMenuRef = useShortcutOpenMenu();
	const ref = useMergedRefsV2(preventDefaultRef, shortcutOpenMenuRef);

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
				<IconButton icon='cross' small title={t('Close')} aria-label={t('Teams_panel_close')} onClick={close} />
			</SidebarPanelHeader>
			{hasTeams && searchOpen && (
				<Box paddingInline={16} paddingBlock={8}>
					<TextInput
						id={searchId}
						small
						autoFocus
						value={filterText}
						onChange={(event: ChangeEvent<HTMLInputElement>) => setFilterText(event.currentTarget.value)}
						onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => event.key === 'Escape' && toggleSearch()}
						placeholder={t('Teams_panel_search_placeholder')}
						aria-label={t('Teams_panel_search_placeholder')}
						endAddon={<Icon name='magnifier' size='x16' />}
					/>
				</Box>
			)}
			{!hasTeams && <TeamsPanelEmpty />}
			{hasTeams && teams.length === 0 && (
				<Box paddingInline={16} paddingBlock={8} fontScale='p2' color='hint' role='status'>
					{t('No_results_found')}
				</Box>
			)}
			{teams.length > 0 && (
				<Box position='relative' overflow='hidden' flexGrow={1} minHeight={0} ref={ref}>
					<SidebarVirtualList
						groups={virtualGroups}
						as={TeamsListWrapper}
						bufferSize={bufferSize}
						getItemKey={(item) => item._id}
						renderGroup={(team) => (
							<TeamsPanelCollapser
								team={team}
								// While searching every matching team is shown expanded, so toggling would have no visible effect.
								onClick={() => !debouncedFilterText && toggleTeam(team.key)}
								onKeyDown={(e) => !debouncedFilterText && handleKeyDown(e, team.key)}
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
