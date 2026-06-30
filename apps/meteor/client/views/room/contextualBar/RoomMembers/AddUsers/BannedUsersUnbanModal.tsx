import {
	Modal,
	Box,
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
} from '@rocket.chat/fuselage';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

type BannedUsersUnbanModalProps = {
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
				<Box>{t('User_is_banned_from_room_confirm_unban')}</Box>
				{error && (
					<Box color='danger' fontScale='c1' mbs={8}>
						{error}
					</Box>
				)}
			</ModalContent>
			<ModalFooter justifyContent='space-between'>
				<ModalFooterAnnotation>
					<Box display='flex' alignItems='center'>
						<CheckBox checked={unbanConfirmed} onChange={() => setUnbanConfirmed((prev) => !prev)} id={checkboxId} />
						<Label htmlFor={checkboxId} mis={8}>
							{t('Yes_unban_user')}
						</Label>
					</Box>
				</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary onClick={handleConfirm} disabled={!unbanConfirmed} loading={loading}>
						{t('Add_users')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default BannedUsersUnbanModal;
