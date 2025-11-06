import { Box, Button, Callout } from '@rocket.chat/fuselage';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { Trans, useTranslation } from 'react-i18next';

import AdminABACSettings from './AdminABACSettings';
import AdminABACTabs from './AdminABACTabs';
import { Page, PageContent, PageHeader } from '../../../components/Page';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { links } from '../../../lib/links';

type AdminABACPageProps = {
	shouldShowWarning: boolean;
};

const AdminABACPage = ({ shouldShowWarning }: AdminABACPageProps) => {
	const { t } = useTranslation();
	const tab = useRouteParameter('tab');
	const learnMore = useExternalLink();

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('ABAC')}>
					<Button icon='new-window' secondary onClick={() => learnMore(links.go.abacDocs)}>
						{t('ABAC_Learn_More')}
					</Button>
				</PageHeader>
				{shouldShowWarning && (
					<Box mi={24} mb={16}>
						<Callout type='warning' title={t('ABAC_automatically_disabled_callout')}>
							<Trans i18nKey='ABAC_automatically_disabled_callout_description'>
								Renew your license to continue using all{' '}
								<a href={links.go.abacLicenseRenewalUrl} rel='noopener noreferrer' target='_blank'>
									ABAC capabilities without restriction.
								</a>
							</Trans>
						</Callout>
					</Box>
				)}
				<AdminABACTabs />
				<PageContent>{tab === 'settings' && <AdminABACSettings />}</PageContent>
			</Page>
		</Page>
	);
};

export default AdminABACPage;
