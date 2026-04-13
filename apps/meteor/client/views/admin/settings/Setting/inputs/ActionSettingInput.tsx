import { isActionSettingWithEndpoint } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import type { PathPattern, Method } from '@rocket.chat/rest-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import EndpointActionInput from './EndpointActionInput';
import MethodActionInput from './MethodActionInput';
import type { SettingInputProps } from './types';

type ActionSettingInputProps = SettingInputProps & {
	value: keyof ServerMethods | { method: Method; path: PathPattern };
	actionText: TranslationKey;
	sectionChanged: boolean;
};

function ActionSettingInput({ value, ...rest }: ActionSettingInputProps): ReactElement {
	if (isActionSettingWithEndpoint(value)) {
		return <EndpointActionInput endpoint={{ method: value.method, path: value.path }} {...rest} />;
	}

	return <MethodActionInput value={value} {...rest} />;
}

export default ActionSettingInput;
