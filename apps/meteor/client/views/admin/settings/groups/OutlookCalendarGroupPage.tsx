import type { ISetting } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BaseGroupPage from './BaseGroupPage';
import { useEditableSettings } from '../../EditableSettingsContext';

export type OutlookCalendarGroupPageProps = ISetting & {
	onClickBack?: () => void;
};

const readErrorKey = async (error: unknown): Promise<string | undefined> => {
	if (!(error instanceof Response)) {
		return undefined;
	}

	const body: unknown = await error.json().catch(() => undefined);

	if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
		return body.error;
	}

	return undefined;
};

function OutlookCalendarGroupPage({ _id, i18nLabel, onClickBack, ...group }: OutlookCalendarGroupPageProps) {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const testConnection = useEndpoint('POST', '/v1/exchange.testConnection');
	const outlookEnabled = useSetting('Outlook_Calendar_Enabled', false);
	const serverMode = useSetting('Outlook_Calendar_Mode') === 'server';

	const editableSettings = useEditableSettings(useMemo(() => ({ group: _id }), [_id]));

	const changed = useMemo(() => editableSettings.some(({ changed }) => changed), [editableSettings]);

	const handleTestConnectionButtonClick = async (): Promise<void> => {
		try {
			const { message } = await testConnection();
			dispatchToastMessage({ type: 'success', message: t(message) });
		} catch (error) {
			const key = (await readErrorKey(error)) ?? 'Outlook_Calendar_Test_Connection_failed';
			dispatchToastMessage({ type: 'error', message: t(key) });
		}
	};

	return (
		<BaseGroupPage
			_id={_id}
			i18nLabel={i18nLabel}
			onClickBack={onClickBack}
			{...group}
			headerButtons={
				<Button disabled={!outlookEnabled || !serverMode || changed} onClick={handleTestConnectionButtonClick}>
					{t('Test_Connection')}
				</Button>
			}
		/>
	);
}

export default memo(OutlookCalendarGroupPage);
