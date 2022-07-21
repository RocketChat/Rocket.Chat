import { IRoom, IUser } from '@rocket.chat/core-typings';
import { ButtonGroup, Menu, Option } from '@rocket.chat/fuselage';
import React, { useMemo, ReactElement } from 'react';

import UserInfo from '../../../../components/UserInfo';
import { useActionSpread } from '../../../hooks/useActionSpread';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type UserInfoActionsProps = {
	user: Pick<IUser, '_id' | 'username'>;
	rid: IRoom['_id'];
	backToList: () => void;
};

const UserInfoActions = ({ user, rid, backToList }: UserInfoActionsProps): ReactElement => {
	const { actions: actionsDefinition, menu: menuOptions } = useActionSpread(
		useUserInfoActions({ _id: user._id, username: user.username }, rid, backToList),
	);

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
				renderItem={({ label: { label, icon }, ...props }): ReactElement => <Option {...props} label={label} icon={icon} />}
				flexShrink={0}
				options={menuOptions}
				data-qa='UserUserInfo-menu'
			/>
		);
	}, [menuOptions]);

	// TODO: sanitize Action type to avoid any
	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]: any): ReactElement => (
			<UserInfo.Action key={key} title={label} label={label} onClick={action} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<ButtonGroup mi='neg-x4' flexShrink={0} flexWrap='nowrap' withTruncatedText justifyContent='center'>
			{actions}
		</ButtonGroup>
	);
};

export default UserInfoActions;
