import React, { useMemo } from 'react';
import { ButtonGroup, Menu, Option } from '@rocket.chat/fuselage';

import { useUserInfoActions, useUserInfoActionsSpread } from '../../../hooks/useUserInfoActions';
import { UserInfo } from '..';


const UserActions = ({ user, rid }) => {
	const { actions: actionsDefinition, menu: menuOptions } = useUserInfoActionsSpread(useUserInfoActions(user, rid));

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return <Menu
			key='menu'
			mi='x4'
			ghost={false}
			small={false}
			renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
			flexShrink={0}
			options={menuOptions}
		/>;
	}, [menuOptions]);

	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]) =>
			<UserInfo.Action key={key} title={label} label={label} onClick={action} icon={icon}/>;

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return <ButtonGroup mi='neg-x4' flexShrink={0} flexWrap='nowrap' withTruncatedText justifyContent='center' flexShrink={0}>
		{actions}
	</ButtonGroup>;
};

export default UserActions;
