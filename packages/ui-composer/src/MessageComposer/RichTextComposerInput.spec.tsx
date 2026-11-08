import { render, screen } from '@testing-library/react';

import RichTextComposerInput from './RichTextComposerInput';

const setup = (props: Record<string, unknown> = {}) =>
	render(<RichTextComposerInput aria-label='Message' placeholder='Type a message...' {...props} />);

test('should be editable by default', () => {
	setup();

	expect(screen.getByLabelText('Message')).toHaveAttribute('contenteditable', 'true');
	expect(screen.getByLabelText('Message')).not.toHaveAttribute('aria-disabled', 'true');
});

test('should stop being editable when disabled', () => {
	setup({ disabled: true });

	const input = screen.getByLabelText('Message');

	expect(input).toHaveAttribute('contenteditable', 'false');
	expect(input).toHaveAttribute('aria-disabled', 'true');
	// `disabled` is inert on a contenteditable, so it must not be the only thing rendered.
	expect(input).not.toHaveAttribute('disabled');
});

test('should hide the text and the placeholder when hidetext is set', () => {
	setup({ hidetext: true });

	expect(screen.getByLabelText('Message')).not.toBeVisible();
	expect(screen.getByText('Type a message...')).not.toBeVisible();
});

test('should keep the text visible when hidetext is not set', () => {
	setup();

	expect(screen.getByLabelText('Message')).toBeVisible();
});
