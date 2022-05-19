import { IRoom } from '@rocket.chat/core-typings';
import React, { useEffect, ReactElement } from 'react';

import { useVideoConfPopupDismiss } from '../../../../../contexts/VideoConfPopupContext';
import CallingPopup from './CallingPopup';
import ReceivingPopup from './ReceivingPopup';

export type TimedVideoConfPopupProps = {
	id: string;
	room: IRoom;
	position: number;
	current: number;
	total: number;
	onClose?: (id: string) => void;
};

const TimedVideoConfPopup = ({ id, room, position, current, total }: TimedVideoConfPopupProps): ReactElement => {
	const dismissPopup = useVideoConfPopupDismiss();
	const isIn = false;

	useEffect(() => {
		setTimeout(() => {
			dismissPopup(id);
		}, 30000);
	}, [dismissPopup, id]);

	if (isIn) {
		return <CallingPopup room={room} id={id} onClose={dismissPopup} />;
	}

	return <ReceivingPopup room={room} id={id} position={position} current={current} total={total} onClose={dismissPopup} />;
};

export default TimedVideoConfPopup;
