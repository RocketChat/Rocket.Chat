import {
	Box,
	Icon,
	TextInput,
	Label,
	PaginatedSelectFiltered,
	PaginatedMultiSelectFiltered,
} from '@rocket.chat/fuselage';
import React, { FC, useMemo, FormEvent, memo, useCallback, useEffect, useState } from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRecordList } from '../../../../client/hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useAgentsList } from '../../hooks/useAgentsList';
import { useTagsList } from '../../hooks/useTagsList';

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
		{ label: 'all', value: '' },
		{ label: 'private', value: 'private' },
		{ label: 'public', value: 'public' },
		{ label: 'department', value: 'department' },
	];
	const [createdByList, setCreatedByList] = useState([{ label: 'all', value: '' }]);
	const [tagsFilter, setTagsFilter] = useState('');
	const [agentsFilter, setAgentsFilter] = useState('');

	const { itemsList: tagsList, loadMoreItems: loadMoreTags } = useTagsList(
		useMemo(() => ({ filter: tagsFilter }), [tagsFilter]),
	);

	const { phase: tagsPhase, items: tagsItems, itemCount: tagsTotal } = useRecordList(tagsList);

	const { itemsList: agentsList, loadMoreItems: loadMoreAgents } = useAgentsList(
		useMemo(() => ({ filter: tagsFilter }), [tagsFilter]),
	);

	const { phase: agentsPhase, items: agentsItems, itemCount: agentsTotal } = useRecordList(
		agentsList,
	);

	const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
	}, []);

	console.log(agentsItems);

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
					filter={agentsFilter}
					setFilter={setAgentsFilter}
					onChange={setCreatedBy}
					options={agentsItems}
					value={createdByValue}
					endReached={
						agentsPhase === AsyncStatePhase.LOADING
							? () => {}
							: (start) => loadMoreAgents(start, Math.min(50, agentsTotal))
					}
				/>
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Tags')}</Label>
				<PaginatedMultiSelectFiltered
					// placeholder={placeholder ?? t('Search')}
					// ref={inputRef}
					filter={tagsFilter}
					setFilter={setTagsFilter}
					onChange={setTags}
					options={tagsItems}
					value={tagsValue}
					endReached={
						tagsPhase === AsyncStatePhase.LOADING
							? () => {}
							: (start) => loadMoreTags(start, Math.min(50, tagsTotal))
					}
				/>
			</Box>
		</Box>
	);
};

export default memo(CannedResponsesFilter);
