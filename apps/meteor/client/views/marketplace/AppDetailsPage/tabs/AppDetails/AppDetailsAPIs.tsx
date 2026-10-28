import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { Text } from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import ApiReference from './layout/ApiReference';
import { apiCurlGetter } from '../../../helpers/apiCurlGetter';
import RichContent from '../../layout/RichContent';

export type AppDetailsAPIsProps = {
	apis: IApiEndpointMetadata[];
};

const AppDetailsAPIs = ({ apis }: AppDetailsAPIsProps) => {
	const { t } = useTranslation();
	const absoluteUrl = useAbsoluteUrl();
	const getApiCurl = apiCurlGetter(absoluteUrl);

	return (
		<ApiReference title={<Text fontScale='h4'>{t('APIs')}</Text>}>
			{apis.map((api) => (
				<Fragment key={api.path}>
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
				</Fragment>
			))}
		</ApiReference>
	);
};

export default AppDetailsAPIs;
