import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import type { ComponentProps, FormEvent, FormEventHandler } from 'react';

import PlaceholderSelector from './TemplatePlaceholderSelector';
import type { PlaceholderMetadata } from '../../definitions/template';

type TemplatePlaceholderInputProps = Omit<ComponentProps<typeof TextInput>, 'value' | 'onChange'> & {
	contact?: Serialized<ILivechatContact>;
	value: string;
	format?: PlaceholderMetadata['format'];
	onChange(value: string): void;
};

const TemplatePlaceholderInput = ({ contact, value = '', format, onChange, ...props }: TemplatePlaceholderInputProps) => {
	const handleChange = (event: FormEvent<HTMLInputElement> | string) => {
		onChange(typeof event === 'string' ? event : event.currentTarget.value);
	};

	const addon = format !== 'TEXT' ? <Icon name='link' /> : undefined;

	return (
		<Box display='flex' width='100%'>
			<TextInput {...props} value={value} addon={addon} onChange={handleChange as FormEventHandler<HTMLElement>} />

			<PlaceholderSelector disabled={format !== 'TEXT'} mis={12} contact={contact} onSelect={handleChange} />
		</Box>
	);
};

export default TemplatePlaceholderInput;
