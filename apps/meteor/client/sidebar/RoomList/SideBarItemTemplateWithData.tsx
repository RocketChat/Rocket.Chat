import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isDirectMessageRoom, isMultipleDirectMessageRoom, isOmnichannelRoom, isVideoConfMessage } from '@rocket.chat/core-typings';
import { Badge, Sidebar, SidebarItemAction, SidebarItemActions, Margins } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import type { TFunction } from 'i18next';
import type { AllHTMLAttributes, ComponentType, ReactElement, ReactNode } from 'react';
import { memo, useMemo } from 'react';

import { normalizeSidebarMessage } from './normalizeSidebarMessage';
import { RoomIcon } from '../../components/RoomIcon';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { isIOsDevice } from '../../lib/utils/isIOsDevice';
import { useOmnichannelPriorities } from '../../views/omnichannel/hooks/useOmnichannelPriorities';
import RoomMenu from '../RoomMenu';
import OmnichannelBadges from '../badges/OmnichannelBadges';
import type { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

const getMessage = (room: IRoom, lastMessage: IMessage | undefined, t: TFunction): string | undefined => {
	if (!lastMessage) {
		return t('No_messages_yet');
	}
	if (isVideoConfMessage(lastMessage)) {
		return t('Call_started');
	}
	if (!lastMessage.u) {
		return normalizeSidebarMessage(lastMessage, t);
	}
	if (lastMessage.u?.username === room.u?.username) {
		return `${t('You')}: ${normalizeSidebarMessage(lastMessage, t)}`;
	}
	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room)) {
		return normalizeSidebarMessage(lastMessage, t);
	}
	return `${lastMessage.u.name || lastMessage.u.username}: ${normalizeSidebarMessage(lastMessage, t)}`;
};

type RoomListRowProps = {
	extended: boolean;
	t: TFunction;
	SideBarItemTemplate: ComponentType<
		{
			icon: ReactNode;
			title: ReactNode;
			avatar: ReactNode;
			actions: unknown;
			href: string;
			time?: Date;
			menu?: () => ReactNode;
			menuOptions?: unknown;
			subtitle?: ReactNode;
			titleIcon?: string;
			badges?: ReactNode;
			threadUnread?: boolean;
			unread?: boolean;
			selected?: boolean;
			is?: string;
		} & AllHTMLAttributes<HTMLElement>
	>;
	AvatarTemplate: ReturnType<typeof useAvatarTemplate>;
	openedRoom?: string;
	// sidebarViewMode: 'extended';
	isAnonymous?: boolean;

	room: ISubscription & IRoom;
	id?: string;
	/* @deprecated */
	style?: AllHTMLAttributes<HTMLElement>['style'];

	selected?: boolean;

	sidebarViewMode?: unknown;
	videoConfActions?: {
		[action: string]: () => void;
	};
};

function SideBarItemTemplateWithData({
	room,
	id,
	selected,
	style,
	extended,
	SideBarItemTemplate,
	AvatarTemplate,
	t,
	isAnonymous,
	videoConfActions,
}: RoomListRowProps): ReactElement {
	const { sidebar } = useLayout();

	const href = roomCoordinator.getRouteLink(room.t, room) || '';
	const title = roomCoordinator.getRoomName(room.t, room) || '';

	const { lastMessage, hideUnreadStatus, unread = 0, alert, rid, t: type, cl } = room;

	const { unreadCount, unreadTitle, showUnread, unreadVariant } = useUnreadDisplay(room);

	const highlighted = Boolean(!hideUnreadStatus && (alert || unread));
	const icon = (
		// TODO: Remove icon='at'
		<Sidebar.Item.Icon highlighted={highlighted} icon='at'>
			<RoomIcon room={room} placement='sidebar' isIncomingCall={Boolean(videoConfActions)} />
		</Sidebar.Item.Icon>
	);

	const actions = useMemo(
		() =>
			videoConfActions && (
				<SidebarItemActions>
					<SidebarItemAction onClick={videoConfActions.acceptCall} secondary success icon='phone' />
					<SidebarItemAction onClick={videoConfActions.rejectCall} secondary danger icon='phone-off' />
				</SidebarItemActions>
			),
		[videoConfActions],
	);

	const isQueued = isOmnichannelRoom(room) && room.status === 'queued';
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const message = extended && getMessage(room, lastMessage, t);
	const subtitle = message ? (
		<span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message) }} />
	) : null;

	const badges = (
		<Margins inlineStart={8}>
			{showUnread && (
				<Badge
					role='status'
					{...({ style: { display: 'inline-flex', flexShrink: 0 } } as any)}
					variant={unreadVariant}
					title={unreadTitle}
					aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title })}
				>
					<span aria-hidden>{unreadCount.total}</span>
				</Badge>
			)}
			{isOmnichannelRoom(room) && <OmnichannelBadges room={room} />}
		</Margins>
	);

	return (
		<SideBarItemTemplate
			is='a'
			id={id}
			data-qa='sidebar-item'
			data-unread={highlighted}
			unread={highlighted}
			selected={selected}
			href={href}
			onClick={(): void => {
				!selected && sidebar.toggle();
			}}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			title={title}
			time={lastMessage?.ts}
			subtitle={subtitle}
			icon={icon}
			style={style}
			badges={badges}
			avatar={AvatarTemplate && <AvatarTemplate {...room} />}
			actions={actions}
			menu={
				!isIOsDevice && !isAnonymous && (!isQueued || (isQueued && isPriorityEnabled))
					? (): ReactElement => (
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
		/>
	);
}

function safeDateNotEqualCheck(a: Date | string | undefined, b: Date | string | undefined): boolean {
	if (!a || !b) {
		return a !== b;
	}
	return new Date(a).toISOString() !== new Date(b).toISOString();
}

const keys: (keyof RoomListRowProps)[] = [
	'id',
	'style',
	'extended',
	'selected',
	'SideBarItemTemplate',
	'AvatarTemplate',
	't',
	'sidebarViewMode',
	'videoConfActions',
];

// eslint-disable-next-line react/no-multi-comp
export default memo(SideBarItemTemplateWithData, (prevProps, nextProps) => {
	if (keys.some((key) => prevProps[key] !== nextProps[key])) {
		return false;
	}

	if (prevProps.room === nextProps.room) {
		return true;
	}

	if (prevProps.room._id !== nextProps.room._id) {
		return false;
	}
	if (prevProps.room._updatedAt?.toISOString() !== nextProps.room._updatedAt?.toISOString()) {
		return false;
	}
	if (safeDateNotEqualCheck(prevProps.room.lastMessage?._updatedAt, nextProps.room.lastMessage?._updatedAt)) {
		return false;
	}
	if (prevProps.room.alert !== nextProps.room.alert) {
		return false;
	}
	if (isOmnichannelRoom(prevProps.room) && isOmnichannelRoom(nextProps.room) && prevProps.room?.v?.status !== nextProps.room?.v?.status) {
		return false;
	}
	if (prevProps.room.teamMain !== nextProps.room.teamMain) {
		return false;
	}

	if (
		isOmnichannelRoom(prevProps.room) &&
		isOmnichannelRoom(nextProps.room) &&
		prevProps.room.priorityWeight !== nextProps.room.priorityWeight
	) {
		return false;
	}

	return true;
});
