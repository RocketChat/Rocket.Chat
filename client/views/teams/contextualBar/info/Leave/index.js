import React, { useContext, useState, useEffect } from 'react';

import StepOne from './StepOne';
import StepTwo from './StepTwo';
import { useEndpoint } from '../../../../../contexts/ServerContext';
import { UserContext } from '../../../../../contexts/UserContext';
import LeaveTeamModal from './LeaveTeamModal';

const useJoinedRoomsWithLastOwner = (teamId) => {
	const [roomList, setRoomList] = useState([]);
	const { querySubscriptions } = useContext(UserContext);
	const listRooms = useEndpoint('GET', 'teams.listRooms');
	const getUsersInRole = useEndpoint('GET', 'roles.getUsersInRole');

	useEffect(() => {
		const getFinalRoomList = async () => {
			const { rooms } = await listRooms({ teamId });

			const rids = rooms.map(({ _id }) => _id);
			const query = {
				rid: {
					$in: rids,
				},
			};

			const subs = querySubscriptions(query, {}).getCurrentValue();

			const finalRooms = await Promise.all(subs.map(async (subscription) => {
				const { users, total } = await getUsersInRole({ role: 'owner', roomId: subscription.rid });
				const isLastOwner = total === 1 && users[0]._id === subscription.u._id;
				return { ...subscription, isLastOwner };
			}));

			setRoomList(finalRooms);
		};
		getFinalRoomList();
	}, [getUsersInRole, listRooms, querySubscriptions, teamId]);

	return roomList;
};

const LeaveTeamModalWithRooms = ({ teamId, onCancel, onConfirm }) => {
	const rooms = useJoinedRoomsWithLastOwner(teamId);

	return <LeaveTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={rooms} />;
};

export { StepOne, StepTwo };

export default LeaveTeamModalWithRooms;
