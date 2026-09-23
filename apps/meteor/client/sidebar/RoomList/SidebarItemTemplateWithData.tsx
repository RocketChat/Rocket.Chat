import { Icon, SidebarAction, SidebarActions, SidebarItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { AllHTMLAttributes, ComponentType, ReactNode } from 'react';
import { memo, useMemo } from 'react';

import InvitationBadge from '../../components/InvitationBadge';
import { RoomIcon } from '../../components/RoomIcon';
import { isIOsDevice } from '../../lib/utils/isIOsDevice';
import OmnichannelBadges from '../../views/omnichannel/components/OmnichannelBadges';
import type { SidebarRoomAvatar } from '../Item/templates';
import RoomMenu from '../RoomMenu';
import SidebarItemBadges from '../badges/SidebarItemBadges';
import { useRoomListItem } from '../hooks/useRoomListItem';
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

	const {
		href,
		title,
		ariaLabel,
		dmStatusTooltipHandlers,
		isQueued,
		draftHint,
		messagePreviewHtml,
		unread: unreadInfo,
	} = useRoomListItem(room, { userId, t, extended });
	const { highlighted } = unreadInfo;

	const { lastMessage, unread = 0, alert, rid, t: type, cl } = room;

	const icon = (
		<SidebarItemIcon
			highlighted={highlighted}
			icon={<RoomIcon room={room} placement='sidebar' size='x20' isIncomingCall={Boolean(videoConfActions)} />}
		/>
	);

	const titleIcon = draftHint ? <Icon name='pencil' size='x12' title={draftHint} /> : undefined;

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

	const subtitle = messagePreviewHtml ? (
		<span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: messagePreviewHtml }} />
	) : null;

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
			aria-label={ariaLabel}
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
					unread={unreadInfo}
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
								threadUnread={unreadInfo.threads > 0}
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
