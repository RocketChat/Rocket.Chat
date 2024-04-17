import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect, type Dispatch, type MutableRefObject, type ReactElement, type SetStateAction } from 'react';

import type { SearchFilters } from './RoomsTable';

const roomTypeFilterStructure = [
	{
		id: 'filter_by_room',
		text: 'Filter_by_room',
		isGroupTitle: true,
	},
	{
		id: 'd',
		text: 'Direct_Message',
		checked: false,
	},
	{
		id: 'discussions',
		text: 'Discussions',
		checked: false,
	},
	{
		id: 'l',
		text: 'Omnichannel',
		checked: false,
	},
	{
		id: 'p',
		text: 'Private_Channels',
		checked: false,
	},
	{
		id: 'c',
		text: 'Public_Channels',
		checked: false,
	},
	{
		id: 'teams',
		text: 'Teams',
		checked: false,
	},
] as OptionProp[];

const RoomsTableFilters = ({
	setRoomSearchText,
	setRoomSearchTypes,
	prevRoomFilters,
}: {
	setRoomSearchText: Dispatch<SetStateAction<string>>;
	setRoomSearchTypes: Dispatch<SetStateAction<OptionProp[]>>;
	prevRoomFilters: MutableRefObject<SearchFilters>;
}): ReactElement => {
	const t = useTranslation();

	const handleSearchTextChange = useCallback(
		(event) => {
			const text = event.currentTarget.value;
			setRoomSearchText(text);
		},
		[setRoomSearchText],
	);

	const handleRoomTypeChange = useCallback(
		(options: OptionProp[]) => {
			setRoomSearchTypes(options);
		},
		[setRoomSearchTypes],
	) as Dispatch<SetStateAction<OptionProp[]>>;

	useEffect(() => {
		roomTypeFilterStructure.forEach((type, index) => {
			prevRoomFilters.current.types.forEach((selectedType) => {
				if (type.id === selectedType.id) {
					roomTypeFilterStructure[index] = selectedType;
				}
			});
		});
	}, [prevRoomFilters]);

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
					data-testid='AdminRoomSearchInput'
					name='search-rooms'
					alignItems='center'
					placeholder={t('Search_rooms')}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleSearchTextChange}
					value={prevRoomFilters.current.searchText}
				/>
			</Box>
			<Box minWidth='x224' m='x4' data-qa-id='AdminRoomDropdownInput' role='listbox' tabIndex={0}>
				<MultiSelectCustom
					dropdownOptions={roomTypeFilterStructure}
					defaultTitle={'All_rooms' as any}
					selectedOptionsTitle='Rooms'
					setSelectedOptions={handleRoomTypeChange}
					selectedOptions={prevRoomFilters.current.types}
				/>
			</Box>
		</Box>
	);
};

export default RoomsTableFilters;
