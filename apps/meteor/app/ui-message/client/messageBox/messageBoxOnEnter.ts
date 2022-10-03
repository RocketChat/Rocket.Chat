import tinykeys from 'tinykeys';

// const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
// const isSending = (sendOnEnterActive && !withModifier) || (!sendOnEnterActive && withModifier);

export const messageBoxOnEnter = (
	sendOnEnter: boolean,
	target: HTMLTextAreaElement,
	send: (e: KeyboardEvent) => void,
	// insertLineBreak: () => void,
): (() => void) => {
	let canceled = false;
	let fn = (): void => {
		canceled = true;
	};

	setTimeout(() => {
		if (canceled) {
			return;
		}
		fn = tinykeys(target, {
			...(sendOnEnter
				? {
						Enter: (e) => {
							e.preventDefault();
							console.log('Enter', e);
							send(e);
						},
				  }
				: {
						'Shift+Enter': (e) => {
							e.preventDefault();
							send(e);
						},
				  }),
		});
	});

	return () => fn();
};
