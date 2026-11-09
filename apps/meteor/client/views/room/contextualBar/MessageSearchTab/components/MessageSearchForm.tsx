import type { IMessageSearchProvider } from '@rocket.chat/core-typings';
import { Callout, Field, FieldHint, FieldLabel, Icon, Stack, Text, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useStableCallback } from '@rocket.chat/fuselage-hooks';
import DOMPurify from 'dompurify';
import { useEffect, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getRoomTypeTranslation } from '../../../../../lib/getRoomTypeTranslation';
import { useRoom } from '../../../contexts/RoomContext';
import MessageSearchFormLayout from '../layout/MessageSearchFormLayout';

export type MessageSearchFormProps = {
	provider: IMessageSearchProvider;
	onSearch: (params: { searchText: string; globalSearch: boolean }) => void;
	searchListId: string;
	isSuccess: boolean;
};

const MessageSearchForm = ({ provider, onSearch, searchListId, isSuccess }: MessageSearchFormProps) => {
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

	const debouncedOnSearch = useDebouncedCallback(useStableCallback(onSearch), 300);

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
		<MessageSearchFormLayout onSubmit={submitHandler}>
			<Stack>
				<Field>
					<TextInput
						endAddon={<Icon name='magnifier' size='x20' />}
						placeholder={t('Search_Messages')}
						aria-label={t('Search_Messages')}
						aria-controls={isSuccess ? searchListId : undefined}
						autoComplete='off'
						{...register('searchText')}
					/>
					{provider.description && <FieldHint dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t(provider.description)) }} />}
				</Field>
				{globalSearchEnabled && (
					<Field>
						<FieldLabel htmlFor={globalSearchToggleId}>{t('Global_Search')}</FieldLabel>
						<ToggleSwitch id={globalSearchToggleId} {...register('globalSearch')} />
					</Field>
				)}
			</Stack>
			{room.encrypted && (
				<Callout type='warning' icon='circle-exclamation'>
					<Text fontScale='p2b'>{t('Encrypted_RoomType', { roomType: getRoomTypeTranslation(room).toLowerCase() })}</Text>
					{t('Encrypted_content_cannot_be_searched')}
				</Callout>
			)}
		</MessageSearchFormLayout>
	);
};

export default MessageSearchForm;
