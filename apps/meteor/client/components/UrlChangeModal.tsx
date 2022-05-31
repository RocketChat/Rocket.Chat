import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import GenericModal from './GenericModal';

type UrlChangeModalProps = {
	onConfirm: () => void;
	siteUrl: string;
	currentUrl: string;
	onClose: () => void;
};

const UrlChangeModal = ({ onConfirm, siteUrl, currentUrl, onClose }: UrlChangeModalProps): ReactElement => {
	const t = useTranslation();
	return (
		<GenericModal variant='warning' title={t('Warning')} onConfirm={onConfirm} onClose={onClose} onCancel={onClose} confirmText={t('Yes')}>
			<Box
				is='p'
				mbe='x16'
				dangerouslySetInnerHTML={{
					__html: t('The_setting_s_is_configured_to_s_and_you_are_accessing_from_s', t('Site_Url'), siteUrl, currentUrl),
				}}
			/>
			<p dangerouslySetInnerHTML={{ __html: t('Do_you_want_to_change_to_s_question', currentUrl) }} />
		</GenericModal>
	);
};

export default UrlChangeModal;
