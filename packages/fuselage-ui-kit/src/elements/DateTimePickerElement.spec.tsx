import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { fireEvent, render, screen } from '@testing-library/react';

import { UiKitContext } from '../contexts/UiKitContext';
import { modalParser } from '../surfaces';

const element: UiKit.DateTimePickerElement = {
	type: 'datetimepicker',
	appId: 'app',
	blockId: 'block',
	actionId: 'when',
	// Built from local fields so the expectation holds in any time zone.
	initialDateTime: new Date(2026, 9, 5, 14, 30).getTime() / 1000,
};

const renderPicker = (updateState = jest.fn()) =>
	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action: jest.fn(), updateState, values: {}, appId: 'app', viewId: 'view' }}>
				{modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'When' }, element }])}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

it('shows the initial timestamp in local time', () => {
	renderPicker();

	expect(screen.getByDisplayValue('2026-10-05T14:30')).toBeInTheDocument();
});

it('reports the picked local date and time as a Unix timestamp in seconds', () => {
	const updateState = jest.fn();
	renderPicker(updateState);

	// eslint-disable-next-line testing-library/prefer-user-event -- jsdom cannot type into datetime-local inputs
	fireEvent.input(screen.getByDisplayValue('2026-10-05T14:30'), { target: { value: '2026-10-06T09:15' } });

	expect(updateState).toHaveBeenCalledWith(
		expect.objectContaining({ actionId: 'when', value: new Date(2026, 9, 6, 9, 15).getTime() / 1000 }),
		expect.anything(),
	);
});
