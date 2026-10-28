import { FormPageLayout } from '@rocket.chat/layout';
import { Trans } from 'react-i18next';

const TitleCreateFirstMemberPage = () => (
	<Trans i18nKey='page.createFirstMember.title'>
		Create first
		<FormPageLayout.TitleHighlight>workspace member</FormPageLayout.TitleHighlight>
	</Trans>
);

export default TitleCreateFirstMemberPage;
