import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Field, CheckBox, Margins, MultiSelectFiltered } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, Dispatch, SetStateAction } from 'react';
import React, { useCallback, useState, useEffect } from 'react';

const DEFAULT_TYPES = ['d', 'p', 'c', 'teams'];

const FilterByTypeAndText = ({ setFilter, ...props }: { setFilter?: Dispatch<SetStateAction<any>> }): ReactElement => {
	const t = useTranslation();

	const [text, setText] = useState('');
	const [types, setTypes] = useState({
		d: false,
		c: false,
		p: false,
		l: false,
		discussions: false,
		teams: false,
	});

	// TODO: add all missing translations!
	const [roomTypeFilterStructure, setRoomTypeFilterStructure] = useState<SelectOption[]>([
		['all', t('All_Rooms'), true],
		['channels', t('Channels'), false],
		['directMessage', t('Direct_Message'), false],
		['discussions', t('Discussions'), false],
		['omnichannel', t('Omnichannel'), false],
		['teams', t('Teams'), false],
	]);
	// Is this necessary?
	//	const roomTypeFilterOnSelected = useRadioToggle(setroomTypeFilterStructure);

	// TODO: add all missing translations!
	const [visibilityFilterStructure, setVisibilityFilterStructure] = useState<SelectOption[]>([
		['all', t('All_Visibilities'), true],
		['private', t('Private'), false],
		['public', t('Public'), false],
	]);

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);
	// const handleCheckBox = useCallback((type: keyof typeof types) => setTypes({ ...types, [type]: !types[type] }), [types]);

	useEffect(() => {
		if (Object.values(types).filter(Boolean).length === 0) {
			return setFilter?.({ text, types: DEFAULT_TYPES });
		}
		const _types = Object.entries(types)
			.filter(([, value]) => Boolean(value))
			.map(([key]) => key);
		setFilter?.({ text, types: _types });
	}, [setFilter, text, types]);

	// TODO: improve the code and separate functions into smaller files!

	/* 
		This function should receive all the available rooms in an array roomsData: IRoom[], and returns an array with the filtered results.
		For each category selected, this function should update the list by adding the rooms that correspond to that prop
	*/
	const useFilteredRooms = useCallback(
		({
			roomsData,
			typeFilter,
			visibilityFilter,
		}: {
			roomsData: IRoom[];
			typeFilter: string;
			visibilityFilter: string;
		}): IRoom[] | undefined => {
			// improve this code with useMemo ou useCallback

			let filteredRoomsByType: IRoom[] = [];
			let filteredRoomsByVisibility: IRoom[] = [];

			const typeFilteredResults: Record<string, () => IRoom[]> = {
				private: () => roomsData.filter(filterRoomsByPrivate),
				public: () => roomsData.filter(filterRoomsByPublic),
			};

			if (typeFilter && typeFilter !== 'all') {
				filteredRoomsByType = typeFilteredResults[typeFilter]();
			}

			const visibilityFilteredResults: Record<string, () => IRoom[]> = {
				channels: () => roomsData.filter(filterRoomsByChannels),
				directMessage: () => roomsData.filter(filterRoomsByDirectMessages),
				discussions: () => roomsData.filter(filterRoomsByDiscussions),
				omnichannel: () => roomsData.filter(filterRoomsByOmnichannel),
				teams: () => roomsData.filter(filterRoomsByTeams),
			};

			if (visibilityFilter && visibilityFilter !== 'all') {
				filteredRoomsByVisibility = visibilityFilteredResults[visibilityFilter]();
			}

			return filteredRoomsByType.concat(filteredRoomsByVisibility);
		},
		[], // which prop informs the selected options on the multiselect?

	);

	// TODO: check if this is the correct prop for the rooms type!!!
	const filterRoomsByPrivate = ({ t }: Partial<IRoom>): boolean => t === 'p';
	const filterRoomsByPublic = ({ t }: Partial<IRoom>): boolean => t === 'p';
	// TODO: check if this is the correct prop for the rooms visibility!!!
	const filterRoomsByChannels = ({ t }: Partial<IRoom>): boolean => t === 'd';
	const filterRoomsByDirectMessages = ({ t }: Partial<IRoom>): boolean => t === 'd';
	const filterRoomsByDiscussions = ({ t }: Partial<IRoom>): boolean => t === 'd';
	const filterRoomsByOmnichannel = ({ t }: Partial<IRoom>): boolean => t === 'd';
	const filterRoomsByTeams = ({ t }: Partial<IRoom>): boolean => t === 'd';

	return (
		<Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='row' {...props}>
			<Field>
				<TextInput placeholder={t('Search_Rooms')} addon={<Icon name='magnifier' size='x20' />} onChange={handleChange} value={text} />

				<MultiSelectFiltered
					onChange={setRoomTypeFilterStructure(event?.target.value)}
					options={roomTypeFilterStructure}
					placeholder={t('All_rooms')}
				/>

				<MultiSelectFiltered
					onChange={() => {
						console.log('onChange for All_visible multiselect');
					}}
					options={visibilityFilterStructure}
					placeholder={t('All_visible')}
				/>
			</Field>
		</Box>
	);
};

export default FilterByTypeAndText;
