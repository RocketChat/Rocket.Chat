import React, { useMemo, useRef, useCallback } from 'react';
import { PositionAnimated, AnimatedVisibility, Menu, Option } from '@rocket.chat/fuselage';

import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import UserCard from '../../components/basic/UserCard';
import { Backdrop } from '../../components/basic/Backdrop';
import * as UserStatus from '../../components/basic/UserStatus';
import { LocalTime } from '../../components/basic/UTCClock';
import { useUserInfoActions, useUserInfoActionsSpread } from '../hooks/useUserInfoActions';

const UserCardWithData = ({ username, onClose, target, open, rid }) => {
	const ref = useRef(target);

	const t = useTranslation();

	const showRealNames = useSetting('UI_Use_Real_Name');

	const query = useMemo(() => ({ username }), [username]);

	const { data, state } = useEndpointDataExperimental('users.info', query);

	ref.current = target;

	const user = useMemo(() => {
		const loading = state === ENDPOINT_STATES.LOADING;
		const defaultValue = loading ? undefined : null;

		const { user } = data || { user: {} };

		const {
			name = username,
			roles = defaultValue,
			status,
			statusText = status,
			bio = defaultValue,
			utcOffset = defaultValue,
		} = user;

		return {
			name: showRealNames ? name : username,
			username,
			roles: roles && roles.map((role, index) => (
				<UserCard.Role key={index}>{role}</UserCard.Role>
			)),
			bio,
			localTime: Number.isInteger(utcOffset) && (
				<LocalTime utcOffset={utcOffset} />
			),
			status: UserStatus.getStatus(status),
			customStatus: statusText,
		};
	}, [data, username, showRealNames, state]);

	const handleOpen = useCallback(
		(e) => {
			open && open(e);
			onClose && onClose();
		},
		[open, onClose],
	);

	const { actions: actionsDefinition, menu: menuOptions } = useUserInfoActionsSpread(useUserInfoActions(user, rid));

	const menu = menuOptions && <Menu flexShrink={0} key='menu' renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />} options={menuOptions}/>;

	const actions = useMemo(() => [...actionsDefinition.map(([key, { label, icon, action }]) => <UserCard.Action key={key} aria-label={label} onClick={action} icon={icon}/>), menu].filter(Boolean), [actionsDefinition, menu]);

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
