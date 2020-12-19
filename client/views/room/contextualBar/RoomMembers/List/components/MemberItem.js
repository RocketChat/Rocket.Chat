import React, { useState } from 'react';
import {
	Option,
	ActionButton,
	Menu,
} from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';


import { useUserInfoActions, useUserInfoActionsSpread } from '../../../../hooks/useUserInfoActions';
import UserAvatar from '../../../../../../components/avatar/UserAvatar';
import { ReactiveUserStatus } from '../../../../../../components/UserStatus';
import { usePreventProgation } from '../hooks/usePreventProgation';

const UserActions = ({ username, _id, rid }) => {
	const { menu: menuOptions } = useUserInfoActionsSpread(useUserInfoActions({ _id, username }, rid), 0);
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

export const MemberItem = ({ _id, status, name, username, onClickView, style, rid }) => {
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

MemberItem.Skeleton = Option.Skeleton;
