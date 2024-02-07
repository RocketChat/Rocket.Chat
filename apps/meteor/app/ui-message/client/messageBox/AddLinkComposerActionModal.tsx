import { Field, FieldGroup, TextInput, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import GenericModal from '../../../../client/components/GenericModal';

type AddLinkComposerActionModalProps = {
	selectedText?: string;
	onConfirm: (url: string, title: string) => void;
	onClose: () => void;
};

const AddLinkComposerActionModal = ({ selectedText, onClose, onConfirm }: AddLinkComposerActionModalProps) => {
	const t = useTranslation();

	const {
		formState: { isValid, errors },
		register,
		handleSubmit,
		setFocus,
	} = useForm({
		mode: 'onBlur',
		defaultValues: {
			url: selectedText || '',
			title: '',
		},
	});

	useEffect(() => {
		setFocus(selectedText ? 'title' : 'url');
	}, [selectedText, setFocus]);

	const onClickConfirm = ({ url, title }: { url: string; title: string }) => {
		onConfirm(url, title);
	};

	const submit = handleSubmit(onClickConfirm);

	return (
		<GenericModal onConfirm={submit} confirmDisabled={!isValid} onClose={onClose} onCancel={onClose} title={t('Link')}>
			<FieldGroup is='form' name='xxx' onSubmit={(e) => void submit(e)} method='post'>
				<Field>
					<FieldLabel>{t('URL')}</FieldLabel>
					<FieldRow>
						<TextInput {...register('url', { required: t('The_field_is_required', t('URL')) })} />
					</FieldRow>
					{errors?.url && <FieldError>{t('The_field_is_required', t('URL'))}</FieldError>}
				</Field>
				<Field>
					<FieldLabel>{t('Title')}</FieldLabel>
					<FieldRow>
						<TextInput {...register('title', { required: t('The_field_is_required', t('Title')) })} />
					</FieldRow>
					{errors?.title && <FieldError>{t('The_field_is_required', t('Title'))}</FieldError>}
				</Field>
				<input type='submit' hidden />
			</FieldGroup>
		</GenericModal>
	);
};

export default AddLinkComposerActionModal;
