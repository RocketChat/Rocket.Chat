import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { Box } from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { apiCurlGetter } from '../../../helpers/apiCurlGetter';

type AppDetailsAPIsProps = {
	apis: IApiEndpointMetadata[];
};

const AppDetailsAPIs = ({ apis }: AppDetailsAPIsProps) => {
	const { t } = useTranslation();
	const absoluteUrl = useAbsoluteUrl();
	const getApiCurl = apiCurlGetter(absoluteUrl);

	return (
		<>
			<Box display='flex' flexDirection='column'>
				<Box fontScale='h4' mb={12}>
					{t('APIs')}
				</Box>
				{apis.map((api) => (
					<Box key={api.path} mb={8}>
						<Box fontScale='p2m'>
							{api.methods.join(' | ').toUpperCase()} {api.path}
						</Box>
						{api.methods.map((method, index) => (
							<Box key={index}>
								<Box withRichContent>
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
								</Box>
							</Box>
						))}
					</Box>
				))}
			</Box>
		</>
	);
};

export default AppDetailsAPIs;
