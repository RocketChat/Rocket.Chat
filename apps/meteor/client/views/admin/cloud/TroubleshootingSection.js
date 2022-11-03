import { Box, Button, ButtonGroup, Throbber } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import Subtitle from '../../../components/Subtitle';
import { statusPageUrl } from './constants';

function TroubleshootingSection({ onRegisterStatusChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [isSyncing, setSyncing] = useSafely(useState(false));

	const syncWorkspace = useMethod('cloud:syncWorkspace');

	const handleSyncButtonClick = async () => {
		setSyncing(true);

		try {
			const isSynced = await syncWorkspace();

			if (!isSynced) {
				throw Error(t('An error occured syncing'));
			}

			dispatchToastMessage({ type: 'success', message: t('Sync Complete') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await (onRegisterStatusChange && onRegisterStatusChange());
			setSyncing(false);
		}
	};

	return (
		<Box is='section' {...props}>
			<Subtitle>{t('Cloud_troubleshooting')}</Subtitle>

			<Box withRichContent color='default'>
				<p>{t('Cloud_workspace_support')}</p>
			</Box>

			<ButtonGroup>
				<Button disabled={isSyncing} minHeight='x40' onClick={handleSyncButtonClick}>
					{isSyncing ? <Throbber is='span' inheritColor /> : t('Sync')}
				</Button>
			</ButtonGroup>

			<Box withRichContent color='default'>
				<p>
					{t('Cloud_status_page_description')}:{' '}
					<a href={statusPageUrl} target='_blank' rel='noopener noreferrer'>
						{statusPageUrl}
					</a>
				</p>
			</Box>
		</Box>
	);
}

export default TroubleshootingSection;
