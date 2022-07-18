import { ButtonGroup, Menu, Option } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import UserInfo from '..';
import { useActionSpread } from '../../../../hooks/useActionSpread';
import { useUserInfoActions } from '../../../hooks/useUserInfoActions';

const UserActions = ({ user, rid, backToList }) => {
	const { actions: actionsDefinition, menu: menuOptions } = useActionSpread(useUserInfoActions(user, rid, backToList));

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return (
			<Menu
				key='menu'
				mi='x4'
				secondary
				small={false}
				maxHeight='initial'
				renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
				flexShrink={0}
				options={menuOptions}
				data-qa='UserUserInfo-menu'
			/>
		);
	}, [menuOptions]);

	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]) => (
			<UserInfo.Action key={key} title={label} label={label} onClick={action} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<ButtonGroup mi='neg-x4' flexShrink={0} flexWrap='nowrap' withTruncatedText justifyContent='center' flexShrink={0}>
			{actions}
		</ButtonGroup>
	);
};

export default UserActions;
