import type { Method, PathPattern } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';

import type { ActionInputBaseProps } from './ActionInputBase';
import ActionInputBase from './ActionInputBase';

type EndpointActionInputProps = Omit<ActionInputBaseProps, 'onAction'> & {
	actionEndpoint: {
		method: Method;
		path: PathPattern;
	};
};

function EndpointActionInput({ actionEndpoint, ...rest }: EndpointActionInputProps) {
	const callEndpoint = useEndpoint(actionEndpoint.method, actionEndpoint.path);
	return <ActionInputBase onAction={() => callEndpoint({} as never)} {...rest} />;
}

export default EndpointActionInput;
