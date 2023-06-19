import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import React, { memo, useMemo, useState } from 'react';

import RoomAvatar from '../../../../../../client/components/avatar/RoomAvatar';

type RoomAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

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

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { value, label } }) => (
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
			options={options}
		/>
	);
};

export default memo(RoomAutoComplete);
