import { css } from '@rocket.chat/css-in-js';
import {
	Box,
	Button,
	Modal,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

export type PermissionFlowModalType = 'denied' | 'incomingPrompt' | 'outgoingPrompt' | 'deviceChangePrompt' | 'noDevices';

export type PermissionFlowModalProps = {
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
	{ onCancel, onConfirm, t }: { onCancel: () => void; onConfirm: () => void; t: ReturnType<typeof useTranslation>['t'] },
) => {
	switch (type) {
		case 'noDevices':
		case 'denied':
			return [
				<Button key='join-micless' onClick={onCancel} icon='mic-off'>
					{t('Continue_without_mic')}
				</Button>,
			];
		case 'incomingPrompt':
			return [
				<Button key='join-micless' onClick={onCancel} icon='mic-off'>
					{t('Accept_without_mic')}
				</Button>,
				<Button key='confirm' success onClick={onConfirm} icon='phone'>
					{t('VoIP_allow_and_accept')}
				</Button>,
			];
		case 'outgoingPrompt':
			return [
				<Button key='join-micless' onClick={onCancel} icon='mic-off'>
					{t('Call_without_mic')}
				</Button>,
				<Button key='confirm' success onClick={onConfirm} icon='phone'>
					{t('VoIP_allow_and_call')}
				</Button>,
			];
		case 'deviceChangePrompt':
			return [
				<Button key='cancel' onClick={onCancel}>
					{t('Cancel')}
				</Button>,
				<Button key='confirm' primary onClick={onConfirm}>
					{t('Allow')}
				</Button>,
			];
	}
};

const getTitleAndText = (type: PermissionFlowModalProps['type'], t: ReturnType<typeof useTranslation>['t'], workspaceUrl: string) => {
	if (type === 'noDevices') {
		return [t('VoIP_devices_not_found'), t('VoIP_devices_not_found_description')];
	}

	return [
		t('VoIP_device_permission_required'),
		t('VoIP_device_permission_required_description', {
			workspaceUrl,
		}),
	];
};

const PermissionFlowModal = ({ onCancel, onConfirm, type }: PermissionFlowModalProps) => {
	const { t } = useTranslation();
	const modalId = useId();
	const absoluteUrl = useAbsoluteUrl();

	const [title, text] = getTitleAndText(type, t, absoluteUrl(''));

	return (
		<Modal aria-labelledby={modalId}>
			<ModalHeader>
				<ModalTitle id={modalId}>{title}</ModalTitle>
				<ModalClose aria-label={t('Close')} onClick={onCancel} />
			</ModalHeader>
			<ModalContent>
				<Box is='span' className={breakSpaces} fontScale='p2'>
					{text}
				</Box>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>{getFooter(type, { onCancel, onConfirm, t })}</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default PermissionFlowModal;
