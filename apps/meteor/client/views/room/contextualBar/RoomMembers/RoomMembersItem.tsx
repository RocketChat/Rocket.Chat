import type { IRoom } from '@rocket.chat/core-typings';
import {
	Option,
	OptionAvatar,
	OptionColumn,
	OptionDescription,
	OptionMenu,
	OptionContent,
	Icon,
	IconButton,
	OptionSkeleton,
} from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement, MouseEvent } from 'react';
import { useState } from 'react';

import UserActions from './RoomMembersActions';
import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import InvitationBadge from '../../../../components/InvitationBadge';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { usePreventPropagation } from '../../../../hooks/usePreventPropagation';
import type { RoomMember } from '../../../hooks/useMembersList';

type RoomMembersItemProps = Pick<RoomMember, 'federated' | 'username' | 'name' | '_id' | 'freeSwitchExtension' | 'subscription'> & {
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
}: RoomMembersItemProps): ReactElement => {
	const [showButton, setShowButton] = useState();
	const isReduceMotionEnabled = usePrefersReducedMotion();
	const isInvited = subscription?.status === 'INVITED';
	const invitationDate = isInvited ? subscription?.ts : undefined;
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton,
	};

	const preventPropagation = usePreventPropagation();

	const [nameOrUsername, displayUsername] = getUserDisplayNames(name, username, useRealName);

	return (
		<Option
			data-username={username}
			data-userid={_id}
			data-invitationdate={invitationDate}
			onClick={onClickView}
			style={{ paddingInline: 24 }}
			{...handleMenuEvent}
		>
			<OptionAvatar>
				<UserAvatar username={username || ''} size='x28' />
			</OptionAvatar>
			<OptionColumn>{federated ? <Icon name='globe' size='x16' /> : <ReactiveUserStatus uid={_id} />}</OptionColumn>
			<OptionContent data-qa={`MemberItem-${username}`}>
				{nameOrUsername} {displayUsername && <OptionDescription>({displayUsername})</OptionDescription>}
			</OptionContent>
			{subscription?.status === 'INVITED' && (
				<OptionColumn>
					<InvitationBadge mbs={2} size='x20' invitationDate={subscription.ts} />
				</OptionColumn>
			)}
			<OptionMenu onClick={preventPropagation}>
				{showButton ? (
					<UserActions
						username={username}
						name={name}
						rid={rid}
						_id={_id}
						freeSwitchExtension={freeSwitchExtension}
						isInvited={isInvited}
						reload={reload}
					/>
				) : (
					<IconButton tiny icon='kebab' aria-hidden tabIndex={-1} />
				)}
			</OptionMenu>
		</Option>
	);
};

export default Object.assign(RoomMembersItem, {
	Skeleton: OptionSkeleton,
});
