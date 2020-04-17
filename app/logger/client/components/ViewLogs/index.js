import { Meteor } from 'meteor/meteor';
import React, { useEffect, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { Page } from '../../../../../client/components/basic/Page';
import { ansispan } from '../../ansispan';
import { APIClient } from '../../../../utils/client';

export function ViewLogs() {
	const [stdout, setStdout] = useState([]);
	useEffect(() => {
		(async () => {
			const data = await APIClient.v1.get('stdout.queue');

			setStdout(data.queue);
		})();

		const stdoutStreamer = new Meteor.Streamer('stdout');

		stdoutStreamer.on('stdout', (item) => stdout.push(item));

		return () => {
			stdoutStreamer.removeListener('stdout');
		};
	}, []);

	const t = useTranslation();

	return <Page _id='viewlogs' i18nLabel='ViewLogs'>
		<Page.Header title={t('View Logs')}></Page.Header>
		<Box componentClassName='view-logs__terminal' width='full' height='full' dangerouslySetInnerHTML={{ __html: stdout.map(({ string }) => ansispan(string)).join('\n') }} />
	</Page>;
}
