import { Option, OptionContent, ActionButton } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { ReactiveUserStatus } from '../../../../../../components/UserStatus';
import UserAvatar from '../../../../../../components/avatar/UserAvatar';
import { usePreventProgation } from '../../../../../../hooks/usePreventProgation';
import UserActions from './UserActions';

export const MemberItem = ({ _id, status, name, username, onClickView, style, rid, reload }) => {
	const [showButton, setShowButton] = useState();

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton,
	};

	const onClick = usePreventProgation();

	return (
		<Option id={_id} style={style} data-username={username} presence={status} onClick={onClickView} {...handleMenuEvent}>
			<Option.Avatar>
				<UserAvatar username={username} size='x28' />
			</Option.Avatar>
			<Option.Column>
				<ReactiveUserStatus uid={_id} />
			</Option.Column>
			<OptionContent data-qa={`MemberItem-${username}`}>
				{name} <Option.Description>({username})</Option.Description>
			</OptionContent>
			<Option.Menu onClick={onClick}>
				{showButton ? <UserActions username={username} rid={rid} _id={_id} reload={reload} /> : <ActionButton ghost tiny icon='kebab' />}
			</Option.Menu>
		</Option>
	);
};

MemberItem.Skeleton = Option.Skeleton;
