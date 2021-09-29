import { Box, Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React, { FC, ComponentProps, ReactElement, ReactNode } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { withDoNotAskAgain, RequiredModalProps } from './withDoNotAskAgain';

type VariantType = 'danger' | 'warning' | 'info' | 'success';

type GenericModalProps = RequiredModalProps & {
	variant?: VariantType;
	cancelText?: string;
	confirmText?: string;
	title?: string | ReactElement;
	icon?: string | ReactElement | null;
	confirmDisabled?: boolean;
	onCancel?: () => void;
	onClose: () => void;
	onConfirm: () => void;
};

const iconMap = {
	danger: 'modal-warning',
	warning: 'modal-warning',
	info: 'info',
	success: 'check',
};

const getButtonProps = (variant: VariantType): ComponentProps<typeof Button> => {
	switch (variant) {
		case 'danger':
			return { primary: true, danger: true };
		case 'warning':
			return { primary: true };
		default:
			return {};
	}
};

const renderIcon = (icon: GenericModalProps['icon'], variant: VariantType): ReactNode => {
	if (icon === null) {
		return null;
	}

	if (icon === undefined) {
		return <Icon color={variant} name={iconMap[variant]} size={24} />;
	}

	if (typeof icon === 'string') {
		return <Icon color={variant} name={icon} size={24} />;
	}

	return icon;
};

const GenericModal: FC<GenericModalProps> = ({
	variant = 'info',
	children,
	cancelText,
	confirmText,
	title,
	icon,
	onCancel,
	onClose = onCancel,
	onConfirm,
	dontAskAgain,
	confirmDisabled,
	...props
}) => {
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				{renderIcon(icon, variant)}
				<Modal.Title>{title ?? t('Are_you_sure')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content fontScale='p1'>{children}</Modal.Content>
			<Modal.Footer>
				<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
					{dontAskAgain}
					<ButtonGroup align='end' flexGrow={1} maxWidth='full'>
						{onCancel && (
							<Button ghost onClick={onCancel}>
								{cancelText ?? t('Cancel')}
							</Button>
						)}
						<Button {...getButtonProps(variant)} onClick={onConfirm} disabled={confirmDisabled}>
							{confirmText ?? t('Ok')}
						</Button>
					</ButtonGroup>
				</Box>
			</Modal.Footer>
		</Modal>
	);
};

export const GenericModalDoNotAskAgain = withDoNotAskAgain<GenericModalProps>(GenericModal);

export default GenericModal;
