import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

const FilterByTypeAndText = ({
	setFilter,
	children,
}: {
	setFilter?: Dispatch<SetStateAction<any>>;
	children: ReactNode | undefined;
}): ReactElement => {
	const [text, setText] = useState('');

	const t = useTranslation();

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		return setFilter?.({ text });
	}, [setFilter, text]);

	return (
		<Box
			mb='x16'
			is='form'
			onSubmit={useCallback((e) => e.preventDefault(), [])}
			display='flex'
			flexWrap='wrap'
			alignItems='center'
			w='full'
		>
			<Box display='flex' flexWrap='wrap' flexGrow={1}>
				<TextInput
					flexGrow={2}
					minWidth='x224'
					placeholder={t('Search_Rooms')}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleChange}
					value={text}
				/>
				{children}
			</Box>
		</Box>
	);
};

export default FilterByTypeAndText;
