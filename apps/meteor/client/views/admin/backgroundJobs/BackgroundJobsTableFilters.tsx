import { Box, Icon, Margins, TextInput } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

type BackgroundJobsTableFiltersProps = {
	setSearchTerm: Dispatch<SetStateAction<string>>;
};

const BackgroundJobsTableFilters = ({ setSearchTerm }: BackgroundJobsTableFiltersProps) => {
	const { t } = useTranslation();
	const [text, setText] = useState('');

	const handleSearchTextChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setText(event.currentTarget.value);
			setSearchTerm(event.currentTarget.value);
		},
		[setSearchTerm],
	);

	const breakpoints = useBreakpoints();
	const isLargeScreenOrBigger = breakpoints.includes('lg');

	return (
		<Box
			marginBlock={16}
			is='form'
			onSubmit={(event) => {
				event.preventDefault();
			}}
			display='flex'
			flexWrap='wrap'
			alignItems='center'
		>
			<Margins inlineEnd={isLargeScreenOrBigger ? 16 : 0}>
				<TextInput
					placeholder={t('Search')}
					endAddon={<Icon name='magnifier' size='x20' />}
					onChange={handleSearchTextChange}
					value={text}
					flexGrow={2}
					minWidth='x220'
					aria-label={t('Search')}
				/>
			</Margins>
		</Box>
	);
};

export default BackgroundJobsTableFilters;
