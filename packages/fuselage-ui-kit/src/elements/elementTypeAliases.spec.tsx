import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { modalParser } from '../surfaces';
import { extractInitialStateFromLayout } from '../utils/extractInitialStateFromLayout';

const options: UiKit.Option[] = [
	{ text: { type: 'plain_text', text: 'A' }, value: 'a' },
	{ text: { type: 'plain_text', text: 'B' }, value: 'b' },
];

const ids = { appId: 'app', blockId: 'block', actionId: 'action' } as const;

const cases = [
	['checkboxes', 'checkbox', { options, initialOptions: [options[1]] }, () => screen.getAllByRole('checkbox')],
	['radio_buttons', 'radio_button', { options, initialOption: options[1] }, () => screen.getAllByRole('radio')],
	['timepicker', 'time_picker', { initialTime: '10:30' }, () => screen.getAllByDisplayValue('10:30')],
] as const;

const layout = (type: string, rest: object) =>
	[{ type: 'actions', blockId: 'block', elements: [{ ...ids, type, ...rest }] }] as unknown as UiKit.LayoutBlock[];

const renderLayout = (blocks: UiKit.LayoutBlock[]) =>
	render(<MockedServerContext>{modalParser.render(blocks as unknown as Parameters<typeof modalParser.render>[0])}</MockedServerContext>);

describe.each(cases)('%s', (alias, canonical, rest, getControls) => {
	it(`renders like ${canonical}`, () => {
		const view = renderLayout(layout(alias, rest));
		const aliasedControls = getControls().length;
		const aliasedText = view.asFragment().textContent;
		view.unmount();

		const { asFragment } = renderLayout(layout(canonical, rest));

		expect(getControls()).toHaveLength(aliasedControls);
		expect(asFragment().textContent).toBe(aliasedText);
	});

	it(`keeps the initial value of ${canonical}`, () => {
		expect(extractInitialStateFromLayout(layout(alias, rest))).toEqual(extractInitialStateFromLayout(layout(canonical, rest)));
	});
});
