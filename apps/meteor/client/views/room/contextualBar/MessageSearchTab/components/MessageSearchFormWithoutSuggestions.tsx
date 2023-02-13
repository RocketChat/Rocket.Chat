import type { ISearchProvider } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { UIEvent } from 'react';
import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import BlazeTemplate from '../../../components/BlazeTemplate';

type MessageSearchFormWithoutSuggestionsProps = {
	provider: ISearchProvider;
	onSearch: (searchText: string) => void;
};

const MessageSearchFormWithoutSuggestions = ({ provider, onSearch }: MessageSearchFormWithoutSuggestionsProps) => {
	const { handleSubmit, register, setFocus } = useForm({
		defaultValues: {
			'message-search': '',
		},
	});

	useEffect(() => {
		setFocus('message-search');
	}, [setFocus]);

	const debouncedOnSearch = useDebouncedCallback(useMutableCallback(onSearch), 300);

	const submitHandler = handleSubmit(({ 'message-search': searchText }) => {
		debouncedOnSearch.cancel();
		debouncedOnSearch(searchText);
	});

	const handleInput = useCallback(
		(event: UIEvent<HTMLInputElement>) => {
			const { value } = event.currentTarget;
			debouncedOnSearch(value);
		},
		[debouncedOnSearch],
	);

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
							onInput={handleInput}
							{...register('message-search')}
						/>
					</div>
				</label>
			</div>
		</Box>
	);
};

export default MessageSearchFormWithoutSuggestions;
