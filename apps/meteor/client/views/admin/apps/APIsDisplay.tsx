import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { Box, Divider } from '@rocket.chat/fuselage';
import { useAbsoluteUrl, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, Fragment } from 'react';

import { apiCurlGetter } from './helpers';

type APIsDisplayProps = {
	apis: IApiEndpointMetadata[];
};

const APIsDisplay: FC<APIsDisplayProps> = ({ apis }) => {
	const t = useTranslation();
	const absoluteUrl = useAbsoluteUrl();
	const getApiCurl = apiCurlGetter(absoluteUrl);

	return (
		<>
			<Divider />
			<Box display='flex' flexDirection='column'>
				<Box fontScale='h4' mb='x12'>
					{t('APIs')}
				</Box>
				{apis.map((api) => (
					<Box key={api.path} mb='x8'>
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

export default APIsDisplay;
