import { Option, Menu, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { usePermission } from '../../../../../../contexts/AuthorizationContext';
import { useActionSpread } from '../../../../../hooks/useActionSpread';
import { useUserInfoActions } from '../../../../hooks/useUserInfoActions';

const UserActions = ({ username, _id, rid, reload }) => {
	const { menu: menuOptions } = useActionSpread(useUserInfoActions({ _id, username }, rid, reload), 0);
	const userCanRemove = usePermission('remove-user', rid);

	if (!menuOptions) {
		return null;
	}

	return (
		<div style={{ display: 'flex', alignItems: 'center' }}>
			{userCanRemove && (
				<Icon
					label={menuOptions.removeUser.label.label.props.children}
					onClick={menuOptions.removeUser.action}
					name='sign-out'
					size='x16'
					color={'danger'}
				/>
			)}
			<Menu
				flexShrink={0}
				key='menu'
				tiny
				renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
				options={menuOptions}
			/>
		</div>
	);
};

export default UserActions;
