import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon, SidebarAction, SidebarActions, SidebarItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { AllHTMLAttributes, ComponentType, ReactNode } from 'react';
import { memo, useMemo } from 'react';

import InvitationBadge from '../../components/InvitationBadge';
import { RoomIcon } from '../../components/RoomIcon';
import { useUserStatusTooltip } from '../../hooks/useUserStatusTooltip';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { getSubscriptionDraft } from '../../lib/utils/getSubscriptionDraft';
import { getUidDirectMessage } from '../../lib/utils/getUidDirectMessage';
import { isIOsDevice } from '../../lib/utils/isIOsDevice';
import { getMessagePreview } from '../../lib/utils/normalizeMessagePreview/getMessagePreview';
import OmnichannelBadges from '../../views/omnichannel/components/OmnichannelBadges';
import RoomMenu from '../RoomMenu';
import SidebarItemBadges from '../badges/SidebarItemBadges';
import type { SidebarRoomAvatar } from '../hooks/useSidebarPresentation';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';
import { hasRoomChanged } from '../lib/sidebarRowChanges';

type RoomListRowProps = {
	extended: boolean;
	t: TFunction;
	SidebarItemTemplate: ComponentType<
		{
			icon: ReactNode;
			title: ReactNode;
			avatar: ReactNode;
			actions: ReactNode;
			href: string;
			timeLabel?: string;
			menu?: () => ReactNode;
			menuOptions?: unknown;
			subtitle?: ReactNode;
			titleIcon?: ReactNode;
			badges?: ReactNode;
			threadUnread?: boolean;
			unread?: boolean;
			selected?: boolean;
			is?: string;
		} & AllHTMLAttributes<HTMLElement>
	>;
	AvatarTemplate: SidebarRoomAvatar | null;
	formatTime: (time: string | Date | number) => string;
	isPriorityEnabled: boolean;
	openedRoom?: string;
	// sidebarViewMode: 'extended';
	isAnonymous?: boolean;
	userId?: string;

	room: SubscriptionWithRoom;
	id?: string;
	/* @deprecated */
	style?: AllHTMLAttributes<HTMLElement>['style'];

	selected?: boolean;

	sidebarViewMode?: unknown;
	videoConfActions?: {
		[action: string]: () => void;
	};
};

const SidebarItemTemplateWithData = ({
	room,
	id,
	selected,
	style,
	extended,
	SidebarItemTemplate,
	AvatarTemplate,
	t,
	isAnonymous,
	videoConfActions,
	userId,
	formatTime,
	isPriorityEnabled,
}: RoomListRowProps) => {
	const { sidebar } = useLayout();

	const href = roomCoordinator.getRouteLink(room.t, room) || '';
	const title = roomCoordinator.getRoomName(room.t, room) || '';

	const dmUserId = getUidDirectMessage(room, userId);
	const dmStatusTooltipHandlers = useUserStatusTooltip(dmUserId, title);

	const { unreadTitle, showUnread, unreadCount, highlightUnread: highlighted } = useUnreadDisplay(room);

	const { lastMessage, unread = 0, alert, rid, t: type, cl } = room;

	const icon = (
		<SidebarItemIcon
			highlighted={highlighted}
			icon={<RoomIcon room={room} placement='sidebar' size='x20' isIncomingCall={Boolean(videoConfActions)} />}
		/>
	);

	const titleIcon = getSubscriptionDraft(room) ? (
		<Icon name='pencil' size='x12' title={room.draft ? t('Unfinished_message') : t('Unfinished_thread_message')} />
	) : undefined;

	const actions = useMemo(
		() =>
			videoConfActions && (
				<SidebarActions>
					<SidebarAction onClick={videoConfActions.acceptCall} mini secondary success icon='phone' />
					<SidebarAction onClick={videoConfActions.rejectCall} mini secondary danger icon='phone-off' />
				</SidebarActions>
			),
		[videoConfActions],
	);

	const isQueued = isOmnichannelRoom(room) && room.status === 'queued';

	const message = extended && getMessagePreview(room, lastMessage, t);
	const subtitle = message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }} /> : null;

	return (
		<SidebarItemTemplate
			is='a'
			id={id}
			data-unread={highlighted}
			unread={highlighted}
			selected={selected}
			aria-current={selected ? 'page' : undefined}
			href={href}
			onClick={(): void => {
				if (!selected) sidebar.toggle();
			}}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			title={title}
			timeLabel={lastMessage?.ts ? formatTime(lastMessage.ts) : undefined}
			subtitle={subtitle}
			icon={icon}
			titleIcon={titleIcon}
			style={style}
			badges={
				<SidebarItemBadges
					room={room}
					roomTitle={title}
					renderOmnichannelBadges={(room) => <OmnichannelBadges room={room} />}
					renderInvitationBadge={(invitationDate) => <InvitationBadge marginBlockStart={2} invitationDate={invitationDate} />}
				/>
			}
			avatar={AvatarTemplate && <AvatarTemplate {...room} />}
			actions={actions}
			menu={
				!isIOsDevice && !isAnonymous && (!isQueued || (isQueued && isPriorityEnabled))
					? () => (
							<RoomMenu
								alert={alert}
								threadUnread={unreadCount.threads > 0}
								rid={rid}
								unread={!!unread}
								roomOpen={selected}
								type={type}
								cl={cl}
								name={title}
								hideDefaultOptions={isQueued}
							/>
						)
					: undefined
			}
			{...dmStatusTooltipHandlers}
		/>
	);
};

const keys: (keyof RoomListRowProps)[] = [
	'id',
	'style',
	'extended',
	'selected',
	'SidebarItemTemplate',
	'AvatarTemplate',
	't',
	'sidebarViewMode',
	'videoConfActions',
	'formatTime',
	'isPriorityEnabled',
];

export default memo(
	SidebarItemTemplateWithData,
	(prevProps, nextProps) => !keys.some((key) => prevProps[key] !== nextProps[key]) && !hasRoomChanged(prevProps.room, nextProps.room),
);
