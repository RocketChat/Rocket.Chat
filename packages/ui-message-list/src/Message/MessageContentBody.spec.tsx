import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import IgnoredContent from './IgnoredContent';
import MessageCollapsible from './MessageCollapsible';
import MessageContentBody from './MessageContentBody';
import MessageContentFallback from './MessageContentFallback';
import { mockMessageProviders } from '../../tests/utils/mockMessageProviders';

it('renders markdown through the renderers context (R8)', () => {
	const Markup = jest.fn(({ msg }: { msg?: string }) => <>{`rendered ${msg}`}</>);
	const { wrapper } = mockMessageProviders({ renderers: { Markup } });

	render(<MessageContentBody md={[]} msg='hello' />, { wrapper });

	const body = screen.getByRole('document');
	expect(body).toHaveAttribute('aria-roledescription', 'message_body');
	expect(body).toHaveTextContent('rendered hello');
});

it('renders the fallback text with its id (R9)', () => {
	const { wrapper } = mockMessageProviders();

	render(<MessageContentFallback id='fallback-id' />, { wrapper });

	expect(screen.getByText('Message_could_not_be_displayed')).toHaveAttribute('id', 'fallback-id');
});

it('reveals ignored content on click and Enter without reaching the message around it (R10)', async () => {
	const { wrapper } = mockMessageProviders();
	const onShowMessageIgnored = jest.fn();
	const onMessageClick = jest.fn();

	render(
		// oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
		<div onClick={onMessageClick}>
			<IgnoredContent messageId='mid' onShowMessageIgnored={onShowMessageIgnored} />
		</div>,
		{ wrapper },
	);

	const button = screen.getByRole('button', { name: 'Message_Ignored' });
	await userEvent.click(button);
	button.focus();
	await userEvent.keyboard('{Enter}');

	expect(onShowMessageIgnored).toHaveBeenCalledTimes(2);
	expect(onMessageClick).not.toHaveBeenCalled();
});

it('hides and shows its content from its toggle (R23)', async () => {
	const { wrapper } = mockMessageProviders();

	render(<MessageCollapsible title='Link preview'>content</MessageCollapsible>, { wrapper });
	expect(screen.getByText('content')).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button'));
	expect(screen.queryByText('content')).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('button'));
	expect(screen.getByText('content')).toBeInTheDocument();
});
