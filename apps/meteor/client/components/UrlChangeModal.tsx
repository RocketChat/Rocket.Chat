import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

export type UrlChangeModalProps = {
	onConfirm: () => void;
	siteUrl: string;
	currentUrl: string;
	onClose: () => void;
};

const UrlChangeModal = ({ onConfirm, siteUrl, currentUrl, onClose }: UrlChangeModalProps) => {
	const { t } = useTranslation();
	return (
		<GenericModal variant='warning' title={t('Warning')} onConfirm={onConfirm} onClose={onClose} onCancel={onClose} confirmText={t('Yes')}>
			<Box is='p' marginBlockEnd={16}>
				<Trans
					i18nKey='The_setting_s_is_configured_to_s_and_you_are_accessing_from_s'
					values={{ settingName: t('Site_Url'), configuredUrl: siteUrl, currentUrl }}
					components={{ bold: <Box is='span' fontWeight='bold' /> }}
				/>
			</Box>
			<p>
				<Trans
					i18nKey='Do_you_want_to_change_to_s_question'
					values={{ currentUrl }}
					components={{ bold: <Box is='span' fontWeight='bold' /> }}
				/>
			</p>
		</GenericModal>
	);
};

export default UrlChangeModal;
