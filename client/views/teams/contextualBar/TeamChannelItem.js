import React, { useState } from 'react';
import { ActionButton, Icon, /* Menu,*/ Option } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';

// import { useUserInfoActions, useUserInfoActionsSpread } from '../../../hooks/useUserInfoActions';
import RoomAvatar from '../../../components/avatar/RoomAvatar';

// const UserActions = ({ room }) => {
// 	const { menu: menuOptions } = useUserInfoActionsSpread(useUserInfoActions({ _id, username }, rid), 0);
// 	if (!menuOptions) {
// 		return null;
// 	}
// 	return <Menu
// 		flexShrink={0}
// 		key='menu'
// 		tiny
// 		renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
// 		options={menuOptions}
// 	/>;
// };

export const TeamChannelItem = ({ room }) => {
	const [showButton, setShowButton] = useState();

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = { [isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton };

	return (
		<Option
			id={room._id}
			{ ...handleMenuEvent }
		>
			<Option.Avatar>
				<RoomAvatar room={room} size='x28' />
			</Option.Avatar>
			<Option.Column>{room.t === 'c' ? <Icon name='hash' size='x15'/> : <Icon name='hashtag-lock' size='x15'/>}</Option.Column>
			<Option.Content>
				<Option.Description>({room.name})</Option.Description>
			</Option.Content>
			<Option.Menu>
				{showButton ? /* <UserActions username={username} rid={rid} _id={_id} /> */ null : <ActionButton
					ghost
					tiny
					icon='kebab'
				/>}
			</Option.Menu>
		</Option>
	);
};

TeamChannelItem.Skeleton = Option.Skeleton;
