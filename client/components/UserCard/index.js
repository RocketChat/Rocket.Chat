import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import moment from 'moment';

import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useFormatTime } from '../../hooks/useFormatTime';
import { useSetting } from '../../contexts/SettingsContext';
import UserCard from './UserCard';
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

export default ({ username, onClose, target }) => {
	const ref = useRef(target);

	const showRealNames = useSetting('UI_Use_Real_Name');

	const [query] = useState(() => ({ username }));

	const { data, state, error } = useEndpointDataExperimental('users.info', query);

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

	return (
		<PositionAnimated anchor={ref} placement='bottom right' visible={AnimatedVisibility.VISIBLE}>
			<UserCard {...user} onClose={onClose} />
		</PositionAnimated>
	);
};
