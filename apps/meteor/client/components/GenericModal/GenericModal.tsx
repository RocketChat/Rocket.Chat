import { Button, Modal } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps, ReactElement, ReactNode } from 'react';
import React from 'react';

import type { RequiredModalProps } from './withDoNotAskAgain';
import { withDoNotAskAgain } from './withDoNotAskAgain';

type VariantType = 'danger' | 'warning' | 'info' | 'success';

type GenericModalProps = RequiredModalProps & {
	variant?: VariantType;
	children?: ReactNode;
	cancelText?: ReactNode;
	confirmText?: ReactNode;
	title?: string | ReactElement;
	icon?: IconName | ReactElement | null;
	confirmDisabled?: boolean;
	tagline?: ReactNode;
	onCancel?: () => Promise<void> | void;
	onClose?: () => Promise<void> | void;
	annotation?: ReactNode;
} & Omit<ComponentProps<typeof Modal>, 'title'>;

const iconMap: Record<string, IconName> = {
	danger: 'modal-warning',
	warning: 'modal-warning',
	info: 'info',
	success: 'check',
};

const getButtonProps = (variant: VariantType): ComponentProps<typeof Button> => {
	switch (variant) {
		case 'danger':
			return { danger: true };
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
		return <Modal.Icon color={variant} name={iconMap[variant]} />;
	}

	if (typeof icon === 'string') {
		return <Modal.Icon name={icon} />;
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
	tagline,
	wrapperFunction,
	annotation,
	...props
}) => {
	const t = useTranslation();
	const genericModalId = useUniqueId();

	return (
		<Modal aria-labelledby={`${genericModalId}-title`} wrapperFunction={wrapperFunction} {...props}>
			<Modal.Header>
				{renderIcon(icon, variant)}
				<Modal.HeaderText>
					{tagline && <Modal.Tagline>{tagline}</Modal.Tagline>}
					<Modal.Title id={`${genericModalId}-title`}>{title ?? t('Are_you_sure')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close aria-label={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{children}</Modal.Content>
			<Modal.Footer justifyContent={dontAskAgain ? 'space-between' : 'end'}>
				{dontAskAgain}
				{annotation && !dontAskAgain && <Modal.FooterAnnotation>{annotation}</Modal.FooterAnnotation>}
				<Modal.FooterControllers>
					{onCancel && (
						<Button secondary onClick={onCancel}>
							{cancelText ?? t('Cancel')}
						</Button>
					)}
					{wrapperFunction && (
						<Button {...getButtonProps(variant)} type='submit' disabled={confirmDisabled}>
							{confirmText ?? t('Ok')}
						</Button>
					)}
					{!wrapperFunction && onConfirm && (
						<Button {...getButtonProps(variant)} onClick={onConfirm} disabled={confirmDisabled}>
							{confirmText ?? t('Ok')}
						</Button>
					)}
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export const GenericModalDoNotAskAgain = withDoNotAskAgain<GenericModalProps>(GenericModal);

export default GenericModal;
