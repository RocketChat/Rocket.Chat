import { Box, Icon, TextInput, Label, Select } from '@rocket.chat/fuselage';
import React, { FC, FormEvent, memo, useCallback } from 'react';

import AutoCompleteAgent from '../../../../client/components/AutoCompleteAgent';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import AutoCompleteTagsMultiple from '../tags/AutoCompleteTagsMultiple';

type CannedResponsesFilterProps = {
	sharingValue: string;
	createdByValue: string;
	tagsValue: string;
	shortcutValue: string;
	setSharing: () => void;
	setCreatedBy: () => void;
	setTags: () => void;
	setShortcut: () => void;
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
	const sharingList = [
		['', t('All')],
		['private', t('Private')],
		['public', t('Public')],
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
				<Label mb='x4'>{t('Search')}</Label>
				<TextInput
					addon={<Icon name='magnifier' size='x20' />}
					onChange={setShortcut}
					value={shortcutValue}
				/>
			</Box>

			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Sharing')}</Label>
				<Select onChange={setSharing} options={sharingList} value={sharingValue} />
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Created_by')}</Label>
				<AutoCompleteAgent onChange={setCreatedBy} value={createdByValue} haveAll />
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Tags')}</Label>
				<AutoCompleteTagsMultiple onChange={setTags} value={tagsValue} />
			</Box>
		</Box>
	);
};

export default memo(CannedResponsesFilter);
