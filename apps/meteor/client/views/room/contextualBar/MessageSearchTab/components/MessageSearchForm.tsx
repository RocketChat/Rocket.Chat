import type { IMessageSearchProvider } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { UIEvent } from 'react';
import React, { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';

import MessageSearchInput from './MessageSearchInput';

type MessageSearchFormProps = {
	provider: IMessageSearchProvider;
	onSearch: (searchText: string) => void;
};

const MessageSearchForm = ({ provider, onSearch }: MessageSearchFormProps) => {
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
			debouncedOnSearch(event.currentTarget.value);
		},
		[debouncedOnSearch],
	);

	return (
		<Box
			className={['list-view', provider.key]}
			display='flex'
			flexGrow={0}
			flexShrink={1}
			flexDirection='column'
			p={24}
			borderBlockEndWidth={2}
			borderBlockEndStyle='solid'
			borderBlockEndColor='extra-light'
		>
			<Box is='form' onSubmit={submitHandler}>
				<MessageSearchInput provider={provider} onInput={handleInput} {...register('message-search')} />
			</Box>
		</Box>
	);
};

export default MessageSearchForm;
