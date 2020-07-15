import React, { useMemo } from 'react';
import { ButtonGroup, Menu, Option } from '@rocket.chat/fuselage';

import UserInfo from '../../../components/basic/UserInfo';
import { useUserInfoActions, useUserInfoActionsSpread } from '../../hooks/useUserInfoActions';

const UserActions = ({ user, rid }) => {
	const { actions: actionsDefinition, menu: menuOptions } = useUserInfoActionsSpread(useUserInfoActions(user, rid));

	const menu = menuOptions && <Menu mi='x4' ghost={false} small={false} renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />} flexShrink={0} key='menu' options={menuOptions} />;

	const actions = useMemo(() => [...actionsDefinition.map(([key, { label, icon, action }]) => <UserInfo.Action key={key} title={label} label={label} onClick={action} icon={icon}/>), menu].filter(Boolean), [actionsDefinition, menu]);

	return <ButtonGroup mi='neg-x4' flexShrink={0} flexWrap='nowrap' withTruncatedText justifyContent='center' flexShrink={0}>
		{actions}
	</ButtonGroup>;
};

export default UserActions;
