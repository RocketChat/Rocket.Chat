import type { ISetting } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BaseGroupPage from './BaseGroupPage';
import { getEndpointErrorMessage } from '../../../../lib/errorHandling';
import { useEditableSettings } from '../../EditableSettingsContext';

export type ExchangeGroupPageProps = ISetting & {
	onClickBack?: () => void;
};

function ExchangeGroupPage({ _id, i18nLabel, onClickBack, ...group }: ExchangeGroupPageProps) {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const testConnection = useEndpoint('POST', '/v1/exchange.testConnection');
	const exchangeEnabled = useSetting('Outlook_Calendar_Enabled', false);
	const serverMode = useSetting('Exchange_Mode') === 'server';

	const editableSettings = useEditableSettings(useMemo(() => ({ group: _id }), [_id]));

	const changed = useMemo(() => editableSettings.some(({ changed }) => changed), [editableSettings]);

	const handleTestConnectionButtonClick = async (): Promise<void> => {
		try {
			const { message } = await testConnection();
			dispatchToastMessage({ type: 'success', message: t(message) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: await getEndpointErrorMessage(error, 'Exchange_Test_Connection_failed') });
		}
	};

	return (
		<BaseGroupPage
			_id={_id}
			i18nLabel={i18nLabel}
			onClickBack={onClickBack}
			{...group}
			headerButtons={
				<Button disabled={!exchangeEnabled || !serverMode || changed} onClick={handleTestConnectionButtonClick}>
					{t('Test_Connection')}
				</Button>
			}
		/>
	);
}

export default memo(ExchangeGroupPage);
