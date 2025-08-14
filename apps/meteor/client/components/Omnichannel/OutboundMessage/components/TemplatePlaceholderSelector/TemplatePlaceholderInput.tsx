import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import type { ComponentProps, FormEvent, FormEventHandler } from 'react';

import PlaceholderSelector from './TemplatePlaceholderSelector';
import type { TemplateParameter } from '../../definitions/template';

type TemplatePlaceholderInputProps = Omit<ComponentProps<typeof TextInput>, 'value' | 'onChange'> & {
	type?: TemplateParameter['type'];
	value: string;
	contact?: Serialized<ILivechatContact>;
	onChange(value: string): void;
};

const TemplatePlaceholderInput = ({ contact, value = '', type, onChange, ...props }: TemplatePlaceholderInputProps) => {
	const handleChange = (event: FormEvent<HTMLInputElement> | string) => {
		onChange(typeof event === 'string' ? event : event.currentTarget.value);
	};

	const addon = type === 'media' ? <Icon name='link' /> : undefined;

	return (
		<Box display='flex' width='100%'>
			<TextInput {...props} value={value} addon={addon} onChange={handleChange as FormEventHandler<HTMLElement>} />

			<PlaceholderSelector disabled={type !== 'text'} mis={12} contact={contact} onSelect={handleChange} />
		</Box>
	);
};

export default TemplatePlaceholderInput;
