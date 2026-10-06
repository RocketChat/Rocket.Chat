import type { IRoom } from '@rocket.chat/core-typings';
import {
	Icon,
	IconButton,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemIcon,
	ItemLink,
	ItemMedia,
	ItemTitle,
} from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE, UserAvatar } from '@rocket.chat/ui-avatar';
import type { MouseEvent } from 'react';

import UserActions from './RoomMembersActions';
import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import InvitationBadge from '../../../../components/InvitationBadge';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { useUserStatusTooltip } from '../../../../hooks/useUserStatusTooltip';
import { useDeferredMenuMount } from '../../../../sidebar/Item/useDeferredMenuMount';
import type { RoomMember } from '../../../hooks/useMembersList';

export type RoomMembersItemProps = Pick<RoomMember, 'federated' | 'username' | 'name' | '_id' | 'freeSwitchExtension' | 'subscription'> & {
	rid: IRoom['_id'];
	useRealName: boolean;
	reload: () => void;
	onClickView: (e: MouseEvent<HTMLElement>) => void;
};

const RoomMembersItem = ({
	_id,
	name,
	username,
	federated,
	freeSwitchExtension,
	onClickView,
	rid,
	subscription,
	reload,
	useRealName,
}: RoomMembersItemProps) => {
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();
	const isInvited = subscription?.status === 'INVITED';
	const invitationDate = isInvited ? subscription?.ts : undefined;
	const [nameOrUsername, displayUsername] = getUserDisplayNames(name, username, useRealName);

	const statusTooltipHandlers = useUserStatusTooltip(_id);

	return (
		<Item
			role='listitem'
			inset='lg'
			data-username={username}
			data-userid={_id}
			onFocus={mountNow}
			onPointerEnter={requestMount}
			{...statusTooltipHandlers}
		>
			<ItemMedia>
				<UserAvatar username={username || ''} size={ITEM_MEDIA_SIZE.medium} />
			</ItemMedia>
			<ItemIcon>{federated ? <Icon name='globe' size='x16' /> : <ReactiveUserStatus uid={_id} />}</ItemIcon>
			<ItemContent data-qa={`MemberItem-${username}`}>
				<ItemTitle>
					<ItemLink is='button' data-userid={_id} data-invitationdate={invitationDate} onClick={onClickView}>
						{nameOrUsername} {displayUsername && <ItemDescription inline>@{displayUsername}</ItemDescription>}
					</ItemLink>
				</ItemTitle>
			</ItemContent>
			{isInvited && <InvitationBadge size='x20' invitationDate={subscription.ts} />}
			<ItemActions reveal='hover'>
				{menuVisibility ? (
					<UserActions
						username={username}
						name={name}
						rid={rid}
						_id={_id}
						freeSwitchExtension={freeSwitchExtension}
						federated={federated}
						isInvited={isInvited}
						reload={reload}
					/>
				) : (
					<IconButton tiny icon='kebab' aria-hidden tabIndex={-1} onPointerDown={mountNow} />
				)}
			</ItemActions>
		</Item>
	);
};

export default RoomMembersItem;
