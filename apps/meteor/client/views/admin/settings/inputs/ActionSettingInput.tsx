import { Button, Field } from '@rocket.chat/fuselage';
import { useMethod, ServerMethods, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import type keys from '../../../../../packages/rocketchat-i18n/i18n/en.i18n.json';

type ActionSettingInputProps = {
	_id: string;
	actionText: keyof typeof keys;
	value: keyof ServerMethods;
	disabled: boolean;
	sectionChanged: boolean;
};
function ActionSettingInput({ _id, actionText, value, disabled, sectionChanged }: ActionSettingInputProps): ReactElement {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const actionMethod = useMethod(value);

	const handleClick = async (): Promise<void> => {
		try {
			const data: { message: keyof typeof keys; params: string[] } = await actionMethod();

			dispatchToastMessage({ type: 'success', message: t(data.message, ...data.params) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	};

	return (
		<>
			<Field.Row>
				<Button data-qa-setting-id={_id} disabled={disabled || sectionChanged} primary onClick={handleClick}>
					{t(actionText)}
				</Button>
			</Field.Row>
			{sectionChanged && <Field.Hint>{t('Save_to_enable_this_action')}</Field.Hint>}
		</>
	);
}

export default ActionSettingInput;
