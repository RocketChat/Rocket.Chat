import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useAbsoluteUrl, useSetModal } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

export type PermissionFlowModalType = 'denied' | 'incomingPrompt' | 'outgoingPrompt' | 'deviceChangePrompt';

type PermissionFlowModalProps = {
	onCancel: () => void;
	onConfirm: () => void;
	type: PermissionFlowModalType;
};

// MarkdownText is a bit overkill for this
// This css rules ensures that `\n` actually breaks lines.
const breakSpaces = css`
	white-space: break-spaces;
`;

const getFooter = (
	type: PermissionFlowModalProps['type'],
	{
		onCancel,
		onConfirm,
		onClose,
		t,
	}: { onCancel: () => void; onConfirm: () => void; onClose: () => void; t: ReturnType<typeof useTranslation>['t'] },
) => {
	switch (type) {
		case 'denied':
			return [
				<Button key='cancel' onClick={onClose}>
					{t('Cancel')}
				</Button>,
			];
		case 'incomingPrompt':
			return [
				<Button key='cancel' danger onClick={onCancel} icon='phone-off'>
					{t('VoIP_cancel_and_reject')}
				</Button>,
				<Button key='confirm' success onClick={onConfirm} icon='phone'>
					{t('VoIP_allow_and_accept')}
				</Button>,
			];
		case 'outgoingPrompt':
			return [
				<Button key='cancel' onClick={onClose}>
					{t('Cancel')}
				</Button>,
				<Button key='confirm' success onClick={onConfirm} icon='phone'>
					{t('VoIP_allow_and_call')}
				</Button>,
			];
		case 'deviceChangePrompt':
			return [
				<Button key='cancel' onClick={onClose}>
					{t('Cancel')}
				</Button>,
				<Button key='confirm' primary onClick={onConfirm}>
					{t('Allow')}
				</Button>,
			];
	}
};

const PermissionFlowModal = ({ onCancel, onConfirm, type }: PermissionFlowModalProps) => {
	const { t } = useTranslation();
	const modalId = useId();
	const absoluteUrl = useAbsoluteUrl();
	const setModal = useSetModal();

	const onClose = () => {
		setModal(null);
	};

	return (
		<Modal aria-labelledby={modalId}>
			<Modal.Header>
				<Modal.Title id={modalId}>{t('VoIP_device_permission_required')}</Modal.Title>
				<Modal.Close aria-label={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box is='span' className={breakSpaces} fontScale='p2'>
					{t('VoIP_device_permission_required_description', {
						workspaceUrl: absoluteUrl(''),
					})}
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>{getFooter(type, { onCancel, onConfirm, onClose, t })}</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default PermissionFlowModal;
