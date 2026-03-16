import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRef, type ComponentProps, type FormEvent, type FormEventHandler } from 'react';

import PlaceholderSelector from './TemplatePlaceholderSelector';
import type { TemplateParameter } from '../../types/template';

type TemplatePlaceholderInputProps = Omit<ComponentProps<typeof TextInput>, 'value' | 'onChange'> & {
	type?: TemplateParameter['type'];
	value: string;
	contact?: Serialized<ILivechatContact>;
	onChange(value: string): void;
};

const TemplatePlaceholderInput = ({ contact, value = '', type, onChange, ...props }: TemplatePlaceholderInputProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChange = (event: FormEvent<HTMLInputElement> | string) => {
		onChange(typeof event === 'string' ? event : event.currentTarget.value);
	};

	const addon = type === 'media' ? <Icon name='link' /> : undefined;

	const handleOpenToggle = useEffectEvent((isOpen: boolean) => {
		if (!isOpen) inputRef.current?.focus();
	});

	return (
		<Box display='flex' width='100%'>
			<TextInput {...props} ref={inputRef} value={value} addon={addon} onChange={handleChange as FormEventHandler<HTMLElement>} />

			<PlaceholderSelector disabled={type !== 'text'} mis={12} contact={contact} onSelect={handleChange} onOpenChange={handleOpenToggle} />
		</Box>
	);
};

export default TemplatePlaceholderInput;
