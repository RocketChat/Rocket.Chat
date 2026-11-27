import { Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { GenericModal, useFormSubmitWithDirtyCheck } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type ConferenceLinkModalProps = {
	mode: 'create' | 'rename';
	initialTitle?: string;
	onConfirm: (title: string) => void | Promise<void>;
	onClose: () => void;
	isPending?: boolean;
	/** Already translated, shown on the title field. */
	error?: string;
};

type ConferenceLinkModalFields = {
	title: string;
};

const ConferenceLinkModal = ({ mode, initialTitle, onConfirm, onClose, isPending, error }: ConferenceLinkModalProps) => {
	const { t } = useTranslation();
	const { register, handleSubmit, control } = useForm<ConferenceLinkModalFields>({
		defaultValues: { title: initialTitle ?? '' },
	});
	const { errors, isSubmitting } = useFormState({ control });
	const title = useWatch({ control, name: 'title' });

	// Spaces around the title are dropped on confirm, so they alone are no change.
	const handleConfirm = useFormSubmitWithDirtyCheck(({ title }: ConferenceLinkModalFields) => onConfirm(title.trim()), {
		isDirty: title.trim() !== (initialTitle ?? '').trim(),
	});

	const titleId = useId();
	const hintId = `${titleId}-hint`;
	const errorId = `${titleId}-error`;
	const errorMessage = errors.title?.message ?? error;
	const isRename = mode === 'rename';

	return (
		<GenericModal
			onSubmit={handleSubmit(handleConfirm)}
			title={isRename ? t('Rename_conference_link') : t('Create_link')}
			confirmText={isRename ? t('Rename') : t('Create')}
			confirmLoading={isPending || isSubmitting}
			onCancel={onClose}
			onClose={onClose}
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={titleId} required>
						{t('Conference_link_name')}
					</FieldLabel>
					<FieldRow>
						<TextInput
							id={titleId}
							{...register('title', {
								validate: (value) => value.trim().length > 0 || t('Required_field', { field: t('Conference_link_name') }),
							})}
							aria-required='true'
							aria-invalid={errorMessage ? 'true' : 'false'}
							aria-describedby={[isRename && hintId, errorMessage && errorId].filter(Boolean).join(' ') || undefined}
						/>
					</FieldRow>
					{isRename && <FieldHint id={hintId}>{t('Rename_conference_link_description')}</FieldHint>}
					{errorMessage && (
						<FieldError role='alert' id={errorId}>
							{errorMessage}
						</FieldError>
					)}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ConferenceLinkModal;
