import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { bannerParser, homeParser, messageParser, modalParser } from '../surfaces';

const alert = { type: 'alert', text: { type: 'plain_text', text: 'Maintenance tonight' }, level: 'warning' } as const;

it.each([
	['message', messageParser],
	['modal', modalParser],
	['home', homeParser],
] as const)('renders the text of an alert in a %s', (_surface, parser) => {
	render(<MockedServerContext>{parser.render([alert])}</MockedServerContext>);

	expect(screen.getByRole('alert')).toHaveTextContent('Maintenance tonight');
});

it('styles the alert by its level and falls back to the default one', () => {
	const { rerender } = render(<MockedServerContext>{modalParser.render([alert])}</MockedServerContext>);
	expect(screen.getByRole('alert')).toHaveClass('rcx-callout--warning');

	rerender(<MockedServerContext>{modalParser.render([{ ...alert, level: 'error' }])}</MockedServerContext>);
	expect(screen.getByRole('alert')).toHaveClass('rcx-callout--danger');

	rerender(<MockedServerContext>{modalParser.render([{ type: 'alert', text: alert.text }])}</MockedServerContext>);
	expect(screen.getByRole('alert').className).not.toMatch(/rcx-callout--/);
});

it('renders nothing in a banner, which does not accept alerts', () => {
	render(<MockedServerContext>{bannerParser.render([alert])}</MockedServerContext>);

	expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
