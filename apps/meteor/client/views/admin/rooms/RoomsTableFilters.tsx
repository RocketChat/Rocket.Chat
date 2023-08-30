import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect, useState } from 'react';
import type { Dispatch, ReactElement, SetStateAction } from 'react';

const roomTypeFilterStructure = [
	{
		id: 'filter_by_room',
		text: 'Filter_by_room',
		isGroupTitle: true,
	},
	{
		id: 'channels',
		text: 'Channels',
		checked: false,
	},
	{
		id: 'directMessages',
		text: 'Direct_Message',
		checked: false,
	},
	{
		id: 'discussions',
		text: 'Discussions',
		checked: false,
	},
	{
		id: 'omnichannel',
		text: 'Omnichannel',
		checked: false,
	},
	{
		id: 'teams',
		text: 'Teams',
		checked: false,
	},
] as OptionProp[];

const roomVisibilityFilterStructure = [
	{
		id: 'filter_by_visibility',
		text: 'Filter_by_visibility',
		isGroupTitle: true,
	},
	{
		id: 'private',
		text: 'Private',
		checked: false,
	},
	{
		id: 'public',
		text: 'Public',
		checked: false,
	},
] as OptionProp[];

const RoomsTableFilters = ({ setFilters }: { setFilters: Dispatch<SetStateAction<any>> }): ReactElement => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const [roomTypeOptions, setRoomTypeOptions] = useState<OptionProp[]>(roomTypeFilterStructure);
	const [roomVisibilityOptions, setRoomVisibilityOptions] = useState<OptionProp[]>(roomVisibilityFilterStructure);
	const [roomTypeSelectedOptions, setRoomTypeSelectedOptions] = useState<OptionProp[]>([]);
	const [roomVisibilitySelectedOptions, setRoomVisibilitySelectedOptions] = useState<OptionProp[]>([]);

	useEffect(() => {
		return setFilters({ searchText: text, types: roomTypeSelectedOptions, visibility: roomVisibilitySelectedOptions });
	}, [setFilters, roomTypeSelectedOptions, roomVisibilitySelectedOptions, text]);

	const handleSearchTextChange = useCallback((event) => setText(event.currentTarget.value), []);

	return (
		<Box
			is='form'
			onSubmit={useCallback((e) => e.preventDefault(), [])}
			mb='x8'
			display='flex'
			flexWrap='wrap'
			alignItems='center'
			justifyContent='center'
		>
			<Box minWidth='x224' display='flex' m='x4' flexGrow={2}>
				<TextInput
					alignItems='center'
					placeholder={t('Search_rooms')}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleSearchTextChange}
					value={text}
				/>
			</Box>
			<Box minWidth='x224' m='x4'>
				<MultiSelectCustom
					dropdownOptions={roomTypeOptions}
					defaultTitle={'All_rooms' as any}
					selectedOptionsTitle='Rooms'
					setSelectedOptions={setRoomTypeSelectedOptions}
					selectedOptions={roomTypeSelectedOptions}
					customSetSelected={setRoomTypeOptions}
				/>
			</Box>

			<Box minWidth='x224' m='x4'>
				<MultiSelectCustom
					dropdownOptions={roomVisibilityOptions}
					defaultTitle={'All_visible' as any}
					selectedOptionsTitle='Visible'
					setSelectedOptions={setRoomVisibilitySelectedOptions}
					selectedOptions={roomVisibilitySelectedOptions}
					customSetSelected={setRoomVisibilityOptions}
				/>
			</Box>
		</Box>
	);
};

export default RoomsTableFilters;
