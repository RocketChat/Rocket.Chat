import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';

import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import UserCard from './UserCard';
import { Backdrop } from '../basic/Backdrop';
import * as UserStatus from '../basic/UserStatus';
import { LocalTime } from '../basic/UTCClock';

const UserCardWithData = ({ username, onClose, target, open }) => {
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
	}, [data, username, showRealNames]);


	const handleOpen = useCallback(
		(e) => {
			open && open(e);
			onClose && onClose();
		},
		[open, onClose],
	);

	return (<>
		<Backdrop bg='transparent' onClick={onClose}/>
		<PositionAnimated
			anchor={ref}
			placement='center right'
			visible={AnimatedVisibility.UNHIDING}
		>
			<UserCard {...user} onClose={onClose} open={handleOpen} t={t}/>
		</PositionAnimated></>
	);
};

export default UserCardWithData;
