import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../../contexts/UiKitContext';
import { modalParser } from '../../surfaces';

const ids = { appId: 'app', blockId: 'block', actionId: 'pick' };

const suggestions = {
	options: [
		{ text: { type: 'plain_text', text: 'Alpha' }, value: 'alpha' },
		{ text: { type: 'plain_text', text: 'Alpine' }, value: 'alpine' },
	],
	option_groups: [
		{ label: { type: 'plain_text', text: 'More' }, options: [{ text: { type: 'plain_text', text: 'Alps' }, value: 'alps' }] },
	],
} satisfies { options: UiKit.Option[]; option_groups: UiKit.OptionGroup[] };

const renderSelect = (element: UiKit.InputBlock['element'], suggest: jest.Mock | undefined) => {
	const Wrapper = mockAppRoot().build();

	return render(
		<Wrapper>
			<UiKitContext.Provider value={{ action: jest.fn(), values: {}, viewId: 'view', suggest }}>
				{modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'Pick' }, element }])}
			</UiKitContext.Provider>
		</Wrapper>,
	);
};

describe.each([
	['external_select', { ...ids, type: 'external_select' } as const],
	['multi_external_select', { ...ids, type: 'multi_external_select' } as const],
])('%s', (_type, element) => {
	it('asks the app for options once the query reaches the minimum length', async () => {
		const suggest = jest.fn().mockResolvedValue(suggestions);
		renderSelect(element, suggest);

		await userEvent.type(screen.getByRole('textbox'), 'al');
		await new Promise((resolve) => setTimeout(resolve, 450));
		expect(suggest).not.toHaveBeenCalled();

		await userEvent.type(screen.getByRole('textbox'), 'p');

		await waitFor(() => expect(suggest).toHaveBeenCalledTimes(1));
		expect(suggest).toHaveBeenCalledWith({ appId: 'app', actionId: 'pick', blockId: 'block', value: 'alp', viewId: 'view' });
		expect(await screen.findByRole('option', { name: 'Alpha' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Alps' })).toBeInTheDocument();
	});

	it('honours min_query_length', async () => {
		const suggest = jest.fn().mockResolvedValue(suggestions);
		renderSelect({ ...element, min_query_length: 1 }, suggest);

		await userEvent.type(screen.getByRole('textbox'), 'a');

		await waitFor(() => expect(suggest).toHaveBeenCalledWith(expect.objectContaining({ value: 'a' })));
	});

	it('offers no options when the app fails', async () => {
		const suggest = jest.fn().mockRejectedValue(new Error('boom'));
		renderSelect(element, suggest);

		await userEvent.type(screen.getByRole('textbox'), 'alp');

		await waitFor(() => expect(suggest).toHaveBeenCalled());
		expect(screen.getByRole('option')).toHaveTextContent('Empty');
	});

	it('does not query when the surface cannot suggest', async () => {
		renderSelect(element, undefined);

		await userEvent.type(screen.getByRole('textbox'), 'alp');

		expect(screen.queryByRole('option', { name: 'Alpha' })).not.toBeInTheDocument();
	});
});

it('shows the initial option of an external_select', async () => {
	renderSelect(
		{ ...ids, type: 'external_select', initial_option: { text: { type: 'plain_text', text: 'Beta' }, value: 'beta' } },
		jest.fn().mockResolvedValue({}),
	);

	await waitFor(() => expect(screen.getByText('Beta')).toBeInTheDocument());
});

it('shows the initial options of a multi_external_select', async () => {
	renderSelect(
		{
			...ids,
			type: 'multi_external_select',
			initial_options: [
				{ text: { type: 'plain_text', text: 'Beta' }, value: 'beta' },
				{ text: { type: 'plain_text', text: 'Gamma' }, value: 'gamma' },
			],
		},
		jest.fn().mockResolvedValue({}),
	);

	await waitFor(() => expect(screen.getByText('Beta')).toBeInTheDocument());
	expect(screen.getByText('Gamma')).toBeInTheDocument();
});
