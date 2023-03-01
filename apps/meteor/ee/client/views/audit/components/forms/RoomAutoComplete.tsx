import type { IRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import React, { memo, useMemo, useState } from 'react';

import RoomAvatar from '../../../../../../client/components/avatar/RoomAvatar';

type RoomAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'onChange' | 'filter' | 'setFilter'> & {
	value: IRoom['_id'] | undefined;
	onChange: (value: IRoom['_id'] | undefined) => void;
};

const RoomAutoComplete = ({ value, onChange, ...props }: RoomAutoCompleteProps) => {
	const [filter, setFilter] = useState('');

	const performRoomSearch = useEndpoint('GET', '/v1/rooms.autocomplete.adminRooms');

	const roomAutocompleteQueryResult = useQuery(['audit', 'rooms', filter], () =>
		performRoomSearch({ selector: JSON.stringify({ name: filter ?? '' }) }),
	);

	const options = useMemo(
		() =>
			roomAutocompleteQueryResult.data?.items.map(({ name, _id, fname, avatarETag, t }) => ({
				value: _id,
				label: { name: fname || name, avatarETag, type: t },
			})) ?? [],
		[roomAutocompleteQueryResult.data],
	);

	const handleChange = useMutableCallback((value: unknown, action: 'remove' | undefined) => {
		if (action === 'remove') {
			onChange(undefined);
			return;
		}

		onChange(value as IRoom['_id']);
	});

	return (
		<AutoComplete
			{...props}
			value={value as any} // TODO: ????
			onChange={handleChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value, label }) => (
				<Option key={value} label={label.name} avatar={<RoomAvatar size={Options.AvatarSize} room={{ _id: value, ...label }} />} />
			)}
			renderItem={({ value, label, ...props }) => (
				<Option
					key={value}
					{...props}
					label={label.name}
					avatar={<RoomAvatar size={Options.AvatarSize} room={{ _id: value, ...label }} />}
				/>
			)}
			options={options as any}
		/>
	);
};

export default memo(RoomAutoComplete);
