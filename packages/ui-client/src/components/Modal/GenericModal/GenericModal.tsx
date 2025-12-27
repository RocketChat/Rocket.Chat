import {
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalIcon,
	ModalTagline,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement, ReactNode, ComponentPropsWithoutRef } from 'react';
import { useId, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { RequiredModalProps } from './withDoNotAskAgain';
import { withDoNotAskAgain } from './withDoNotAskAgain';
import { modalStore } from '../../../providers/ModalProvider/ModalStore';

type VariantType = 'danger' | 'secondary-danger' | 'warning' | 'info' | 'success' | 'upsell';

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
	onDismiss?: () => Promise<void> | void;
	annotation?: ReactNode;
} & Omit<ComponentPropsWithoutRef<typeof Modal>, 'title'>;

const iconMap: Record<string, IconName> = {
	danger: 'modal-warning',
	warning: 'modal-warning',
	info: 'info',
	success: 'check',
};

const getButtonProps = (variant: VariantType): ComponentPropsWithoutRef<typeof Button> => {
	switch (variant) {
		case 'danger':
			return { danger: true };
		case 'secondary-danger':
			return { secondary: true, danger: true };
		case 'warning':
		case 'upsell':
			return { primary: true };
		default:
			return {};
	}
};

const renderIcon = (icon: GenericModalProps['icon'], variant: VariantType): ReactNode => {
	if (icon === null || iconMap[variant] === undefined) {
		return null;
	}

	if (icon === undefined) {
		return <ModalIcon color={variant} name={iconMap[variant]} />;
	}

	if (typeof icon === 'string') {
		return <ModalIcon name={icon} />;
	}

	return icon;
};

const GenericModal = ({
	variant = 'info',
	children,
	cancelText,
	confirmText,
	title,
	icon,
	onCancel,
	onClose = onCancel,
	onDismiss = onClose,
	onConfirm,
	dontAskAgain,
	confirmDisabled,
	tagline,
	wrapperFunction,
	annotation,
	...props
}: GenericModalProps) => {
	const { t } = useTranslation();
	const genericModalId = useId();

	const dismissedRef = useRef(true);

	const taglineColor = variant === 'upsell' ? 'annotation' : undefined;

	const handleConfirm = useEffectEvent(() => {
		dismissedRef.current = false;
		onConfirm?.();
	});

	const handleCancel = useEffectEvent(() => {
		dismissedRef.current = false;
		onCancel?.();
	});

	const handleCloseButtonClick = useEffectEvent(() => {
		dismissedRef.current = true;
		onClose?.();
	});

	const handleDismiss = useEffectEvent(() => {
		dismissedRef.current = true;
		onDismiss?.();
	});

	useEffect(() => {
		const thisModal = modalStore.current;

		return () => {
			if (thisModal === modalStore.current) return;
			if (!dismissedRef.current) return;
			handleDismiss();
		};
	}, [handleDismiss]);

	return (
		<Modal aria-labelledby={`${genericModalId}-title`} wrapperFunction={wrapperFunction} {...props}>
			<ModalHeader>
				{renderIcon(icon, variant)}
				<ModalHeaderText>
					{tagline && <ModalTagline color={taglineColor}>{tagline}</ModalTagline>}
					<ModalTitle id={`${genericModalId}-title`}>{title ?? t('Are_you_sure')}</ModalTitle>
				</ModalHeaderText>
				{onClose && <ModalClose aria-label={t('Close')} onClick={handleCloseButtonClick} />}
			</ModalHeader>
			<ModalContent fontScale='p2'>{children}</ModalContent>
			<ModalFooter justifyContent={dontAskAgain || annotation ? 'space-between' : 'end'}>
				{dontAskAgain}
				{annotation && !dontAskAgain && <ModalFooterAnnotation>{annotation}</ModalFooterAnnotation>}
				<ModalFooterControllers>
					{onCancel && (
						<Button secondary onClick={handleCancel}>
							{cancelText ?? t('Cancel')}
						</Button>
					)}
					{wrapperFunction && (
						<Button {...getButtonProps(variant)} type='submit' disabled={confirmDisabled}>
							{confirmText ?? t('Ok')}
						</Button>
					)}
					{!wrapperFunction && onConfirm && (
						<Button {...getButtonProps(variant)} onClick={handleConfirm} disabled={confirmDisabled}>
							{confirmText ?? t('Ok')}
						</Button>
					)}
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export const GenericModalDoNotAskAgain = withDoNotAskAgain<GenericModalProps>(GenericModal);

export default GenericModal;
