import { InputBox } from '@rocket.chat/fuselage';
import { useFieldReferencedByInput } from '@rocket.chat/fuselage-forms';
import type { ComponentProps } from 'react';

/** An `InputBox` labelled and described by the fuselage-forms field around it, which has no wrapped `InputBox` of its own. */
const FieldInputBox = (props: ComponentProps<typeof InputBox>) => {
	const fieldProps = useFieldReferencedByInput();

	return <InputBox {...props} {...fieldProps} />;
};

export default FieldInputBox;
