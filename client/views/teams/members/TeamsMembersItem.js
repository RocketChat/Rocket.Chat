import React, { useState } from 'react';
import {
	Option,
	ActionButton,
	Menu,
} from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';

import { useUserInfoActions } from '../../room/hooks/useUserInfoActions';
import { useActionSpread } from '../../hooks/useActionSpread';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import { usePreventProgation } from '../../room/contextualBar/RoomMembers/List/hooks/usePreventProgation';

const UserActions = ({ username, _id, rid }) => {

	// const TeamMemberActions = {
	// 	changeLeader: { label: 'Set as leader', icon: 'shield-alt', action: () => 'test' },
	// 	changeModerator: { label: 'Set as moderator', icon: 'shield', action: () => 'test' },
	// 	changeOwner: { label: 'Set as owner', icon: 'shield-check', action: () => 'test' },
	// 	ignoreUser: { label: 'Ignore', icon: 'ban', action: () => 'test' },
	// 	muteUser: { label: 'Mute user', icon: 'mic-off', action: () => 'test' },
	// 	openDirectMessage: { label: 'Direct Message', icon: 'chat', action: () => 'test' },
	// 	removeUser: { label: 'Remove user', icon: 'sign-out', action: () => 'test' },
	// };

	const { menu: menuOptions } = useActionSpread(useUserInfoActions({ _id, username }, rid), 0);
	if (!menuOptions) {
		return null;
	}
	return <Menu
		flexShrink={0}
		key='menu'
		tiny
		renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
		options={menuOptions}
	/>;
};

export const TeamsMembersItem = ({ _id, status, name, username, onClickView, style, rid }) => {
	const [showButton, setShowButton] = useState();

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = { [isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton };

	const onClick = usePreventProgation();

	return (
		<Option
			id={_id}
			style={style}
			data-username={username}
			presence={status}
			onClick={onClickView}
			{ ...handleMenuEvent }
		>
			<Option.Avatar>
				<UserAvatar username={username} size='x28' />
			</Option.Avatar>
			<Option.Column><ReactiveUserStatus uid={_id} presence={status}/></Option.Column>
			<Option.Content>{name} <Option.Description>({username})</Option.Description></Option.Content>
			<Option.Menu onClick={onClick}>
				{showButton ? <UserActions username={username} rid={rid} _id={_id} /> : <ActionButton
					ghost
					tiny
					icon='kebab'
				/>}</Option.Menu></Option>
	);
};

TeamsMembersItem.Skeleton = Option.Skeleton;
