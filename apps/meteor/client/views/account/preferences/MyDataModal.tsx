import {
	Button,
	Box,
	Modal,
	ModalHeader,
	ModalIcon,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type MyDataModalProps = {
	onCancel: () => void;
	title: string;
	text?: ReactNode;
};

const MyDataModal = ({ onCancel, title, text, ...props }: MyDataModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal {...props}>
			<ModalHeader>
				<ModalIcon color='status-font-on-success' name='circle-check' />
				<ModalTitle>{title}</ModalTitle>
				<ModalClose onClick={onCancel} />
			</ModalHeader>
			{text && (
				<ModalContent fontScale='p2'>
					<Box mb={8}>{text}</Box>
				</ModalContent>
			)}
			<ModalFooter>
				<ModalFooterControllers>
					<Button primary onClick={onCancel}>
						{t('Ok')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default MyDataModal;
