import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Button, FieldRow, FieldHint } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type ActionSettingInputProps = {
	_id: string;
	actionText: TranslationKey;
	value: keyof ServerMethods;
	disabled: boolean;
	sectionChanged: boolean;
};
function ActionSettingInput({ _id, actionText, disabled, sectionChanged }: ActionSettingInputProps): ReactElement {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const actionMethod = useEndpoint('POST', '/v1/settings/:_id', { _id });

	const handleClick = async (): Promise<void> => {
		try {
			const data = await actionMethod({ execute: true });

			if (!data) {
				console.warn(`some data expected for ${_id}, but none received`);
				return;
			}

			// TODO: handle Meteor.errors

			console.log(data);

			const params = data?.params || [];
			dispatchToastMessage({ type: 'success', message: t(data?.message, ...params) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<>
			<FieldRow>
				<Button data-qa-setting-id={_id} disabled={disabled || sectionChanged} primary onClick={handleClick}>
					{t(actionText)}
				</Button>
			</FieldRow>
			{sectionChanged && <FieldHint>{t('Save_to_enable_this_action')}</FieldHint>}
		</>
	);
}

export default ActionSettingInput;
