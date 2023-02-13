import type { ISearchProvider } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useMethod, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { KeyboardEvent, UIEvent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import BlazeTemplate from '../../../components/BlazeTemplate';
import { useRoom } from '../../../contexts/RoomContext';
import type { MessageSearchSuggestion as MessageSearchSuggestionType } from '../lib/MessageSearchSuggestion';
import { getSuggestionText } from '../lib/getSuggestionText';
import MessageSearchSuggestion from './MessageSearchSuggestion';

type MessageSearchFormWithSuggestionsProps = {
	provider: ISearchProvider;
	getPayload: () => Record<string, unknown>;
	onSearch: (searchText: string) => void;
};

const MessageSearchFormWithSuggestions = ({ provider, getPayload, onSearch }: MessageSearchFormWithSuggestionsProps) => {
	const { handleSubmit, register, setFocus, setValue } = useForm({
		defaultValues: {
			'message-search': '',
		},
	});

	useEffect(() => {
		setFocus('message-search');
	}, [setFocus]);

	const submitHandler = handleSubmit(({ 'message-search': searchText }) => {
		suggestionsMutation.reset();
		onSearch(searchText);
	});

	const uid = useUserId() ?? undefined;
	const room = useRoom();
	const getSearchSuggestions = useMethod('rocketchatSearch.suggest');
	const suggestionsMutation = useMutation(
		['rooms', room._id, 'message-search', 'suggestions', { uid, rid: room._id }] as const,
		async ({ searchText }: { searchText: string }) => {
			const suggestions = await getSearchSuggestions(searchText, { rid: room._id, uid }, getPayload());

			if (!suggestions || suggestions.length === 0) {
				return [{ text: 'Test' }];
			}

			return suggestions;
		},
		{
			onMutate: () => {
				setSuggestionIndex(0);
			},
		},
	);

	const debouncedSuggestionsMutate = useDebouncedCallback(useMutableCallback(suggestionsMutation.mutate), 300);

	const handleInput = useCallback(
		(event: UIEvent<HTMLInputElement>) => {
			const searchText = event.currentTarget.value;
			debouncedSuggestionsMutate({ searchText });
		},
		[debouncedSuggestionsMutate],
	);

	const [suggestionIndex, setSuggestionIndex] = useState(0);

	const handleKeyDown = useMutableCallback((event: KeyboardEvent<HTMLInputElement>) => {
		const suggestions = suggestionsMutation.data;

		if (event.code === 'Enter') {
			const suggestion = suggestionIndex >= 0 ? suggestions?.[suggestionIndex] : undefined;
			const suggestionText = getSuggestionText(suggestion);
			if (!suggestionText) {
				return;
			}

			setValue('message-search', suggestionText);
			return;
		}

		if (!suggestions) {
			return;
		}

		if (event.code === 'ArrowDown') {
			setSuggestionIndex((suggestionIndex) => {
				return suggestionIndex < suggestions.length - 1 ? suggestionIndex + 1 : 0;
			});
			return;
		}

		if (event.code === 'ArrowUp') {
			setSuggestionIndex((suggestionIndex) => {
				return suggestionIndex === 0 ? suggestions.length - 1 : suggestionIndex - 1;
			});
		}
	});

	const handleSuggestionClick = useMutableCallback((suggestion: MessageSearchSuggestionType) => {
		const suggestionText = getSuggestionText(suggestion);
		if (!suggestionText) {
			return;
		}

		setValue('message-search', suggestionText);
		onSearch(suggestionText);
		suggestionsMutation.reset();
	});

	const handleSuggestionHover = useMutableCallback((suggestion: MessageSearchSuggestionType) => {
		setSuggestionIndex(suggestionsMutation.data?.indexOf(suggestion) ?? 0);
	});

	const t = useTranslation();

	return (
		<Box is='form' className='search-form' role='form' onSubmit={submitHandler}>
			<div className='rc-input'>
				<label className='rc-input__label'>
					<div className='rc-input__wrapper'>
						<BlazeTemplate name='icon' className='rc-input__icon' block='rc-input__icon-svg' icon={provider.icon} />
						<input
							type='text'
							className='rc-input__element'
							id='message-search'
							placeholder={t('Search_Messages')}
							autoComplete='off'
							aria-label={t('Search_Messages')}
							onKeyDown={handleKeyDown}
							onInput={handleInput}
							{...register('message-search')}
						/>
					</div>
				</label>
			</div>
			{suggestionsMutation.isSuccess && suggestionsMutation.data && (
				<div id='rocket-search-suggestions'>
					{suggestionsMutation.data.map((suggestion, index) => (
						<MessageSearchSuggestion
							key={index}
							provider={provider}
							suggestion={suggestion}
							active={index === suggestionIndex}
							onClick={handleSuggestionClick}
							onHover={handleSuggestionHover}
						/>
					))}
				</div>
			)}
		</Box>
	);
};

export default MessageSearchFormWithSuggestions;
