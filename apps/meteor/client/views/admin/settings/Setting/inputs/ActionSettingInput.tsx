import type { ServerMethods } from '@rocket.chat/ddp-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import EndpointActionInput from './EndpointActionInput';
import MethodActionInput from './MethodActionInput';
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

function ActionSettingInput({ actionEndpoint, ...rest }: ActionSettingInputProps): ReactElement {
	if (actionEndpoint) {
		return <EndpointActionInput actionEndpoint={actionEndpoint} {...rest} />;
	}
	return <MethodActionInput {...rest} />;
}

export default ActionSettingInput;
