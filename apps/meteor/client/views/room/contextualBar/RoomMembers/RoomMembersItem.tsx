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
import { useDeferredMenuMount } from '@rocket.chat/ui-client';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import UserActions from './RoomMembersActions';
import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import InvitationBadge from '../../../../components/InvitationBadge';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { STATUS_LABEL_KEYS } from '../../../../components/UserStatusText';
import { useUserStatusTooltip } from '../../../../hooks/useUserStatusTooltip';
import type { RoomMember } from '../../../hooks/useMembersList';

export type RoomMembersItemProps = Pick<RoomMember, 'federated' | 'username' | 'name' | '_id' | 'sipExtension' | 'subscription'> & {
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
	sipExtension,
	onClickView,
	rid,
	subscription,
	reload,
	useRealName,
}: RoomMembersItemProps) => {
	const { t } = useTranslation();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();
	const status = useUserPresence(_id)?.status;
	const statusLabel = federated ? t('Federated') : status && t(STATUS_LABEL_KEYS[status]);
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
			<ItemIcon label={statusLabel}>{federated ? <Icon name='globe' size='x16' /> : <ReactiveUserStatus uid={_id} />}</ItemIcon>
			<ItemContent data-qa={`MemberItem-${username}`}>
				<ItemTitle>
					<ItemLink is='button' data-userid={_id} data-invitationdate={invitationDate} onClick={onClickView}>
						{nameOrUsername} {displayUsername && <ItemDescription inline>@{displayUsername}</ItemDescription>}
					</ItemLink>
				</ItemTitle>
			</ItemContent>
			{invitationDate && <InvitationBadge size='x20' invitationDate={invitationDate} />}
			<ItemActions reveal='hover'>
				{menuVisibility ? (
					<UserActions
						username={username}
						name={name}
						rid={rid}
						_id={_id}
						sipExtension={sipExtension}
						federated={federated}
						isInvited={isInvited}
						reload={reload}
					/>
				) : (
					<IconButton size='tiny' icon='kebab' aria-hidden tabIndex={-1} onPointerDown={mountNow} />
				)}
			</ItemActions>
		</Item>
	);
};

export default RoomMembersItem;
