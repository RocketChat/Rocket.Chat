import type { LinearScaleElement as LinearScaleElementType } from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LinearScaleElement from './LinearScaleElement';
import { UiKitContext } from '../contexts/UiKitContext';
import { contextualBarParser } from '../surfaces';

const linearScaleBlock: LinearScaleElementType = {
	type: 'linear_scale',
	appId: 'test-app',
	blockId: 'test-block',
	actionId: 'test-action',
	minValue: 0,
	maxValue: 5,
	initialValue: 0,
};

describe('LinearScaleElement', () => {
	it('should render scale buttons from minValue to maxValue', () => {
		render(
			<UiKitContext.Provider value={{ action: jest.fn(), values: {} }}>
				<LinearScaleElement index={0} block={linearScaleBlock} context={BlockContext.ACTION} surfaceRenderer={contextualBarParser} />
			</UiKitContext.Provider>,
		);

		for (let i = 0; i <= 5; i++) {
			expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
		}
	});

	it('should trigger action with value "0" when clicking on the button inner text/child for score 0', async () => {
		const actionMock = jest.fn();

		render(
			<UiKitContext.Provider value={{ action: actionMock, values: {} }}>
				<LinearScaleElement index={0} block={linearScaleBlock} context={BlockContext.ACTION} surfaceRenderer={contextualBarParser} />
			</UiKitContext.Provider>,
		);

		// Target the child element directly inside the button (e.g. text rendered inside button)
		const labelChild = screen.getByText('0');

		await userEvent.click(labelChild);

		expect(actionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				blockId: 'test-block',
				appId: 'test-app',
				actionId: 'test-action',
				value: '0',
			}),
			expect.anything(),
		);
	});

	it('should trigger action with correct string value when clicking child elements of other scores', async () => {
		const actionMock = jest.fn();

		render(
			<UiKitContext.Provider value={{ action: actionMock, values: {} }}>
				<LinearScaleElement index={0} block={linearScaleBlock} context={BlockContext.ACTION} surfaceRenderer={contextualBarParser} />
			</UiKitContext.Provider>,
		);

		const labelChildThree = screen.getByText('3');
		await userEvent.click(labelChildThree);

		expect(actionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				blockId: 'test-block',
				appId: 'test-app',
				actionId: 'test-action',
				value: '3',
			}),
			expect.anything(),
		);
	});

	it('should set active class on the initialValue button when initialValue is 0', () => {
		render(
			<UiKitContext.Provider value={{ action: jest.fn(), values: {} }}>
				<LinearScaleElement index={0} block={linearScaleBlock} context={BlockContext.ACTION} surfaceRenderer={contextualBarParser} />
			</UiKitContext.Provider>,
		);

		const zeroButton = screen.getByRole('button', { name: '0' });
		expect(zeroButton).toHaveClass('active');
	});
});
