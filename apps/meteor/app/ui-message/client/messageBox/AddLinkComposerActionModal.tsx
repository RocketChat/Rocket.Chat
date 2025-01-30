import { Field, FieldGroup, TextInput, FieldLabel, FieldRow, Box } from '@rocket.chat/fuselage';
import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../client/components/GenericModal';

type AddLinkComposerActionModalProps = {
	selectedText?: string;
	onConfirm: (url: string, text: string) => void;
	onClose: () => void;
};

const AddLinkComposerActionModal = ({ selectedText, onClose, onConfirm }: AddLinkComposerActionModalProps) => {
	const { t } = useTranslation();
	const textField = useId();
	const urlField = useId();

	const { handleSubmit, setFocus, control } = useForm({
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
			onCancel={onClose}
			wrapperFunction={(props) => <Box is='form' onSubmit={(e) => void submit(e)} {...props} />}
			title={t('Add_link')}
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={textField}>{t('Text')}</FieldLabel>
					<FieldRow>
						<Controller control={control} name='text' render={({ field }) => <TextInput autoComplete='off' id={textField} {...field} />} />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={urlField}>{t('URL')}</FieldLabel>
					<FieldRow>
						<Controller control={control} name='url' render={({ field }) => <TextInput autoComplete='off' id={urlField} {...field} />} />
					</FieldRow>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default AddLinkComposerActionModal;
