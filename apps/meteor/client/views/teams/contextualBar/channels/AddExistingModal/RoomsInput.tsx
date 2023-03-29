import { AutoComplete, Box, Icon, Option, Options, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import React, { memo, useState } from 'react';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { useRoomsAutoComplete } from './useRoomsAutoComplete';

type RoomsInputProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

const RoomsInput = ({ value, onChange, ...props }: RoomsInputProps) => {
	const [filter, setFilter] = useState('');
	const { options } = useRoomsAutoComplete(useDebouncedValue(filter, 1000));

	return (
		<AutoComplete
			{...props}
			multiple
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { value, label }, onRemove }) => (
				<Chip key={value} height='x20' value={value} onClick={onRemove} mie='x4'>
					<Icon name={label.type === 'c' ? 'hash' : 'hashtag-lock'} size='x12' />
					<Box is='span' margin='none' mis='x4'>
						{label.name}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }) => (
				<Option
					key={value}
					{...props}
					label={label.name}
					avatar={<RoomAvatar room={{ _id: value, type: label.type, avatarETag: label.avatarETag }} size={Options.AvatarSize} />}
				/>
			)}
			options={options}
		/>
	);
};

export default memo(RoomsInput);
