import { Box, Divider } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useAbsoluteUrl } from '../../../contexts/ServerContext';
import { apiCurlGetter } from './helpers';

type APIsDisplayProps = {
	apis: {
		path: string;
		computedPath: string;
		methods: unknown[];
		examples: Record<string, unknown>;
	}[];
};

const APIsDisplay: FC<APIsDisplayProps> = ({ apis }) => {
	const t = useTranslation();

	const absoluteUrl = useAbsoluteUrl();

	const getApiCurl = apiCurlGetter(absoluteUrl);

	return <>
		<Divider />
		<Box display='flex' flexDirection='column'>
			<Box fontScale='s2' mb='x12'>{t('APIs')}</Box>
			{apis.map((api) => <Box key={api.path} mb='x8'>
				<Box fontScale='p2'>{api.methods.join(' | ').toUpperCase()} {api.path}</Box>
				{api.methods.map((method) => <Box>
					<Box withRichContent><pre><code>
						{getApiCurl(method, api).map((curlAddress) => <>{curlAddress}<br /></>)}
					</code></pre></Box>
				</Box>)}
			</Box>)}
		</Box>
	</>;
};

export default APIsDisplay;
