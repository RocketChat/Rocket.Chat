import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Box, TextInput } from '@rocket.chat/fuselage';
import type { ComponentProps, FormEvent, FormEventHandler } from 'react';

import PlaceholderSelector from './TemplatePlaceholderSelector';

type TemplatePlaceholderInputProps = Omit<ComponentProps<typeof TextInput>, 'value' | 'onChange'> & {
	contact?: Serialized<ILivechatContact>;
	value: string;
	onChange(value: string): void;
};

const TemplatePlaceholderInput = ({ contact, value = '', onChange, ...props }: TemplatePlaceholderInputProps) => {
	const handleChange = (event: FormEvent<HTMLInputElement> | string) => {
		onChange(typeof event === 'string' ? event : event.currentTarget.value);
	};

	return (
		<Box display='flex' width='100%'>
			<TextInput {...props} value={value} onChange={handleChange as FormEventHandler<HTMLElement>} />

			<PlaceholderSelector mis={12} contact={contact} onSelect={handleChange} />
		</Box>
	);
};

export default TemplatePlaceholderInput;
