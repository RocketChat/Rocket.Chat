import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React from 'react';

export type SensitiveDataWarningModalProps = {
	onConfirm: () => void;
	onCancel: () => void;
} & Omit<ComponentProps<typeof GenericModal>, 'onConfirm' | 'onCancel' | 'title' | 'cancelText' | 'confirmText' | 'variant'>;

const SensitiveDataWarningModal = ({ onConfirm, onCancel, ...props }: SensitiveDataWarningModalProps) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			title={t('Sensitive_information_detected')}
			cancelText={t('Edit_message')}
			confirmText={t('Send_anyway')}
			onCancel={onCancel}
			onConfirm={onConfirm}
			{...props}
		>
			<Box is='p' mbe={16} fontScale='p2' style={{ whiteSpace: 'pre-wrap' }}>
				{t('Sensitive_information_warning')}
			</Box>
		</GenericModal>
	);
};

export default SensitiveDataWarningModal;
