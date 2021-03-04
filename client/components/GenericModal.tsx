import { Box, Button, ButtonGroup, Icon, Modal, ButtonProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { withDoNotAskAgain, RequiredModalProps } from './withDoNotAskAgain';

enum Variant {
	Danger = 'danger',
	Warning = 'warning',
	Info = 'info',
	Success = 'success'
}

type GenericModalProps = RequiredModalProps & {
	variant?: Variant;
	cancelText?: string;
	confirmText?: string;
	title?: string;
	icon?: string;
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

const getButtonProps = (variant: Variant): ButtonProps => {
	switch (variant) {
		case Variant.Danger:
			return { primary: true, danger: true };
		case Variant.Warning:
			return { primary: true };
		default:
			return { };
	}
};

const GenericModal: FC<GenericModalProps> = ({
	variant = Variant.Info,
	children,
	cancelText,
	confirmText,
	title,
	icon,
	onCancel,
	onClose,
	onConfirm,
	dontAskAgain,
	...props
}) => {
	const t = useTranslation();

	return <Modal {...props}>
		<Modal.Header>
			<Icon color={variant} name={icon ?? iconMap[variant]} size={24}/>
			<Modal.Title>{title ?? t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{children}
		</Modal.Content>
		<Modal.Footer>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
				{dontAskAgain}
				<ButtonGroup align='end' flexGrow={1}>
					{onCancel && <Button ghost onClick={onCancel}>{cancelText ?? t('Cancel')}</Button>}
					<Button {...getButtonProps(variant)} onClick={onConfirm}>{confirmText ?? t('Ok')}</Button>
				</ButtonGroup>
			</Box>
		</Modal.Footer>
	</Modal>;
};

// TODO update withDoNotAskAgain to use onConfirm istead of confirm
export const GenericModalDoNotAskAgain = withDoNotAskAgain<GenericModalProps>(({ confirm, ...props }) => <GenericModal onConfirm={confirm} {...props}/>);

export default GenericModal;
