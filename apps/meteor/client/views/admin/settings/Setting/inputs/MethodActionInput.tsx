import type { ServerMethods } from '@rocket.chat/ddp-client';
import { useMethod } from '@rocket.chat/ui-contexts';

import type { ActionInputBaseProps } from './ActionInputBase';
import ActionInputBase from './ActionInputBase';

type MethodActionInputProps = Omit<ActionInputBaseProps, 'onAction'> & {
	value: keyof ServerMethods;
};

function MethodActionInput({ value, ...rest }: MethodActionInputProps) {
	const actionMethod = useMethod(value);
	return <ActionInputBase onAction={actionMethod} {...rest} />;
}

export default MethodActionInput;
