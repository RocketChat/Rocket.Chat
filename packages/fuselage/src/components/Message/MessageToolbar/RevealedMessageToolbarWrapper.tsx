import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';

import MessageToolbarWrapper from './MessageToolbarWrapper';

/** A toolbar wrapper the stories reveal as the application does: while the pointer is over its message or keyboard focus is inside it. */
const RevealedMessageToolbarWrapper = ({ children }: { children?: ReactNode }) => {
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);

	const ref = useCallback((wrapper: HTMLDivElement | null) => {
		const message = wrapper?.closest('.rcx-message');
		if (!message) {
			return;
		}

		const enter = () => setHovered(true);
		const leave = () => setHovered(false);
		const focusIn = (event: Event) => setFocused(event.target instanceof Element && event.target.matches(':focus-visible'));
		const focusOut = (event: Event) => {
			if (!message.contains((event as FocusEvent).relatedTarget as Node | null)) {
				setFocused(false);
			}
		};

		message.addEventListener('mouseenter', enter);
		message.addEventListener('mouseleave', leave);
		message.addEventListener('focusin', focusIn);
		message.addEventListener('focusout', focusOut);

		return () => {
			message.removeEventListener('mouseenter', enter);
			message.removeEventListener('mouseleave', leave);
			message.removeEventListener('focusin', focusIn);
			message.removeEventListener('focusout', focusOut);
		};
	}, []);

	return (
		<MessageToolbarWrapper ref={ref} visible={hovered || focused}>
			{children}
		</MessageToolbarWrapper>
	);
};

export default RevealedMessageToolbarWrapper;
