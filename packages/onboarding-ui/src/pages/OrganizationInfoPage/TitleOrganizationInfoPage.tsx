import { FormPageLayout } from '@rocket.chat/layout';
import { Trans } from 'react-i18next';

const TitleOrganizationInfoPage = () => (
	<Trans i18nKey='page.cloudDescription.title'>
		Let's launch your workspace and
		<FormPageLayout.TitleHighlight>14-day trial Launch</FormPageLayout.TitleHighlight>
	</Trans>
);

export default TitleOrganizationInfoPage;
