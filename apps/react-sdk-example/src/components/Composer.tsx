import { TextInput, Box } from '@rocket.chat/fuselage';
import type { KeyboardEventHandler } from 'react';
import React from 'react';

export default function Composer({ onSend }: { onSend: (msg: string) => Promise<void> }) {
	const send: KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.key === 'Enter') {
			void onSend(e.currentTarget.value);
			e.currentTarget.value = '';
		}
	};
	return (
		<Box w='full' p={16} h={150}>
			<TextInput w='full' placeholder='Type a message' onKeyDown={send} />
		</Box>
	);
}
