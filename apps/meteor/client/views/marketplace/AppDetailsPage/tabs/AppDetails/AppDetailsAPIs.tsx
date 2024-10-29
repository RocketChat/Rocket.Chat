import type { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { apiCurlGetter } from '../../../helpers/apiCurlGetter';
import { useAppAPIsQuery } from '../../../hooks/useAppAPIsQuery';

type AppDetailsAPIsProps = {
	appId: App['id'];
};

const AppDetailsAPIs = ({ appId }: AppDetailsAPIsProps) => {
	const { t } = useTranslation();
	const absoluteUrl = useAbsoluteUrl();
	const getApiCurl = apiCurlGetter(absoluteUrl);

	const { isSuccess, data } = useAppAPIsQuery(appId);

	if (!isSuccess || !data) {
		return null;
	}

	return (
		<Box is='section'>
			<Box display='flex' flexDirection='column'>
				<Box fontScale='h4' mb={12}>
					{t('APIs')}
				</Box>
				{data.map((api) => (
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
		</Box>
	);
};

export default AppDetailsAPIs;
