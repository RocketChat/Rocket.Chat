import type { ServerMethods } from '@rocket.chat/ddp-client';
import type { Method, PathPattern } from '@rocket.chat/rest-typings';
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
		method: Method;
		path: PathPattern;
	};
};

function ActionSettingInput({ actionEndpoint, ...rest }: ActionSettingInputProps): ReactElement {
	if (actionEndpoint) {
		return <EndpointActionInput actionEndpoint={actionEndpoint} {...rest} />;
	}

	return <MethodActionInput {...rest} />;
}

export default ActionSettingInput;
