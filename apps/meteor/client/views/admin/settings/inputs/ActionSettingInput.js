import { Button, Field } from '@rocket.chat/fuselage';
import React from 'react';

import { useMethod } from '../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';

function ActionSettingInput({ _id, actionText, value, disabled, sectionChanged }) {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const actionMethod = useMethod(value);

	const handleClick = async () => {
		try {
			const data = await actionMethod();
			const args = [data.message].concat(data.params);
			dispatchToastMessage({ type: 'success', message: t(...args) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<>
			<Field.Row>
				<Button data-qa-setting-id={_id} children={t(actionText)} disabled={disabled || sectionChanged} primary onClick={handleClick} />
			</Field.Row>
			{sectionChanged && <Field.Hint>{t('Save_to_enable_this_action')}</Field.Hint>}
		</>
	);
}

export default ActionSettingInput;
