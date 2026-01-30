import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent, ContextualbarFooter, ContextualbarEmptyContent } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../subscription/hooks/useCheckoutUrl';

const AdminUserUpgrade = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'user-page', action: 'buy_more' });
	const openExternalLink = useExternalLink();

	return (
		<>
			<ContextualbarScrollableContent h='full'>
				<ContextualbarEmptyContent icon='warning' title={t('Seat_limit_reached')} subtitle={t('Seat_limit_reached_Description')} />
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => router.navigate('/admin/users')}>{t('Cancel')}</Button>
					<Button primary role='link' onClick={() => openExternalLink(manageSubscriptionUrl)}>
						{t('Buy_more_seats')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminUserUpgrade;
