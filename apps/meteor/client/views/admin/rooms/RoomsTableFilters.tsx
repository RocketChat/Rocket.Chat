import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterBar, FilterBarFilters, FilterBarSearch } from '../../../components/FilterBar';

const initialRoomTypeFilterStructure = [
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

export type RoomsTableFiltersProps = { setFilters: Dispatch<SetStateAction<any>> };

const RoomsTableFilters = ({ setFilters }: RoomsTableFiltersProps) => {
	const { t } = useTranslation();
	const [text, setText] = useState('');

	const [roomTypeSelectedOptions, setRoomTypeSelectedOptions] = useState<OptionProp[]>([]);

	const roomTypeFilterStructure = useMemo(() => {
		return initialRoomTypeFilterStructure.map((option) => ({
			...option,
			checked: roomTypeSelectedOptions.some((selectedOption) => selectedOption.id === option.id),
		}));
	}, [roomTypeSelectedOptions]);

	const handleSearchTextChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const text = event.currentTarget.value;
			setFilters({ searchText: text, types: roomTypeSelectedOptions });
			setText(text);
		},
		[roomTypeSelectedOptions, setFilters],
	);

	const handleRoomTypeChange = useCallback(
		(options: OptionProp[]) => {
			setFilters({ searchText: text, types: options });
			setRoomTypeSelectedOptions(options);
		},
		[text, setFilters],
	);

	return (
		<FilterBar>
			<FilterBarSearch name='search-rooms' placeholder={t('Search_rooms')} onChange={handleSearchTextChange} value={text} />
			<FilterBarFilters>
				<MultiSelectCustom
					dropdownOptions={roomTypeFilterStructure}
					defaultTitle='All_rooms'
					selectedOptionsTitle='Rooms'
					setSelectedOptions={handleRoomTypeChange}
					selectedOptions={roomTypeSelectedOptions}
				/>
			</FilterBarFilters>
		</FilterBar>
	);
};

export default RoomsTableFilters;
