import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import moment from 'moment';

import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useFormatTime } from '../../hooks/useFormatTime';
import { useSetting } from '../../contexts/SettingsContext';
import UserCard from './UserCard';
import { Backdrop } from '../basic/Backdrop';
import * as UserStatus from '../basic/UserStatus';

const LocalTime = React.memo(({ offset }) => {
	const [time, setTime] = useState(null);
	const format = useFormatTime();
	useEffect(() => {
		if (offset === undefined) {
			return;
		}
		setTime(moment().utcOffset(offset));

		const interval = setInterval(() => setTime(moment().utcOffset(offset)), 1000);
		return () => clearInterval(interval);
	}, [offset]);

	return `Local Time: ${ format(time) } (UTC ${ offset })`;
});

const UserCardWithData = ({ username, onClose, target, open }) => {
	const ref = useRef(target);

	const showRealNames = useSetting('UI_Use_Real_Name');

	const [query, setQuery] = useState(() => ({ username }));

	useEffect(() => setQuery({ username }), [username]);

	const { data, state, error } = useEndpointDataExperimental('users.info', query);

	ref.current = target;

	const user = useMemo(() => {
		const { user } = data || { user: {} };
		const { name = username, roles = [], status, statusText, bio, utcOffset } = user;
		return {
			name: showRealNames ? name : username,
			username,
			roles: roles.map((role, index) => (
				<UserCard.Role key={index}>{role}</UserCard.Role>
			)),
			bio,
			localTime: <LocalTime offset={utcOffset} />,
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
			<UserCard {...user} onClose={onClose} open={handleOpen} />
		</PositionAnimated></>
	);
};

export default UserCardWithData;
