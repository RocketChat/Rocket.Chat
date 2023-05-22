import { isTeamRoom, type IRoom, isPublicRoom, isDiscussion } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, Dispatch, SetStateAction } from 'react';
import React, { useCallback, useState, useEffect } from 'react';

import { RoomsDropDown } from './RoomDropDown/RoomsDropDown';

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

	const filterRoomsByPrivate = (room: Partial<IRoom>): boolean => isPublicRoom(room) === false;
	const filterRoomsByPublic = (room: Partial<IRoom>): boolean => isPublicRoom(room) === true;

	const filterRoomsByChannels = ({ t }: Partial<IRoom>): boolean => t === 'c';
	const filterRoomsByDirectMessages = ({ t }: Partial<IRoom>): boolean => t === 'd';
	const filterRoomsByDiscussions = (room: Partial<IRoom>): boolean => isDiscussion(room) === true;
	const filterRoomsByOmnichannel = ({ t }: Partial<IRoom>): boolean => t === 'l'; // LiveChat
	const filterRoomsByTeams = (room: Partial<IRoom>): boolean => isTeamRoom(room);

	return (
		<Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='row' {...props}>
			<Field>
				<TextInput placeholder={t('Search_Rooms')} addon={<Icon name='magnifier' size='x20' />} onChange={handleChange} value={text} />

				<RoomsDropDown categories={roomTypeOptions} onSelected={} selectedCategories={} textAllSelected={} textSomeCategories={} {...props} />
			</Field>
		</Box>
	);
};

export default FilterByTypeAndText;
