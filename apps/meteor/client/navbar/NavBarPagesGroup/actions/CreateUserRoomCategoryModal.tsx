import {
	Box,
	Button,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldRow,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
	TextInput,
} from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { useId, useState } from 'react';

import { isReservedSidebarGroupName } from '../../../../lib/sidebarBuiltinGroups';
import { useUserRoomCategories } from '../../../hooks/useUserRoomCategories';

type CreateUserRoomCategoryModalProps = {
	onClose: () => void;
};

const CreateUserRoomCategoryModal = ({ onClose }: CreateUserRoomCategoryModalProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const titleId = useId();
	const nameFieldId = useId();
	const { addCategory } = useUserRoomCategories();

	const [name, setName] = useState('');
	const [error, setError] = useState<string | undefined>();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setError(t('User_room_category_name_required'));
			return;
		}
		if (isReservedSidebarGroupName(trimmed)) {
			setError(t('error-user-room-category-name-reserved'));
			return;
		}
		setError(undefined);
		setSubmitting(true);
		try {
			await addCategory(trimmed);
			dispatchToastMessage({ type: 'success', message: t('User_room_category_created') });
			onClose();
		} catch (err) {
			dispatchToastMessage({ type: 'error', message: err ?? t('User_room_category_create_failed') });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal aria-labelledby={titleId} wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit} {...props} />}>
			<ModalHeader>
				<ModalTitle id={titleId}>{t('Create_user_room_category')}</ModalTitle>
				<ModalClose tabIndex={-1} onClick={onClose} />
			</ModalHeader>
			<ModalContent mbe={2}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={nameFieldId}>{t('User_room_category_name')}</FieldLabel>
						<FieldRow>
							<TextInput
								id={nameFieldId}
								value={name}
								onChange={(e) => setName(e.currentTarget.value)}
								aria-invalid={Boolean(error)}
								aria-describedby={error ? `${nameFieldId}-error` : undefined}
							/>
						</FieldRow>
						{error && (
							<FieldError id={`${nameFieldId}-error`} mbs={4}>
								{error}
							</FieldError>
						)}
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary loading={submitting} type='submit'>
						{t('Create')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default CreateUserRoomCategoryModal;
