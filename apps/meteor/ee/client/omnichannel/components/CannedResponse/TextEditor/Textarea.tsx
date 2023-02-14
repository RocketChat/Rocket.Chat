import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef } from 'react';

type TextareaProps = ComponentProps<typeof Box>;

const Textarea = forwardRef<Element, TextareaProps>(function Textarea(props, ref) {
	return (
		<Box
			is='textarea'
			ref={ref}
			w='full'
			style={{ wordBreak: 'normal' }}
			rcx-box--animated
			rcx-input-box--type={'textarea'}
			rcx-input-box--undecorated
			{...props}
		/>
	);
});

export default Textarea;
