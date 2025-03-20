import { Button, Box, Modal } from '@rocket.chat/fuselage';
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
			<Modal.Header>
				<Modal.Icon color='status-font-on-success' name='circle-check' />
				<Modal.Title>{title}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			{text && (
				<Modal.Content fontScale='p2'>
					<Box mb={8}>{text}</Box>
				</Modal.Content>
			)}
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button primary onClick={onCancel}>
						{t('Ok')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default MyDataModal;
