import { Option, Menu } from '@rocket.chat/fuselage';
import React from 'react';

import { useActionSpread } from '../../../../../hooks/useActionSpread';
import { useUserInfoActions } from '../../../../hooks/useUserInfoActions';

const UserActions = ({ username, _id, rid, reload }) => {
	const { menu: menuOptions } = useActionSpread(useUserInfoActions({ _id, username }, rid, reload), 0);
	if (!menuOptions) {
		return null;
	}
	return (
		<Menu
			flexShrink={0}
			maxHeight='initial'
			key='menu'
			tiny
			renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
			options={menuOptions}
		/>
	);
};

export default UserActions;
