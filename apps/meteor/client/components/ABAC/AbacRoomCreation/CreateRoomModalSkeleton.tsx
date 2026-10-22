import { InputBoxSkeleton, Modal, ModalClose, ModalContent, ModalHeader, ModalTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type CreateRoomModalSkeletonProps = {
	title: string;
	onClose: () => void;
};

const CreateRoomModalSkeleton = ({ title, onClose }: CreateRoomModalSkeletonProps) => {
	const { t } = useTranslation();

	return (
		<Modal aria-busy='true' aria-label={title}>
			<ModalHeader>
				<ModalTitle>{title}</ModalTitle>
				<ModalClose title={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent marginBlockEnd={24}>
				{Array.from({ length: 4 }, (_, index) => (
					<InputBoxSkeleton key={index} marginBlockEnd={16} />
				))}
			</ModalContent>
		</Modal>
	);
};

export default CreateRoomModalSkeleton;
