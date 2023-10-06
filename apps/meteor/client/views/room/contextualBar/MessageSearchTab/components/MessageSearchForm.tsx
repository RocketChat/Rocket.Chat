import type { IMessageSearchProvider } from '@rocket.chat/core-typings';
import { Box, Field, FieldLabel, FieldRow, FieldHint, Icon, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

type MessageSearchFormProps = {
	provider: IMessageSearchProvider;
	onSearch: (params: { searchText: string; globalSearch: boolean }) => void;
};

const MessageSearchForm = ({ provider, onSearch }: MessageSearchFormProps) => {
	const { handleSubmit, register, setFocus, control } = useForm({
		defaultValues: {
			searchText: '',
			globalSearch: false,
		},
	});

	useEffect(() => {
		setFocus('searchText');
	}, [setFocus]);

	const debouncedOnSearch = useDebouncedCallback(useMutableCallback(onSearch), 300);

	const submitHandler = handleSubmit(({ searchText, globalSearch }) => {
		debouncedOnSearch.cancel();
		onSearch({ searchText, globalSearch });
	});

	const searchText = useWatch({ control, name: 'searchText' });
	const globalSearch = useWatch({ control, name: 'globalSearch' });

	useEffect(() => {
		debouncedOnSearch({ searchText, globalSearch });
	}, [debouncedOnSearch, searchText, globalSearch]);

	const globalSearchEnabled = provider.settings.GlobalSearchEnabled;
	const globalSearchToggleId = useUniqueId();

	const t = useTranslation();

	return (
		<Box
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
				<Field>
					<FieldRow>
						<TextInput
							addon={<Icon name='magnifier' size='x20' />}
							placeholder={t('Search_Messages')}
							aria-label={t('Search_Messages')}
							autoComplete='off'
							{...register('searchText')}
						/>
					</FieldRow>
					{provider.description && <FieldHint dangerouslySetInnerHTML={{ __html: t(provider.description as TranslationKey) }} />}
				</Field>
				{globalSearchEnabled && (
					<Field>
						<FieldRow>
							<ToggleSwitch id={globalSearchToggleId} {...register('globalSearch')} />
							<FieldLabel htmlFor={globalSearchToggleId}>{t('Global_Search')}</FieldLabel>
						</FieldRow>
					</Field>
				)}
			</Box>
		</Box>
	);
};

export default MessageSearchForm;
