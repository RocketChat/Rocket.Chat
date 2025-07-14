import { Box, ModalHeroImage } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement, ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

type GenericUpsellModalProps = Omit<ComponentProps<typeof GenericModal>, 'variant' | 'children' | 'onClose' | 'onDismiss'> & {
	subtitle?: string | ReactElement;
	description?: string | ReactElement;
	img: ComponentProps<typeof ModalHeroImage>['src'];

	imgWidth?: ComponentProps<typeof ModalHeroImage>['width'];
	imgHeight?: ComponentProps<typeof ModalHeroImage>['height'];
	imgAlt?: string;
	onClose: () => void;
	onConfirm?: () => void;
};

const GenericUpsellModal = ({
	tagline,
	subtitle,
	img,
	imgAlt = '',
	imgWidth,
	imgHeight,
	description,
	confirmText,
	icon = null,
	...props
}: GenericUpsellModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			{...props}
			icon={icon}
			tagline={tagline ?? t('Premium_capability')}
			variant='upsell'
			confirmText={confirmText ?? t('Upgrade')}
		>
			<ModalHeroImage src={img} alt={imgAlt} width={imgWidth} height={imgHeight} />
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
		</GenericModal>
	);
};

export default GenericUpsellModal;
