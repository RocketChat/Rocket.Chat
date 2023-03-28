import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import type { AutoCompleteProps } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

// TODO: Make AutoComplete accept arbitrary kinds of values
export const useRoomsAutoComplete = (
	name: string,
): {
	options: AutoCompleteProps['options'];
} => {
	const params = useMemo(
		() => ({
			name,
		}),
		[name],
	);
	const { value: data } = useEndpointData('/v1/rooms.autocomplete.availableForTeams', { params });

	const options = useMemo<AutoCompleteProps['options']>(() => {
		if (!data) {
			return [];
		}

		return data.items.map((room: Serialized<IRoom>) => ({
			value: room._id,
			label: {
				name: roomCoordinator.getRoomName(room.t, { _id: room._id, name: room.name, fname: room.fname, prid: room.prid }),
				type: room.t,
				avatarETag: room.avatarETag,
			},
		}));
	}, [data]);

	return {
		options,
	};
};
