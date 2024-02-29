import { Field, FieldGroup, TextInput, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import GenericModal from '../../../../client/components/GenericModal';

type AddLinkComposerActionModalProps = {
	selectedText?: string;
	onConfirm: (url: string, text: string) => void;
	onClose: () => void;
};

const AddLinkComposerActionModal = ({ selectedText, onClose, onConfirm }: AddLinkComposerActionModalProps) => {
	const t = useTranslation();

	const { register, handleSubmit, setFocus } = useForm({
		mode: 'onBlur',
		defaultValues: {
			text: selectedText || '',
			url: '',
		},
	});

	useEffect(() => {
		setFocus(selectedText ? 'url' : 'text');
	}, [selectedText, setFocus]);

	const onClickConfirm = ({ url, text }: { url: string; text: string }) => {
		onConfirm(url, text);
	};

	const submit = handleSubmit(onClickConfirm);

	return (
		<GenericModal
			variant='warning'
			icon={null}
			confirmText={t('Add')}
			onConfirm={submit}
			onClose={onClose}
			onCancel={onClose}
			title={t('Add_link')}
		>
			<FieldGroup is='form' name='xxx' onSubmit={(e) => void submit(e)} method='post'>
				<Field>
					<FieldLabel>{t('Text')}</FieldLabel>
					<FieldRow>
						<TextInput {...register('text')} />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('URL')}</FieldLabel>
					<FieldRow>
						<TextInput {...register('url')} />
					</FieldRow>
				</Field>
				<input type='submit' hidden />
			</FieldGroup>
		</GenericModal>
	);
};

export default AddLinkComposerActionModal;
