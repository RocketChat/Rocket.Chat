import { BackgroundLayer, FormPageLayout as FormLayout } from '@rocket.chat/layout';
import type { ComponentProps } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import Description from './Description';
import FormPageLayout from '../../common/FormPageLayout';
import RequestTrialForm from '../../forms/RequestTrialForm';

export type RequestTrialPageProps = ComponentProps<typeof RequestTrialForm>;

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
