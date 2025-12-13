import { Field, FieldGroup, TextInput, FieldLabel, FieldRow, Box, FieldError } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type AddLinkComposerActionModalProps = {
	selectedText?: string;
	onConfirm: (url: string, text: string) => void;
	onClose: () => void;
};

const AddLinkComposerActionModal = ({ selectedText, onClose, onConfirm }: AddLinkComposerActionModalProps) => {
	const { t } = useTranslation();
	const textField = useId();
	const urlField = useId();

	const { handleSubmit, setFocus, control, formState } = useForm({
		mode: 'onChange',
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
			confirmDisabled={!formState.isValid}
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
						<Controller
							control={control}
							name='url'
							rules={{
								pattern: {
									value: /^https?:\/\/.+$/,
									message: t("URL_must_start_with_'http://'_or_'https://'"),
								},
								required: {
									value: true,
									message: t(`URL_is_required`),
								},
							}}
							render={({ field }) => <TextInput autoComplete='off' id={urlField} {...field} />}
						/>
					</FieldRow>
					<FieldError>{formState.errors.url?.message}</FieldError>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default AddLinkComposerActionModal;
