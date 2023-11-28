import { Button, ButtonGroup, ContextualbarFooter, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { ContextualbarScrollableContent } from '../../../components/Contextualbar';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../subscription/hooks/useCheckoutUrl';

const AdminUserUpgrade = () => {
	const t = useTranslation();
	const router = useRouter();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'user-page', action: 'buy_more' });
	const openExternalLink = useExternalLink();

	return (
		<>
			<ContextualbarScrollableContent>
				<States>
					<StatesIcon name='warning' />
					<StatesTitle>{t('Seat_limit_reached')}</StatesTitle>
					<StatesSubtitle>{t('Seat_limit_reached_Description')}</StatesSubtitle>
				</States>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => router.navigate('/admin/users')}>{t('Cancel')}</Button>
					<Button primary onClick={() => openExternalLink(manageSubscriptionUrl)}>
						{t('Buy_more_seats')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminUserUpgrade;
