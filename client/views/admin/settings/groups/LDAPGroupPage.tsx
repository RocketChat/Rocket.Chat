import { Button } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import type { ISetting } from '../../../../../definition/ISetting';
import { useMethod } from '../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import TabbedGroupPage from './TabbedGroupPage';

function LDAPGroupPage({ _id, ...group }: ISetting): JSX.Element {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const testConnection = useMethod('ldapTestConnection');

	const handleTestConnectionButtonClick = async (): Promise<void> => {
		try {
			await testConnection();
			dispatchToastMessage({
				type: 'success',
				message: t('Connection_success'),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Connection_failed') });
		}
	};

	return (
		<TabbedGroupPage
			_id={_id}
			{...group}
			headerButtons={
				<>
					<Button onClick={handleTestConnectionButtonClick}>{t('Test_Connection')}</Button>
				</>
			}
		/>
	);
}

export default memo(LDAPGroupPage);
