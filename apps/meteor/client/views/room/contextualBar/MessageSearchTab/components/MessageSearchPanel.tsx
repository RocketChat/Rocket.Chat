import type { ISearchProvider, ISetting } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserId, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import BlazeTemplate from '../../../components/BlazeTemplate';
import { useRoom } from '../../../contexts/RoomContext';
import { useStateAsReactiveVar } from '../hooks/useStateAsReactiveVar';
import MessageSearchFormWithSuggestions from './MessageSearchFormWithSuggestions';
import MessageSearchFormWithoutSuggestions from './MessageSearchFormWithoutSuggestions';

type MessageSearchPanelProps = {
	provider: ISearchProvider;
};

const MessageSearchPanel = ({ provider }: MessageSearchPanelProps): ReactElement => {
	const uid = useUserId() ?? undefined;
	const room = useRoom();

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const parentPayloadRef = useRef<Record<string, unknown>>({});
	const payloadRef = useRef<Record<string, unknown>>({});

	const getPayload = () => ({ ...parentPayloadRef.current, ...payloadRef.current });

	const searchMessages = useMethod('rocketchatSearch.search');
	const searchMessagesMutation = useMutation(
		['rooms', room._id, 'message-search', 'result', { uid, rid: room._id }] as const,
		async ({ searchText }: { searchText: string }) => {
			if (!searchText) {
				return null;
			}

			return searchMessages(searchText, { uid, rid: room._id }, getPayload());
		},
		{
			onError: () => {
				dispatchToastMessage({
					type: 'error',
					message: t('Search_message_search_failed'),
				});
			},
		},
	);

	const settingsRef = useRef<Record<ISetting['_id'], ISetting['value']>>({});

	const [searchText, setSearchText] = useState('');

	const search = useCallback(
		(searchText: string) => {
			payloadRef.current = {};
			setSearchText(searchText);
			searchMessagesMutation.mutate({ searchText });
		},
		[searchMessagesMutation],
	);

	const { current: scope } = useRef({
		searching: useStateAsReactiveVar(
			useMemo(
				() => [searchMessagesMutation.isLoading, () => searchMessagesMutation.mutate({ searchText })],
				[searchMessagesMutation, searchText],
			),
		),
		result: useStateAsReactiveVar(
			useMemo(
				() => [searchMessagesMutation.data ?? undefined, () => searchMessagesMutation.mutate({ searchText })],
				[searchMessagesMutation, searchText],
			),
		),
		text: useStateAsReactiveVar([searchText, setSearchText]),
		get settings() {
			return settingsRef.current;
		},
		set settings(value) {
			settingsRef.current = value;
		},
		get parentPayload() {
			return parentPayloadRef.current;
		},
		set parentPayload(value) {
			parentPayloadRef.current = value;
		},
		get payload() {
			return payloadRef.current;
		},
		search: () => searchMessagesMutation.mutate({ searchText }),
	});

	scope.search = () => searchMessagesMutation.mutate({ searchText });

	const handleSearch = useCallback(
		(searchText: string) => {
			searchMessagesMutation.mutate({ searchText });
		},
		[searchMessagesMutation],
	);

	return (
		<>
			{provider.description && (
				<div className='title'>
					<p dangerouslySetInnerHTML={{ __html: t(provider.description as TranslationKey) }} />
				</div>
			)}
			<Box className={['list-view', provider.key]} display='flex' flexGrow={0} flexShrink={1} flexDirection='column'>
				<Box className='control rocket-search-input'>
					{provider.supportsSuggestions ? (
						<MessageSearchFormWithSuggestions provider={provider} getPayload={getPayload} onSearch={search} />
					) : (
						<MessageSearchFormWithoutSuggestions provider={provider} onSearch={handleSearch} />
					)}
				</Box>
			</Box>
			<BlazeTemplate
				name={provider.resultTemplate as 'DefaultSearchResultTemplate' | 'ChatpalSearchResultTemplate'}
				className='rocket-search-result'
				{...scope}
			/>
		</>
	);
};

export default MessageSearchPanel;
