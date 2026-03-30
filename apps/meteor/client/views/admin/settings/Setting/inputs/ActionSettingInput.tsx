import type { ServerMethods } from '@rocket.chat/ddp-client';
import type { Method, PathPattern } from '@rocket.chat/rest-typings';
import { Button, FieldRow, FieldHint } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { SettingInputProps } from './types';

type ActionSettingInputProps = SettingInputProps & {
	value: keyof ServerMethods;
	actionText: TranslationKey;
	sectionChanged: boolean;
	actionEndpoint?: {
		method: 'GET' | 'POST' | 'DELETE' | 'PUT';
		path: string;
	};
};

type ActionResponse = { message: TranslationKey; params?: string[] };

type ActionLayoutProps = {
	actionText: TranslationKey;
	hint: ActionSettingInputProps['hint'];
	disabled: ActionSettingInputProps['disabled'];
	sectionChanged: boolean;
	onAction: () => Promise<ActionResponse>;
};

function ActionLayout({ actionText, hint, disabled, sectionChanged, onAction }: ActionLayoutProps): ReactElement {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleClick = async (): Promise<void> => {
		try {
			const data = await onAction();
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

function MethodAction({ value, ...layoutProps }: Omit<ActionLayoutProps, 'onAction'> & { value: keyof ServerMethods }): ReactElement {
	const actionMethod = useMethod(value);
	return <ActionLayout {...layoutProps} onAction={actionMethod} />;
}

function EndpointAction({
	actionEndpoint,
	...layoutProps
}: Omit<ActionLayoutProps, 'onAction'> & { actionEndpoint: { method: string; path: string } }): ReactElement {
	const callEndpoint = useEndpoint(actionEndpoint.method as Method, actionEndpoint.path as PathPattern);
	return <ActionLayout {...layoutProps} onAction={callEndpoint as () => Promise<ActionResponse>} />;
}

function ActionSettingInput({ actionEndpoint, value, ...rest }: ActionSettingInputProps): ReactElement {
	if (actionEndpoint) {
		return <EndpointAction actionEndpoint={actionEndpoint} {...rest} />;
	}
	return <MethodAction value={value} {...rest} />;
}

export default ActionSettingInput;
