import { Field, FieldGroup, TextInput, FieldLabel, FieldRow, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
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
	const formId = useUniqueId();
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
			wrapperFunction={(props) => <Box is='form' name={formId} onSubmit={(e) => void submit(e)} method='post' {...props} />}
			title={t('Add_link')}
		>
			<FieldGroup>
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
			</FieldGroup>
		</GenericModal>
	);
};

export default AddLinkComposerActionModal;
