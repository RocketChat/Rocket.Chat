import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { messageParser } from '../surfaces';

const renderFeedback = (action = jest.fn(), negativeValue = 'bad') => {
	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, updateState: jest.fn(), values: {}, appId: 'app' }}>
				{messageParser.render([
					{
						type: 'context_actions',
						blockId: 'answer',
						elements: [
							{
								type: 'feedback_buttons',
								appId: 'app',
								blockId: 'answer',
								actionId: 'rate',
								positive_button: { text: { type: 'plain_text', text: 'Good answer' }, value: 'good' },
								negative_button: {
									text: { type: 'plain_text', text: 'Bad answer' },
									value: negativeValue,
									accessibility_label: 'Mark this answer as bad',
								},
							},
						],
					},
				])}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	return action;
};

it('names each button after its text, or its accessibility label when it has one', () => {
	renderFeedback();

	expect(screen.getByRole('button', { name: 'Good answer' })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Mark this answer as bad' })).toHaveAttribute('title', 'Bad answer');
});

it('sends the clicked button value and marks it as pressed', async () => {
	const action = renderFeedback();

	await userEvent.click(screen.getByRole('button', { name: 'Good answer' }));

	expect(action).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'rate', value: 'good' }), expect.anything());
	expect(screen.getByRole('button', { name: 'Good answer' })).toHaveAttribute('aria-pressed', 'true');
	expect(screen.getByRole('button', { name: 'Mark this answer as bad' })).toHaveAttribute('aria-pressed', 'false');
});

it('marks only the clicked button as pressed when both carry the same value', async () => {
	renderFeedback(jest.fn(), 'good');

	await userEvent.click(screen.getByRole('button', { name: 'Good answer' }));

	expect(screen.getByRole('button', { name: 'Good answer' })).toHaveAttribute('aria-pressed', 'true');
	expect(screen.getByRole('button', { name: 'Mark this answer as bad' })).toHaveAttribute('aria-pressed', 'false');
});
