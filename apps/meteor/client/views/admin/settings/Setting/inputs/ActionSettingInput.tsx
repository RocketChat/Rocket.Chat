import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Button, FieldRow, FieldHint } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { SettingInputProps } from './types';

type ActionSettingInputProps = SettingInputProps & {
	value: keyof ServerMethods;
	actionText: TranslationKey;
	sectionChanged: boolean;
};

function ActionSettingInput({ actionText, value, hint, disabled, sectionChanged }: ActionSettingInputProps): ReactElement {
	const { t } = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const actionMethod = useMethod(value);

	const handleClick = async (): Promise<void> => {
		try {
			const data: { message: TranslationKey; params?: string[] } = await actionMethod();

			const params = data.params || [];
			dispatchToastMessage({ type: 'success', message: t(data.message, { postProcess: 'sprintf', sprintf: params }) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<>
			<FieldRow>
				<Button disabled={disabled || sectionChanged} primary onClick={handleClick}>
					{t(actionText)}
				</Button>
			</FieldRow>
			{sectionChanged && <FieldHint>{t('Save_to_enable_this_action')}</FieldHint>}
			{hint && <FieldHint>{hint}</FieldHint>}
		</>
	);
}

export default ActionSettingInput;
