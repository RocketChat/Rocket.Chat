import { Box, Icon, TextInput, Label, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import React, { FC, ChangeEvent, FormEvent, memo, useCallback, useEffect, useState } from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';

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
	const [sharingList, setSharingList] = useState([{ label: 'all', value: '' }]);
	const [createdByList, setCreatedByList] = useState([{ label: 'all', value: '' }]);
	const [tagsList, setTagsList] = useState([{ label: 'all', value: '' }]);

	const { value: data, phase: state, error } = useEndpointData('canned-responses');

	useEffect(() => {
		data?.cannedResponses.forEach((response) => {
			// debugger;
			response.scope &&
				setSharingList([...sharingList, { label: response.scope, value: response.scope }]);
			response.tags &&
				setTagsList([...tagsList, { label: response.tags[0], value: response.tags[0] }]);
			response.createdBy &&
				setCreatedByList([
					...createdByList,
					{ label: response.createdBy.username, value: response.createdBy.username },
				]);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data?.cannedResponses]);

	const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	// useEffect(() => {
	// 	setFilter({ text });
	// }, [setFilter, text]);

	const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
	}, []);

	console.log(createdByList);

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
					// placeholder={placeholder ?? t('Search')}
					// ref={inputRef}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={setShortcut}
					value={shortcutValue}
				/>
			</Box>

			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Sharing')}</Label>
				<PaginatedSelectFiltered
					// placeholder={placeholder ?? t('Search')}
					// ref={inputRef}
					onChange={setSharing}
					options={sharingList}
					value={sharingValue}
				/>
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Created_by')}</Label>
				<PaginatedSelectFiltered
					// placeholder={placeholder ?? t('Search')}
					// ref={inputRef}
					onChange={setCreatedBy}
					options={createdByList}
					value={createdByValue}
				/>
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Tags')}</Label>
				<PaginatedSelectFiltered
					// placeholder={placeholder ?? t('Search')}
					// ref={inputRef}
					onChange={setTags}
					options={tagsList}
					value={tagsValue}
				/>
			</Box>
		</Box>
	);
};

export default memo(CannedResponsesFilter);
