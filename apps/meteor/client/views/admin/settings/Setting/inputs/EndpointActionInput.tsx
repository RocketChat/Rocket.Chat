import { Button, FieldRow, FieldHint } from '@rocket.chat/fuselage';
import type { Method, PathPattern } from '@rocket.chat/rest-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { SettingInputProps } from './types';

type EndpointActionInputProps = SettingInputProps & {
	actionText: TranslationKey;
	sectionChanged: boolean;
	actionEndpoint: {
		method: Method;
		path: PathPattern;
	};
};

type ActionResponse = { message: TranslationKey; params?: string[] };

function EndpointActionInput({ actionText, actionEndpoint, hint, disabled, sectionChanged }: EndpointActionInputProps): ReactElement {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const callEndpoint = useEndpoint(actionEndpoint.method, actionEndpoint.path);

	const handleClick = async (): Promise<void> => {
		try {
			const data = (await callEndpoint({} as never)) as ActionResponse;
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

export default EndpointActionInput;
