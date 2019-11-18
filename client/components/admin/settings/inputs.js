import React, { useState } from 'react';

import { Icon } from '../../basic/Icon';

export function RoomPickSettingInput({ _id }) {
	// const collection = usePrivateSettingsCollection();
	const [selectedRooms] = useState({});

	// useEffect(() => {
	// 	const withRoomPickType = (f) => (data) => {
	// 		if (data.type !== 'roomPick') {
	// 			return;
	// 		}

	// 		f(data);
	// 	};

	// 	collection.find().observe({
	// 		added: withRoomPickType((data) => {
	// 			setSelectedRooms({
	// 				...selectedRooms,
	// 				[data._id]: data.value,
	// 			});
	// 		}),
	// 		changed: withRoomPickType((data) => {
	// 			setSelectedRooms({
	// 				...selectedRooms,
	// 				[data._id]: data.value,
	// 			});
	// 		}),
	// 		removed: withRoomPickType((data) => {
	// 			setSelectedRooms(
	// 				Object.entries(selectedRooms)
	// 					.filter(([key]) => key !== data._id)
	// 					.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
	// 			);
	// 		}),
	// 	});
	// }, [collection]);

	return <div>
		{/* {{> inputAutocomplete settings=autocompleteRoom id=_id name=_id class="search autocomplete rc-input__element" autocomplete="off" disabled=isDisabled.disabled}} */}
		<ul class='selected-rooms'>
			{(selectedRooms[_id] || []).map(({ name }) =>
				<li key={name} className='remove-room' data-setting={_id}>
					{name} <Icon icon='icon-cancel' />
				</li>
			)}
		</ul>
	</div>;
}
