import { Icon, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

const FilterByRoomName = ({ setFilter }: { setFilter?: Dispatch<SetStateAction<any>> }): ReactElement => {
	const [text, setText] = useState('');

	const t = useTranslation();

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		return setFilter?.({ text });
	}, [setFilter, text]);

	return (
		<TextInput
			alignItems='center'
			placeholder={t('Search_rooms')}
			addon={<Icon name='magnifier' size='x20' />}
			onChange={handleChange}
			value={text}
		/>
	);
};

export default FilterByRoomName;
