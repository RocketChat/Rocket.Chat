import { Button, Box, Throbber } from '@rocket.chat/fuselage';
import React, { FC, useState } from 'react';

import { Apps } from '../../../../app/apps/client';
import ExternalLink from '../../../components/ExternalLink';
import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const readMeUrl = 'https://go.rocket.chat/i/developing-an-app';

const AppsWhatIsIt: FC = () => {
	const t = useTranslation();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<false | Error>(false);

	const appsRouter = useRoute('admin-marketplace');
	const enableAppsEngine = useMethod('apps/go-enable');
	const isAppsEngineEnabled = useMethod('apps/is-enabled');

	const handleClick = async (): Promise<void> => {
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

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('Apps_WhatIsIt')} />
			<Page.ScrollableContent>
				{error ? (
					<Box fontScale='h4' maxWidth='x600' alignSelf='center'>
						{error.message}
					</Box>
				) : (
					<Box alignSelf='center' maxWidth='x600' width='full' withRichContent>
						<p>{t('Apps_WhatIsIt_paragraph1')}</p>
						<p>{t('Apps_WhatIsIt_paragraph2')}</p>
						<p>
							{t('Apps_WhatIsIt_paragraph3')} <ExternalLink to={readMeUrl} />
						</p>
						<p>{t('Apps_WhatIsIt_paragraph4')}</p>
						<Button primary disabled={loading} minHeight='x40' onClick={handleClick}>
							{loading ? <Throbber inheritColor /> : t('Enable')}
						</Button>
					</Box>
				)}
			</Page.ScrollableContent>
		</Page>
	);
};

export default AppsWhatIsIt;
