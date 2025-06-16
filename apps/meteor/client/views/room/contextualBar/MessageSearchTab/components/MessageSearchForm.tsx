import type { IMessageSearchProvider } from '@rocket.chat/core-typings';
import { Box, Field, FieldLabel, FieldHint, Icon, TextInput, ToggleSwitch, Callout } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { useEffect, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getRoomTypeTranslation } from '../../../../../lib/getRoomTypeTranslation';
import { useRoom } from '../../../contexts/RoomContext';

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

	const room = useRoom();

	useEffect(() => {
		setFocus('searchText');
	}, [setFocus]);

	const debouncedOnSearch = useDebouncedCallback(useEffectEvent(onSearch), 300);

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
	const globalSearchToggleId = useId();

	const { t } = useTranslation();

	return (
		<Box is='form' onSubmit={submitHandler} w='full'>
			<Field>
				<TextInput
					addon={<Icon name='magnifier' size='x20' />}
					placeholder={t('Search_Messages')}
					aria-label={t('Search_Messages')}
					autoComplete='off'
					{...register('searchText')}
				/>
				{provider.description && (
					<FieldHint dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t(provider.description as TranslationKey)) }} />
				)}
			</Field>
			{globalSearchEnabled && (
				<Field>
					<FieldLabel htmlFor={globalSearchToggleId}>{t('Global_Search')}</FieldLabel>
					<ToggleSwitch id={globalSearchToggleId} {...register('globalSearch')} />
				</Field>
			)}
			{room.encrypted && (
				<Callout type='warning' mbs={12} icon='circle-exclamation'>
					<Box fontScale='p2b'>{t('Encrypted_RoomType', { roomType: getRoomTypeTranslation(room).toLowerCase() })}</Box>
					{t('Encrypted_content_cannot_be_searched')}
				</Callout>
			)}
		</Box>
	);
};

export default MessageSearchForm;
