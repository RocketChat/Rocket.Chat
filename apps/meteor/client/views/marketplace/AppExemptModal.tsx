import { Button, Box, Modal } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../hooks/useExternalLink';
import { useCheckoutUrl } from '../admin/subscription/hooks/useCheckoutUrl';
import { PRICING_LINK } from '../admin/subscription/utils/links';

type AppExemptModalProps = {
	cancel: () => void;
	appName: string;
};

const AppExemptModal = ({ cancel, appName }: AppExemptModalProps) => {
	const { t } = useTranslation();

	const openExternalLink = useExternalLink();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'private-apps-page', action: 'upgrade' });

	const goToManageSubscriptionPage = (): void => {
		openExternalLink(manageSubscriptionUrl);
		cancel();
	};

	const handleCancelButton = (): void => {
		cancel();
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Apps_Cannot_Be_Updated')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close aria-label={t('Close')} onClick={handleCancelButton} />
			</Modal.Header>

			<Modal.Content>
				<Box mbe={28}>{t('Apps_Private_App_Is_Exempt', { appName })}</Box>
				{t('Upgrade_subscription_to_enable_private_apps')}
			</Modal.Content>

			<Modal.Footer justifyContent='space-between'>
				<Modal.FooterAnnotation>
					<a target='_blank' rel='noopener noreferrer' href={PRICING_LINK}>
						{t('Compare_plans')}
					</a>
				</Modal.FooterAnnotation>
				<Modal.FooterControllers>
					<Button onClick={handleCancelButton}>{t('Cancel')}</Button>
					<Button onClick={goToManageSubscriptionPage} primary>
						{t('Upgrade')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AppExemptModal;
