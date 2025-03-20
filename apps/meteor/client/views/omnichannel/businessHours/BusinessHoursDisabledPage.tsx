import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction, StatesLink, Box } from '@rocket.chat/fuselage';
import { useRole, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageContent } from '../../../components/Page';

const BusinessHoursDisabledPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const isAdmin = useRole('admin');

	return (
		<Page>
			<PageHeader title={t('Business_Hours')} />
			<PageContent>
				<Box display='flex' justifyContent='center' height='100%'>
					<States>
						<StatesIcon name='clock' />
						<StatesTitle>{t('Business_hours_is_disabled')}</StatesTitle>
						<StatesSubtitle>{t('Business_hours_is_disabled_description')}</StatesSubtitle>
						{isAdmin && (
							<StatesActions>
								<StatesAction onClick={() => router.navigate('/admin/settings/Omnichannel')}>{t('Enable_business_hours')}</StatesAction>
							</StatesActions>
						)}
						<StatesLink target='_blank' href='https://go.rocket.chat/i/omnichannel-docs'>
							{t('Learn_more_about_business_hours')}
						</StatesLink>
					</States>
				</Box>
			</PageContent>
		</Page>
	);
};

export default BusinessHoursDisabledPage;
