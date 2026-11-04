import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render } from '@testing-library/react';

import { modalParser } from '../surfaces';
import { extractInitialStateFromLayout } from '../utils/extractInitialStateFromLayout';

const options: UiKit.Option[] = [
	{ text: { type: 'plain_text', text: 'A' }, value: 'a' },
	{ text: { type: 'plain_text', text: 'B' }, value: 'b' },
];

const ids = { appId: 'app', blockId: 'block', actionId: 'action' } as const;

const cases = [
	['checkboxes', 'checkbox', { options, initialOptions: [options[1]] }],
	['radio_buttons', 'radio_button', { options, initialOption: options[1] }],
	['timepicker', 'time_picker', { initialTime: '10:30' }],
] as const;

const layout = (type: string, rest: object) =>
	[{ type: 'actions', blockId: 'block', elements: [{ ...ids, type, ...rest }] }] as unknown as UiKit.LayoutBlock[];

const renderLayout = (blocks: UiKit.LayoutBlock[]) =>
	render(<MockedServerContext>{modalParser.render(blocks as unknown as Parameters<typeof modalParser.render>[0])}</MockedServerContext>);

describe.each(cases)('%s', (alias, canonical, rest) => {
	it(`renders like ${canonical}`, () => {
		const aliased = renderLayout(layout(alias, rest));
		const canonicalRender = renderLayout(layout(canonical, rest));

		expect(aliased.container.querySelector('input, button, [role]')).not.toBeNull();
		expect(aliased.container.textContent).toBe(canonicalRender.container.textContent);
		expect(aliased.container.querySelectorAll('*').length).toBe(canonicalRender.container.querySelectorAll('*').length);
	});

	it(`keeps the initial value of ${canonical}`, () => {
		expect(extractInitialStateFromLayout(layout(alias, rest))).toEqual(extractInitialStateFromLayout(layout(canonical, rest)));
	});
});
