import { Box, IconButton, SidepanelHeader, SidepanelHeaderActions, SidepanelHeaderTitle } from '@rocket.chat/fuselage';
import { useMergedRefsV2, useShortTimeAgo } from '@rocket.chat/ui-client';
import { usePermission, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
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

	const allTeams = useTeamSubscriptions();
	const expandedTeams = teamsPanelStore((state) => state.expandedTeams);
	const toggleTeam = teamsPanelStore((state) => state.toggleTeam);
	const teams = useTeamsList({ teams: allTeams, expandedTeams });

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
					{canCreateTeam && <IconButton icon='pencil-box' size='small' title={t('Teams_New_Title')} onClick={createTeam} />}
				</SidepanelHeaderActions>
			</SidepanelHeader>
			{teams.length === 0 ? (
				<TeamsPanelEmpty />
			) : (
				<Box position='relative' overflow='hidden' height='full' ref={ref}>
					<SidebarVirtualList
						groups={virtualGroups}
						as={TeamsListWrapper}
						getItemKey={(item) => item._id}
						renderGroup={(team) => <TeamsPanelCollapser team={team} onToggle={() => toggleTeam(team.key)} />}
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
