import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';

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
			<Box
				is='p'
				marginBlockEnd={16}
				dangerouslySetInnerHTML={{
					__html: DOMPurify.sanitize(
						t('The_setting_s_is_configured_to_s_and_you_are_accessing_from_s', {
							settingName: t('Site_Url'),
							configuredUrl: siteUrl,
							currentUrl,
						}),
					),
				}}
			/>
			<p
				dangerouslySetInnerHTML={{
					__html: DOMPurify.sanitize(t('Do_you_want_to_change_to_s_question', { currentUrl })),
				}}
			/>
		</GenericModal>
	);
};

export default UrlChangeModal;
