import { Box, Grid, GridItem } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { AgentsSection, ChannelsSection, DepartmentsSection, StatusSection, TagsSection } from './sections';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../components/Page';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';

const BREAKPOINTS = { xs: 4, sm: 8, md: 8, lg: 12, xl: 6 } as const;

const ReportsPage = () => {
	const { t } = useTranslation();

	const hasPermission = usePermission('view-livechat-reports');
	const isEnterprise = useHasLicenseModule('livechat-enterprise');

	if (!hasPermission || !isEnterprise) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page background='tint'>
			<PageHeader title={t('Reports')} />
			<Box is='p' color='hint' fontScale='p2' mi={24}>
				{t('Omnichannel_Reports_Summary')}
			</Box>
			<PageScrollableContentWithShadow alignItems='center'>
				<Box width='100rem' maxWidth='100%'>
					<Grid>
						<GridItem {...BREAKPOINTS}>
							<StatusSection />
						</GridItem>
						<GridItem {...BREAKPOINTS}>
							<ChannelsSection />
						</GridItem>
						<GridItem {...BREAKPOINTS}>
							<DepartmentsSection />
						</GridItem>
						<GridItem {...BREAKPOINTS}>
							<TagsSection />
						</GridItem>
						<GridItem {...BREAKPOINTS} xl={12}>
							<AgentsSection />
						</GridItem>
					</Grid>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default ReportsPage;
