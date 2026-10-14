import type { IRoom } from '@rocket.chat/core-typings';
import { Menu, MenuItem, MenuItemContent, MenuItemIcon, MenuSection, MenuSubmenuTrigger } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { GenericMenuItem, useHandleMenuAction } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAtLeastOnePermission, usePermission, useSetModal, useUserRoom } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { SidebarTeam } from './hooks/useTeamsList';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import CreateChannelModal from '../../navbar/NavBarPagesGroup/actions/CreateChannelModal';
import { useDeleteRoom } from '../../views/hooks/roomActions/useDeleteRoom';
import AddExistingModal from '../../views/teams/contextualBar/channels/AddExistingModal';
import { useLeaveTeam } from '../../views/teams/contextualBar/info/useLeaveTeam';

const CREATE_TEAM_ROOM_PERMISSIONS = ['create-team-channel', 'create-team-group'];

type TeamsPanelMenuProps = {
	team: SidebarTeam;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMove: (direction: 'up' | 'down') => void;
};

/**
 * Shortcuts to a team's own surfaces from its section in the Teams panel. Everyone gets the views (info, members,
 * channels); editing and adding channels show only to who may do them, checked on the team's main room, where team
 * owners and moderators get their roles. Moving up and down comes first, as in the Inbox categories' menu, and
 * leaving and deleting come last, apart, as in the Team info menu.
 */
const TeamsPanelMenu = ({ team, canMoveUp, canMoveDown, onMove }: TeamsPanelMenuProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const [isOpen, toggleOpen] = useToggle(false);

	const { main, key: teamId, title } = team;
	const canEdit = usePermission('edit-team-channel', main.rid);
	const canCreateRoom = useAtLeastOnePermission(CREATE_TEAM_ROOM_PERMISSIONS, main.rid);
	const canAddExistingRoom = usePermission('move-room-to-team', main.rid);
	// The main room is in the client store, since the panel only lists teams the user is in.
	const room = useUserRoom(main.rid) ?? ({ _id: main.rid, t: main.t, name: main.name, teamId, teamMain: true } as IRoom);
	const { handleDelete, canDeleteRoom } = useDeleteRoom(room);
	const leaveTeam = useLeaveTeam(room);

	const close = () => toggleOpen(false);

	// The team's surfaces are contextual bar tabs of its main room.
	const openTab = (tab: string, context?: string) => {
		close();
		roomCoordinator.openRouteLink(main.t, { rid: main.rid, name: main.name }, undefined, {
			routeParamsOverrides: { tab, ...(context && { context }) },
		});
	};

	// Opens the modal once the menu has closed, so the modal returns focus to the menu button and not to a menu item
	// that no longer exists.
	const openModal = (modal: ReactElement) => {
		close();
		requestAnimationFrame(() => setModal(modal));
	};

	const closeModal = () => setModal(null);

	const orderItems: GenericMenuItemProps[] = [
		{
			id: 'move-up',
			icon: 'arrow-up',
			content: t('Move_up'),
			disabled: !canMoveUp,
			onClick: () => {
				close();
				onMove('up');
			},
		},
		{
			id: 'move-down',
			icon: 'arrow-down',
			content: t('Move_down'),
			disabled: !canMoveDown,
			onClick: () => {
				close();
				onMove('down');
			},
		},
	];

	const viewItems: GenericMenuItemProps[] = [
		{ id: 'team-info', icon: 'info-circled', content: t('Teams_Info'), onClick: () => openTab('team-info') },
		{ id: 'members', icon: 'members', content: t('Members'), onClick: () => openTab('members-list') },
		{ id: 'channels', icon: 'hash', content: t('Channels'), onClick: () => openTab('team-channels') },
	];

	const editItems: GenericMenuItemProps[] = canEdit
		? [{ id: 'edit', icon: 'edit', content: t('Edit'), onClick: () => openTab('team-info', 'edit') }]
		: [];

	const createRoom = () => openModal(<CreateChannelModal teamId={teamId} mainRoom={{ _id: main.rid }} onClose={closeModal} />);
	const addExistingRoom = () => openModal(<AddExistingModal teamId={teamId} onClose={closeModal} />);

	const addItems: GenericMenuItemProps[] = [
		...(canCreateRoom ? [{ id: 'create-channel', icon: 'hashtag' as const, content: t('Create_new'), onClick: createRoom }] : []),
		...(canAddExistingRoom
			? [{ id: 'add-existing-channel', icon: 'team-arrow-right' as const, content: t('Team_Add_existing'), onClick: addExistingRoom }]
			: []),
	];

	// With a single way to add a channel there is nothing to choose between, so it skips the submenu and says it in full.
	const singleAddItem: GenericMenuItemProps | undefined =
		addItems.length === 1
			? { ...addItems[0], content: addItems[0].id === 'create-channel' ? t('Create_channel') : t('Team_Add_existing_channels') }
			: undefined;

	const manageItems = [...editItems, ...(singleAddItem ? [singleAddItem] : [])];
	// The existing flows: leaving asks which of the team's channels to leave too, and handles the last owner; deleting
	// asks which channels to delete or keep, then confirms.
	const exitItems: GenericMenuItemProps[] = [
		{
			id: 'leave',
			icon: 'sign-out',
			content: t('Leave'),
			onClick: () => {
				close();
				requestAnimationFrame(leaveTeam);
			},
		},
		...(canDeleteRoom
			? [
					{
						id: 'delete',
						icon: 'trash' as const,
						content: t('Delete'),
						variant: 'danger',
						onClick: () => {
							close();
							requestAnimationFrame(handleDelete);
						},
					},
				]
			: []),
	];

	const allItems = [...orderItems, ...viewItems, ...manageItems, ...addItems, ...exitItems];
	const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = useHandleMenuAction(allItems);

	const hasManageSection = manageItems.length > 0 || addItems.length > 1;

	return (
		<Menu
			icon='kebab'
			title={t('Options')}
			aria-label={t('Teams_panel_team_options', { teamName: title })}
			mini
			isOpen={isOpen}
			onOpenChange={toggleOpen}
			{...(disabledKeys.length ? { disabledKeys } : {})}
			onAction={handleAction}
		>
			{[
				<MenuSection key='order' items={orderItems} aria-label={t('Teams_panel_team_order')}>
					{(item) => (
						<MenuItem key={item.id}>
							<GenericMenuItem {...item} />
						</MenuItem>
					)}
				</MenuSection>,
				<MenuSection key='view' items={viewItems} aria-label={t('Teams_panel_team_options', { teamName: title })}>
					{(item) => (
						<MenuItem key={item.id}>
							<GenericMenuItem {...item} />
						</MenuItem>
					)}
				</MenuSection>,
				...(hasManageSection
					? [
							<MenuSection key='manage' aria-label={t('Manage')}>
								<>
									{manageItems.map((item) => (
										<MenuItem key={item.id}>
											<GenericMenuItem {...item} />
										</MenuItem>
									))}
									{addItems.length > 1 && (
										<MenuSubmenuTrigger key='add-channel' textValue={t('Teams_panel_add_channel')}>
											<MenuItem aria-label={t('Teams_panel_add_channel')}>
												<MenuItemIcon name='plus' />
												<MenuItemContent>{t('Teams_panel_add_channel')}</MenuItemContent>
											</MenuItem>
											<MenuSection items={addItems}>
												{(item) => (
													<MenuItem key={item.id}>
														<GenericMenuItem {...item} />
													</MenuItem>
												)}
											</MenuSection>
										</MenuSubmenuTrigger>
									)}
								</>
							</MenuSection>,
						]
					: []),
				...(exitItems.length
					? [
							<MenuSection key='exit' items={exitItems} aria-label={t('Leave')}>
								{(item) => (
									<MenuItem key={item.id}>
										<GenericMenuItem {...item} />
									</MenuItem>
								)}
							</MenuSection>,
						]
					: []),
			]}
		</Menu>
	);
};

export default memo(TeamsPanelMenu);
