import { TextAreaInput } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef } from 'react';

type TextareaProps = ComponentProps<typeof TextAreaInput>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(props, ref) {
	return <TextAreaInput ref={ref} w='full' style={{ wordBreak: 'normal' }} rcx-input-box--undecorated {...props} />;
});

export default Textarea;
