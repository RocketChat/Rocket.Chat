import type { Method, PathPattern } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';

import type { ActionInputBaseProps } from './ActionInputBase';
import ActionInputBase from './ActionInputBase';

type EndpointActionInputProps = Omit<ActionInputBaseProps, 'onAction'> & {
	endpoint: {
		method: Method;
		path: PathPattern;
	};
};

function EndpointActionInput({ endpoint, ...rest }: EndpointActionInputProps) {
	const callEndpoint = useEndpoint(endpoint.method, endpoint.path);
	return <ActionInputBase onAction={() => callEndpoint({} as never)} {...rest} />;
}

export default EndpointActionInput;
