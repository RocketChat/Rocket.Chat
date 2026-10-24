import type { IRoom } from '@rocket.chat/core-typings';
import { Menu, MenuItem, MenuSection, ToggleSwitch } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { GenericMenuItem, useHandleMenuAction } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { SidebarTeam } from './hooks/useTeamsList';
import { teamsPanelStore } from './teamsPanelStore';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { useLeaveTeam } from '../../views/teams/contextualBar/info/useLeaveTeam';

type TeamsPanelMenuProps = {
	team: SidebarTeam;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMove: (direction: 'up' | 'down') => void;
};

/**
 * Shortcuts to a team's own surfaces from its section in the Teams panel: its info, members and channels. Moving up
 * and down comes first, as in the Inbox categories' menu, and leaving comes last, apart, as in the Team info menu. The
 * Unreads options are those of Inbox categories.
 */
const TeamsPanelMenu = ({ team, canMoveUp, canMoveDown, onMove }: TeamsPanelMenuProps) => {
	const { t } = useTranslation();
	const [isOpen, toggleOpen] = useToggle(false);

	const { main, key: teamId, title } = team;
	// The main room is in the client store, since the panel only lists teams the user is in.
	const room = useUserRoom(main.rid) ?? ({ _id: main.rid, t: main.t, name: main.name, teamId, teamMain: true } as IRoom);
	const leaveTeam = useLeaveTeam(room);
	const setTeamUnreads = teamsPanelStore((state) => state.setTeamUnreads);
	const unreadsChanging = useRef(false);

	const close = () => toggleOpen(false);

	// The team's surfaces are contextual bar tabs of its main room.
	const openTab = (tab: string) => {
		close();
		roomCoordinator.openRouteLink(main.t, { rid: main.rid, name: main.name }, undefined, {
			routeParamsOverrides: { tab },
		});
	};

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

	// Toggles keep the menu open, as in the Inbox categories' menu. A mouse click on a checkbox item reaches the action
	// twice, and the option is saved at once, so a repeat within the same frame is ignored.
	const changeUnreads = (option: 'showUnreads' | 'keepUnreadsOnTop') => {
		if (unreadsChanging.current) {
			return;
		}

		unreadsChanging.current = true;
		setTeamUnreads(teamId, option, !team.unreadOptions[option]);
		requestAnimationFrame(() => {
			unreadsChanging.current = false;
		});
	};

	const unreadItems: GenericMenuItemProps[] = [
		{
			id: 'show-unreads',
			icon: 'flag',
			content: t('Always_display'),
			onClick: () => changeUnreads('showUnreads'),
			addon: <ToggleSwitch checked={Boolean(team.unreadOptions.showUnreads)} onChange={() => undefined} />,
		},
		{
			id: 'keep-unreads-on-top',
			icon: 'sort-amount-down',
			content: t('Keep_on_top'),
			onClick: () => changeUnreads('keepUnreadsOnTop'),
			addon: <ToggleSwitch checked={Boolean(team.unreadOptions.keepUnreadsOnTop)} onChange={() => undefined} />,
		},
	];

	// The existing flow: it asks which of the team's channels to leave too, and handles the last owner.
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
	];

	const allItems = [...orderItems, ...viewItems, ...unreadItems, ...exitItems];
	const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = useHandleMenuAction(allItems);

	return (
		<Menu
			icon='kebab'
			title={t('Options')}
			aria-label={t('Teams_panel_team_options', { teamName: title })}
			mini
			selectionMode='multiple'
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
				<MenuSection key='unreads' title={t('Unreads')} items={unreadItems}>
					{(item) => (
						<MenuItem key={item.id}>
							<GenericMenuItem {...item} />
						</MenuItem>
					)}
				</MenuSection>,
				<MenuSection key='exit' items={exitItems} aria-label={t('Leave')}>
					{(item) => (
						<MenuItem key={item.id}>
							<GenericMenuItem {...item} />
						</MenuItem>
					)}
				</MenuSection>,
			]}
		</Menu>
	);
};

export default memo(TeamsPanelMenu);
