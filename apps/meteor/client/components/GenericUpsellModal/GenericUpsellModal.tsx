import { Box, Button, Modal } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode, ReactElement, ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

type GenericUpsellModalProps = {
	children?: ReactNode;
	tagline?: ReactNode;
	cancelText?: ReactNode;
	confirmText?: ReactNode;
	title: string | ReactElement;
	subtitle?: string | ReactElement;
	description?: string | ReactElement;
	icon?: IconName;
	img: ComponentProps<typeof Modal.HeroImage>['src'];
	onCancel?: () => void;
	onClose: () => void;
	onConfirm?: () => void;
	annotation?: ReactNode;
} & ComponentProps<typeof Modal>;

const GenericUpsellModal = ({
	tagline,
	title,
	subtitle,
	img,
	cancelText,
	confirmText,
	icon,
	description,
	onClose,
	onCancel,
	onConfirm,
	annotation,
	...props
}: GenericUpsellModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				{icon && <Modal.Icon name={icon} />}
				<Modal.HeaderText>
					<Modal.Tagline color='font-annotation'>{tagline ?? t('Premium_capability')}</Modal.Tagline>
					<Modal.Title>{title}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close aria-label={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Modal.HeroImage src={img} alt='' />
				{subtitle && (
					<Box is='h3' fontScale='h3'>
						{subtitle}
					</Box>
				)}
				{description && (
					<Box style={{ whiteSpace: 'break-spaces' }} fontScale='p2' mbs={16}>
						{description}
					</Box>
				)}
			</Modal.Content>
			<Modal.Footer justifyContent={annotation ? 'space-between' : 'flex-end'}>
				{annotation && <Modal.FooterAnnotation>{annotation}</Modal.FooterAnnotation>}
				{(onCancel || onConfirm) && (
					<Modal.FooterControllers>
						{onCancel && (
							<Button secondary onClick={onCancel}>
								{cancelText ?? t('Cancel')}
							</Button>
						)}
						{onConfirm && (
							<Button primary onClick={onConfirm}>
								{confirmText ?? t('Upgrade')}
							</Button>
						)}
					</Modal.FooterControllers>
				)}
			</Modal.Footer>
		</Modal>
	);
};

export default GenericUpsellModal;
