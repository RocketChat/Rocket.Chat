import { AutoComplete, Box, Icon, Option, Options, Chip, AutoCompleteProps } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { IRoom } from '../../../../../definition/IRoom';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import { useEndpointData } from '../../../../hooks/useEndpointData';

type ChannelsInputProps = {
	value: unknown[];
	onChange: (value: unknown, action: 'remove' | undefined) => void;
};

type UsersAutoCompleteEndpoint = {
	params: {
		selector: string;
	};
	value: {
		items: IRoom[];
	};
};

type AutoCompleteValueProps = {
	_id: string;
	name: string;
	t: string;
}

const useChannelsAutoComplete = (term: string): AutoCompleteProps['options'] => {
	const params = useMemo<UsersAutoCompleteEndpoint['params']>(() => ({
		selector: JSON.stringify({ term }),
	}), [term]);
	const { value: data } = useEndpointData<UsersAutoCompleteEndpoint['value']>('rooms.autocomplete.channelAndPrivate', params);

	return useMemo<AutoCompleteProps['options']>(() => {
		if (!data) {
			return [];
		}

		return data.items.map((room) => ({
			label: room.name ?? '',
			value: room ?? '',
		})) || [];
	}, [data]);
};

const ChannelsInput: FC<ChannelsInputProps> = ({ onChange, ...props }) => {
	const [filter, setFilter] = useState('');
	const options = useChannelsAutoComplete(useDebouncedValue(filter, 1000));

	const onClickSelected = useCallback((e) => {
		e.stopPropagation();
		e.preventDefault();

		onChange(e.currentTarget.value, 'remove');
	}, [onChange]);

	const renderSelected = useCallback<FC<{ value?: AutoCompleteValueProps[] }>>(
		({ value: selected }) => <>
			{selected?.map(({ _id, name, t }) => <Chip key={_id} {...props} height='x20' value={_id} onClick={onClickSelected} mie='x4'>
				<Icon name={t === 'c' ? 'hash' : 'hashtag-lock'} size='x12' />
				<Box is='span' margin='none' mis='x4'>{name}</Box>
			</Chip>)}
		</>, [onClickSelected, props],
	);

	const renderItem = useCallback<FC<{ value: string }>>(
		({ value, ...props }) => <Option key={value} {...props} avatar={<RoomAvatar room={value} size={Options.AvatarSize} />} />, [],
	);

	return <AutoComplete
		{...props}
		filter={filter}
		options={options}
		renderSelected={renderSelected}
		renderItem={renderItem}
		setFilter={setFilter}
		onChange={onChange}
	/>;
};

export default memo(ChannelsInput);
