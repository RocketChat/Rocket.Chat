import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { Stack, Text } from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import RichContent from '../../../../../components/RichContent';
import { apiCurlGetter } from '../../../helpers/apiCurlGetter';
import AppInfoSection from '../../layout/AppInfoSection';

export type AppDetailsAPIsProps = {
	apis: IApiEndpointMetadata[];
};

const AppDetailsAPIs = ({ apis }: AppDetailsAPIsProps) => {
	const { t } = useTranslation();
	const absoluteUrl = useAbsoluteUrl();
	const getApiCurl = apiCurlGetter(absoluteUrl);

	return (
		<AppInfoSection title={<Text fontScale='h4'>{t('APIs')}</Text>}>
			<Stack gap='x16'>
				{apis.map((api) => (
					<Stack key={api.path} gap='x8'>
						<Text fontScale='p2m'>
							{api.methods.join(' | ').toUpperCase()} {api.path}
						</Text>
						{api.methods.map((method, index) => (
							<RichContent key={index}>
								<pre>
									<code>
										{getApiCurl(method, api).map((curlAddress, index) => (
											<Fragment key={index}>
												{curlAddress}
												<br />
											</Fragment>
										))}
									</code>
								</pre>
							</RichContent>
						))}
					</Stack>
				))}
			</Stack>
		</AppInfoSection>
	);
};

export default AppDetailsAPIs;
