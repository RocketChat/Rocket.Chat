import React, { useEffect, useMemo, useRef } from 'react';
import { PositionAnimated, AnimatedVisibility, Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import UserCard from '../../components/basic/UserCard';
import { Backdrop } from '../../components/basic/Backdrop';
import * as UserStatus from '../../components/basic/UserStatus';
import { LocalTime } from '../../components/basic/UTCClock';
import { useUserInfoActions, useUserInfoActionsSpread } from '../hooks/useUserInfoActions';
import { useCurrentRoute } from '../../contexts/RouterContext';

export const useComponentDidUpdate = (
	effect,
	dependencies = [],
) => {
	const hasMounted = useRef(false);
	useEffect(() => {
		if (!hasMounted.current) {
			hasMounted.current = true;
			return;
		}
		effect();
	}, dependencies);
};

const UserCardWithData = ({ username, onClose, target, open, rid }) => {
	const ref = useRef(target);

	const t = useTranslation();

	const showRealNames = useSetting('UI_Use_Real_Name');

	const query = useMemo(() => ({ username }), [username]);

	const { data, state } = useEndpointDataExperimental('users.info', query);

	ref.current = target;

	const [route, params] = useCurrentRoute();

	useComponentDidUpdate(() => {
		onClose && onClose();
	}, [route, JSON.stringify(params), onClose]);

	const user = useMemo(() => {
		const loading = state === ENDPOINT_STATES.LOADING;
		const defaultValue = loading ? undefined : null;

		const { user } = data || { user: {} };

		const {
			_id,
			name = username,
			roles = defaultValue,
			status,
			statusText = status,
			bio = defaultValue,
			utcOffset = defaultValue,
			nickname,
			avatarETag,
		} = user;

		return {
			_id,
			name: showRealNames ? name : username,
			username,
			roles: roles && roles.map((role, index) => (
				<UserCard.Role key={index}>{role}</UserCard.Role>
			)),
			bio,
			etag: avatarETag,
			localTime: Number.isInteger(utcOffset) && (
				<LocalTime utcOffset={utcOffset} />
			),
			status: UserStatus.getStatus(status),
			customStatus: statusText,
			nickname,
		};
	}, [data, username, showRealNames, state]);

	const handleOpen = useMutableCallback((e) => {
		open && open(e);
		onClose && onClose();
	});

	const { actions: actionsDefinition, menu: menuOptions } = useUserInfoActionsSpread(useUserInfoActions(user, rid));

	const menu = menuOptions && <Menu flexShrink={0} mi='x2' key='menu' ghost={false} renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />} options={menuOptions}/>;

	const actions = useMemo(() => [...actionsDefinition.map(([key, { label, icon, action }]) => <UserCard.Action key={key} title={label} aria-label={label} onClick={action} icon={icon}/>), menu].filter(Boolean), [actionsDefinition, menu]);

	return (<>
		<Backdrop bg='transparent' onClick={onClose}/>
		<PositionAnimated
			anchor={ref}
			placement='top-start'
			margin={8}
			visible={AnimatedVisibility.UNHIDING}
		>
			<UserCard
				{...user}
				onClose={onClose}
				open={handleOpen}
				actions={actions}
				t={t}/>
		</PositionAnimated></>
	);
};

export default UserCardWithData;
