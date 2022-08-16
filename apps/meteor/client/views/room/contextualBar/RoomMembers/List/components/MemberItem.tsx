import { IRoom, IUser } from '@rocket.chat/core-typings';
import { Option, OptionAvatar, OptionColumn, OptionDescription, OptionMenu, OptionContent, Icon, IconButton } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useState, MouseEvent } from 'react';

import { ReactiveUserStatus } from '../../../../../../components/UserStatus';
import UserAvatar from '../../../../../../components/avatar/UserAvatar';
import { usePreventPropagation } from '../../../../../../hooks/usePreventPropagation';
import UserActions from './UserActions';

type MemberItemProps = {
	onClickView: (e: MouseEvent<HTMLDivElement>) => void;
	rid: IRoom['_id'];
	reload: () => void;
} & Pick<IUser, 'federated' | 'username' | 'name' | '_id'>;

export const MemberItem = ({ _id, name, username, federated, onClickView, rid, reload }: MemberItemProps): ReactElement => {
	const [showButton, setShowButton] = useState();

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton,
	};

	const preventPropagation = usePreventPropagation();

	return (
		<Option id={_id} data-username={username} onClick={onClickView} {...handleMenuEvent}>
			<OptionAvatar>
				<UserAvatar username={username || ''} size='x28' />
			</OptionAvatar>
			<OptionColumn>{federated ? <Icon name='globe' size='x16' /> : <ReactiveUserStatus uid={_id} />}</OptionColumn>
			<OptionContent data-qa={`MemberItem-${username}`}>
				{name} <OptionDescription>({username})</OptionDescription>
			</OptionContent>
			<OptionMenu onClick={preventPropagation}>
				{showButton ? <UserActions username={username} rid={rid} _id={_id} reload={reload} /> : <IconButton tiny icon='kebab' />}
			</OptionMenu>
		</Option>
	);
};

MemberItem.Skeleton = Option.Skeleton;
