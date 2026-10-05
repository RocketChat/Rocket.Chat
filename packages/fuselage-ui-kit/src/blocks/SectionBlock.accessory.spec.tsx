import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { messageParser } from '../surfaces';

const wrapper = mockAppRoot()
	.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [] }) as any)
	.build();

const base = { appId: 'app', blockId: 'block', actionId: 'pick' };
const option: UiKit.Option = { text: { type: 'plain_text', text: 'Yes' }, value: 'yes' };

const cases: [string, NonNullable<UiKit.SectionBlock['accessory']>, string][] = [
	['checkbox', { ...base, type: 'checkbox', options: [option] }, 'checkbox'],
	['radio_button', { ...base, type: 'radio_button', options: [option] }, 'radio'],
	['users_select', { ...base, type: 'users_select' }, 'textbox'],
];

it.each(cases)('renders a %s accessory next to the section text', (_type, accessory, role) => {
	render(<>{messageParser.render([{ type: 'section', text: { type: 'plain_text', text: 'Choose' }, accessory }])}</>, { wrapper });

	expect(screen.getByText('Choose')).toBeInTheDocument();
	expect(screen.getByRole(role)).toBeInTheDocument();
});
