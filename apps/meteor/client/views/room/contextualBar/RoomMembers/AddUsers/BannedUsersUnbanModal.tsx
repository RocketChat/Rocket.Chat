import {
	Modal,
	Button,
	Label,
	CheckBox,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
	Stack,
	Text,
} from '@rocket.chat/fuselage';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type BannedUsersUnbanModalProps = {
	onClose: () => void;
	onConfirm: () => Promise<void>;
};

const BannedUsersUnbanModal = ({ onClose, onConfirm }: BannedUsersUnbanModalProps) => {
	const { t } = useTranslation();
	const checkboxId = useId();
	const [unbanConfirmed, setUnbanConfirmed] = useState(false);
	const [error, setError] = useState<string>();
	const [loading, setLoading] = useState(false);

	const handleConfirm = async () => {
		setLoading(true);
		setError(undefined);
		try {
			await onConfirm();
		} catch (err: any) {
			setError(err?.message || t('Something_went_wrong'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('User_is_banned')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose title={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Stack gap='x8'>
					<Text>{t('User_is_banned_from_room_confirm_unban')}</Text>
					{error && (
						<Text color='danger' fontScale='c1'>
							{error}
						</Text>
					)}
				</Stack>
			</ModalContent>
			<ModalFooter justify='space-between'>
				<ModalFooterAnnotation>
					<Stack direction='row' align='center' gap={8}>
						<CheckBox checked={unbanConfirmed} onChange={() => setUnbanConfirmed((prev) => !prev)} id={checkboxId} />
						<Label htmlFor={checkboxId}>{t('Yes_unban_user')}</Label>
					</Stack>
				</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button variant='primary' onClick={handleConfirm} disabled={!unbanConfirmed} loading={loading}>
						{t('Add_users')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default BannedUsersUnbanModal;
