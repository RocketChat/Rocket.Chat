import React, { FC, useCallback, useState } from 'react';

import { useEndpoint } from '../contexts/ServerContext';
import { TeamsContext } from '../contexts/TeamsContext';
import { IRoom } from '../../definition/IRoom';

const TeamsProvider: FC = ({ children }) => {
	const [rooms, updateRooms] = useState([] as IRoom[]);
	const [count, updateCount] = useState(0);
	const roomListEndpoint = useEndpoint('GET', 'teams.listRooms');

	const fetch = useCallback(async (teamId) => {
		const { rooms: roomsList, count } = await roomListEndpoint({ teamId });

		const roomsDated = roomsList.map((room) => {
			room._updatedAt = new Date(room._updatedAt);
			return { ...room };
		});

		updateRooms(roomsDated);
		updateCount(count);
	}, [roomListEndpoint]);

	const contextValue = {
		fetch,
		rooms,
		count,
	};

	return <TeamsContext.Provider
		children={children}
		value={contextValue}
	/>;
};

export default TeamsProvider;
