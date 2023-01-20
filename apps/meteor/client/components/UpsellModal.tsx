import type { Icon } from '@rocket.chat/fuselage';
import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement, ComponentProps } from 'react';
import React from 'react';

type UpsellModalProps = {
	children?: ReactNode;
	tagline?: ReactNode;
	cancelText?: ReactNode;
	confirmText?: ReactNode;
	title: string | ReactElement;
	subtitle?: string | ReactElement;
	description?: string | ReactElement;
	icon?: ComponentProps<typeof Icon>['name'];
	img: ComponentProps<typeof Modal.HeroImage>['src'];
	onCancel?: () => void;
	onClose?: () => void;
	onConfirm: () => void;
};

const UpsellModal = ({
	tagline,
	title,
	subtitle,
	img,
	cancelText,
	confirmText,
	icon,
	description,
	onCancel,
	onConfirm,
	onClose = onCancel,
}: UpsellModalProps) => {
	const t = useTranslation();

	return (
		<Modal>
			<Modal.Header>
				{icon && <Modal.Icon name={icon} />}
				<Modal.HeaderText>
					<Modal.Tagline color='font-annotation'>{tagline ?? t('Enterprise_Feature')}</Modal.Tagline>
					<Modal.Title>{title}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Modal.HeroImage src={img} />
				{subtitle && (
					<Box is='h3' fontScale='h3'>
						{subtitle}
					</Box>
				)}
				<br />
				{description && <Box fontScale='p2'>{description}</Box>}
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					{onCancel && (
						<Button secondary onClick={onCancel}>
							{cancelText ?? t('Close')}
						</Button>
					)}
					{onConfirm && (
						<Button primary onClick={onConfirm}>
							{confirmText ?? t('Talk_To_Sales')}
						</Button>
					)}
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default UpsellModal;
