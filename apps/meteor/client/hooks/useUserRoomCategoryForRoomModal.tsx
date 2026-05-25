import type { SelectOption } from '@rocket.chat/fuselage';
import {
	Box,
	Button,
	Callout,
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
	Select,
} from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { useUserRoomCategories } from './useUserRoomCategories';
import CreateUserRoomCategoryModal from '../navbar/NavBarPagesGroup/actions/CreateUserRoomCategoryModal';

type UserRoomCategoryForRoomModalProps = {
	roomId: string;
	roomName?: string;
	onClose: () => void;
};

const UserRoomCategoryForRoomModal = ({ roomId, roomName, onClose }: UserRoomCategoryForRoomModalProps) => {
	const t = useTranslation();
	const titleId = useId();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const { data: categories = [], addRoomToCategory, removeRoomFromCategory, refetch } = useUserRoomCategories();

	const containingCategory = useMemo(() => categories.find((c) => (c.roomIds ?? []).includes(roomId)), [categories, roomId]);

	const selectOptions = useMemo<Array<SelectOption>>(() => categories.map((c) => [c.name, c.name]), [categories]);
	const [selectedCategory, setSelectedCategory] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (containingCategory?.name) {
			setSelectedCategory(containingCategory.name);
			return;
		}
		if (categories[0]?.name) {
			setSelectedCategory((prev) => (categories.some((c) => c.name === prev) ? prev : categories[0].name));
		}
	}, [categories, containingCategory?.name]);

	const openCreateCategoryModal = useCallback(() => {
		setModal(
			<CreateUserRoomCategoryModal
				onClose={() => {
					void refetch();
					setModal(<UserRoomCategoryForRoomModal roomId={roomId} roomName={roomName} onClose={onClose} />);
				}}
			/>,
		);
	}, [onClose, refetch, roomId, roomName, setModal]);

	const handleApply = async () => {
		if (!selectedCategory) {
			return;
		}
		setSubmitting(true);
		try {
			await addRoomToCategory(selectedCategory, roomId);
			dispatchToastMessage({ type: 'success', message: t('User_room_category_assign_success', { name: selectedCategory }) });
			onClose();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			dispatchToastMessage({ type: 'error', message: message || t('Something_went_wrong') });
		} finally {
			setSubmitting(false);
		}
	};

	const handleRemove = async () => {
		if (!containingCategory) {
			return;
		}
		setSubmitting(true);
		try {
			await removeRoomFromCategory(containingCategory.name, roomId);
			dispatchToastMessage({ type: 'success', message: t('User_room_category_remove_success') });
			onClose();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			dispatchToastMessage({ type: 'error', message: message || t('Something_went_wrong') });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal aria-labelledby={titleId}>
			<ModalHeader>
				<ModalTitle id={titleId}>
					{t('Add_to_user_room_category')}
					{roomName ? `: ${roomName}` : ''}
				</ModalTitle>
				<ModalClose tabIndex={-1} onClick={onClose} />
			</ModalHeader>
			<ModalContent mbe={2}>
				<FieldGroup>
					<Box mbe={12}>{t('User_room_category_add_description')}</Box>
					{categories.length === 0 ? (
						<>
							<Callout type='info' mbe={12}>
								{t('User_room_category_empty_hint')}
							</Callout>
							<Button onClick={openCreateCategoryModal}>{t('Create_user_room_category')}</Button>
						</>
					) : (
						<>
							<Field>
								<FieldLabel>{t('User_room_category_select')}</FieldLabel>
								<FieldRow>
									<Select options={selectOptions} value={selectedCategory} onChange={(value) => setSelectedCategory(String(value))} />
								</FieldRow>
							</Field>
							<Box display='flex' flexDirection='column' gap={8} mbs={12}>
								<Button primary loading={submitting} onClick={() => void handleApply()}>
									{t('Apply')}
								</Button>
								{containingCategory && (
									<Button secondary danger loading={submitting} onClick={() => void handleRemove()}>
										{t('User_room_category_remove_from', { name: containingCategory.name })}
									</Button>
								)}
								<Button secondary onClick={openCreateCategoryModal}>
									{t('Create_user_room_category')}
								</Button>
							</Box>
						</>
					)}
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Close')}</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default UserRoomCategoryForRoomModal;
