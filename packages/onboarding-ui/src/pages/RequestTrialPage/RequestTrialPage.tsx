import { BackgroundLayer, FormPageLayout as FormLayout } from '@rocket.chat/layout';
import { useTranslation, Trans } from 'react-i18next';

import Description from './Description.js';
import FormPageLayout from '../../common/FormPageLayout.js';
import RequestTrialForm, { type RequestTrialFormProps } from '../../forms/RequestTrialForm/index.js';

export type RequestTrialPageProps = RequestTrialFormProps;

const RequestTrialPage = (props: RequestTrialPageProps) => {
	const { t } = useTranslation();

	return (
		<BackgroundLayer>
			<FormPageLayout
				description={<Description />}
				title={
					<Trans i18nKey='page.requestTrial.title'>
						Request a<FormLayout.TitleHighlight>30-day Trial</FormLayout.TitleHighlight>
					</Trans>
				}
				subtitle={t('page.requestTrial.subtitle')}
			>
				<RequestTrialForm {...props} />
			</FormPageLayout>
		</BackgroundLayer>
	);
};

export default RequestTrialPage;
