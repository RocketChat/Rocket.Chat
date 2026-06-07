import {
	Box,
	Button,
	Field,
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

import { useUserRoomCategories } from '../../hooks/useUserRoomCategories';

type RenameUserRoomCategoryModalProps = {
	oldName: string;
	onClose: () => void;
};

const RenameUserRoomCategoryModal = ({ oldName, onClose }: RenameUserRoomCategoryModalProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { renameCategory } = useUserRoomCategories();
	const titleId = useId();
	const nameFieldId = useId();
	const [name, setName] = useState(oldName);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed || trimmed === oldName) {
			onClose();
			return;
		}
		setSubmitting(true);
		try {
			await renameCategory(oldName, trimmed);
			dispatchToastMessage({ type: 'success', message: t('User_room_category_rename_success') });
			onClose();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			dispatchToastMessage({ type: 'error', message: message || t('Something_went_wrong') });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal aria-labelledby={titleId} wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit} {...props} />}>
			<ModalHeader>
				<ModalTitle id={titleId}>{t('User_room_category_rename_title')}</ModalTitle>
				<ModalClose tabIndex={-1} onClick={onClose} />
			</ModalHeader>
			<ModalContent mbe={2}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={nameFieldId}>{t('User_room_category_name')}</FieldLabel>
						<FieldRow>
							<TextInput id={nameFieldId} value={name} onChange={(e) => setName(e.currentTarget.value)} />
						</FieldRow>
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary loading={submitting} type='submit'>
						{t('Save')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default RenameUserRoomCategoryModal;
