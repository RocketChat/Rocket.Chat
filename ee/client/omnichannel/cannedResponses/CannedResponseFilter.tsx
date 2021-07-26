import { Box, Icon, TextInput, Select, SelectOptions } from '@rocket.chat/fuselage';
import React, { FC, FormEvent, memo, useCallback } from 'react';

import AutoCompleteAgent from '../../../../client/components/AutoCompleteAgent';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import AutoCompleteTagsMultiple from '../tags/AutoCompleteTagsMultiple';

type CannedResponsesFilterProps = {
	sharingValue: string;
	createdByValue: string;
	tagsValue: Array<{ value: string; label: string }>;
	shortcutValue: string;
	setSharing: (eventOrValue: unknown) => void;
	setCreatedBy: (eventOrValue: unknown) => void;
	setTags: (eventOrValue: unknown) => void;
	setShortcut: (eventOrValue: unknown) => void;
};

const CannedResponsesFilter: FC<CannedResponsesFilterProps> = ({
	sharingValue = '',
	createdByValue = '',
	tagsValue = '',
	shortcutValue = '',
	setSharing,
	setCreatedBy,
	setTags,
	setShortcut,
	...props
}) => {
	const t = useTranslation();
	const sharingList: SelectOptions = [
		['', t('All')],
		['user', t('Private')],
		['global', t('Public')],
		['department', t('Department')],
	];

	const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
	}, []);

	return (
		<Box
			mb='x16'
			is='form'
			onSubmit={handleFormSubmit}
			display='flex'
			flexDirection='row'
			{...props}
		>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Box mb='x4'>{t('Search')}</Box>
				<TextInput
					addon={<Icon name='magnifier' size='x20' />}
					onChange={setShortcut}
					value={shortcutValue}
				/>
			</Box>

			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Box mb='x4'>{t('Sharing')}</Box>
				<Select onChange={setSharing} options={sharingList} value={sharingValue} />
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Box mb='x4'>{t('Created_by')}</Box>
				<AutoCompleteAgent onChange={setCreatedBy} value={createdByValue} haveAll />
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Box mb='x4'>{t('Tags')}</Box>
				<AutoCompleteTagsMultiple onChange={setTags} value={tagsValue} />
			</Box>
		</Box>
	);
};

export default memo(CannedResponsesFilter);
