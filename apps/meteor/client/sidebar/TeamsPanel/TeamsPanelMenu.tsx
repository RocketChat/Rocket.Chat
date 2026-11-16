import { Menu, MenuItem, MenuSection, ToggleSwitch } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { GenericMenuItem, useHandleMenuAction } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { SidebarTeam } from './hooks/useTeamsList';
import { teamsPanelStore } from './teamsPanelStore';
import { usePreventPropagation } from '../../hooks/usePreventPropagation';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { useLeaveTeam } from '../../views/teams/contextualBar/info/useLeaveTeam';

type TeamsPanelMenuProps = {
	team: SidebarTeam;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
};

const TeamsPanelMenu = ({ team, canMoveUp, canMoveDown, onMoveUp, onMoveDown }: TeamsPanelMenuProps) => {
	const { t } = useTranslation();
	const [isOpen, toggleOpen] = useToggle(false);
	const close = () => toggleOpen(false);

	const { main, key: teamId, unreadOptions } = team;
	const leaveTeam = useLeaveTeam({ teamId });
	const setTeamUnreads = teamsPanelStore((state) => state.setTeamUnreads);
	const preventPropagation = usePreventPropagation();

	const openTab = (tab: string) => {
		close();
		roomCoordinator.openRouteLink(main.t, { rid: main.rid, name: main.name }, undefined, { routeParamsOverrides: { tab } });
	};

	const orderItems: GenericMenuItemProps[] = [
		{
			id: 'move-up',
			icon: 'arrow-up',
			content: t('Move_up'),
			disabled: !canMoveUp,
			onClick: () => {
				close();
				onMoveUp();
			},
		},
		{
			id: 'move-down',
			icon: 'arrow-down',
			content: t('Move_down'),
			disabled: !canMoveDown,
			onClick: () => {
				close();
				onMoveDown();
			},
		},
	];

	const viewItems: GenericMenuItemProps[] = [
		{ id: 'team-info', icon: 'info-circled', content: t('Teams_Info'), onClick: () => openTab('team-info') },
		{ id: 'members', icon: 'members', content: t('Members'), onClick: () => openTab('members-list') },
		{ id: 'channels', icon: 'hash', content: t('Channels'), onClick: () => openTab('team-channels') },
	];

	const unreadItems: GenericMenuItemProps[] = [
		{
			id: 'show-unreads',
			icon: 'flag',
			content: t('Always_display'),
			onClick: () => setTeamUnreads(teamId, 'showUnreads', !unreadOptions.showUnreads),
			addon: <ToggleSwitch checked={Boolean(unreadOptions.showUnreads)} onChange={() => undefined} onClick={preventPropagation} />,
		},
		{
			id: 'keep-unreads-on-top',
			icon: 'sort-amount-down',
			content: t('Keep_on_top'),
			onClick: () => setTeamUnreads(teamId, 'keepUnreadsOnTop', !unreadOptions.keepUnreadsOnTop),
			addon: <ToggleSwitch checked={Boolean(unreadOptions.keepUnreadsOnTop)} onChange={() => undefined} onClick={preventPropagation} />,
		},
	];

	const leaveItems: GenericMenuItemProps[] = [
		{
			id: 'leave',
			icon: 'sign-out',
			content: t('Leave'),
			onClick: () => {
				close();
				leaveTeam();
			},
		},
	];

	const allItems = [...orderItems, ...viewItems, ...unreadItems, ...leaveItems];
	const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = useHandleMenuAction(allItems);

	return (
		<Menu
			icon='kebab'
			title={t('Options')}
			size='mini'
			selectionMode='multiple'
			isOpen={isOpen}
			onOpenChange={toggleOpen}
			{...(disabledKeys.length ? { disabledKeys } : {})}
			onAction={handleAction}
		>
			{[
				<MenuSection key='main' aria-label={t('Options')} items={[...orderItems, ...viewItems]}>
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
				<MenuSection key='leave' aria-label={t('Leave')} items={leaveItems}>
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
