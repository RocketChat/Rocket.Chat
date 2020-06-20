import { Button, Box, Throbber } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import { Apps } from '../../../app/apps/client';
import ExternalLink from '../../components/basic/ExternalLink';
import Page from '../../components/basic/Page';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';

const readMeUrl = 'https://github.com/RocketChat/Rocket.Chat.Apps-dev-environment/blob/master/README.md';

function AppsWhatIsIt() {
	const t = useTranslation();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	const appsRouter = useRoute('admin-marketplace');
	const enableAppsEngine = useMethod('apps/go-enable');
	const isAppsEngineEnabled = useMethod('apps/is-enabled');

	const handleClick = async () => {
		setLoading(true);
		try {
			await enableAppsEngine();
			if (await isAppsEngineEnabled()) {
				await Apps.getAppClientManager().initialize();
				await Apps.load(true);
			}
			appsRouter.push();
		} catch (error) {
			setError(error);
		}
	};

	return <Page flexDirection='column'>
		<Page.Header title={t('Apps_WhatIsIt')} />
		<Page.ScrollableContent>
			{error
				? <Box fontScale='s1' maxWidth='x600' alignSelf='center'>{error.message}</Box>
				: <Box alignSelf='center' maxWidth='x600' width='full' withRichContent>
					<p>{t('Apps_WhatIsIt_paragraph1')}</p>
					<p>{t('Apps_WhatIsIt_paragraph2')}</p>
					<p>
						{t('Apps_WhatIsIt_paragraph3')}
						{' '}
						<ExternalLink to={readMeUrl} />
					</p>
					<p>{t('Apps_WhatIsIt_paragraph4')}</p>
					<Button primary disabled={loading} minHeight='x40' onClick={handleClick}>
						{loading ? <Throbber inheritColor /> : t('Enable')}
					</Button>
				</Box>}
		</Page.ScrollableContent>
	</Page>;
}

export default AppsWhatIsIt;
