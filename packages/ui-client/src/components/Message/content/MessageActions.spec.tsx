import { createFakeMessage } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import MessageActions from './MessageActions';
import * as stories from './MessageActions.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';

it('should run the action link of the clicked button', async () => {
	const message = createFakeMessage();
	const { wrapper, navigation } = mockMessageProviders();
	render(
		<MessageActions
			message={message}
			actions={[
				{ icon: 'video', label: 'Join call', methodId: 'joinJitsiCall' },
				{ icon: 'phone', label: 'Call back', methodId: 'callBack' },
			]}
		/>,
		{ wrapper },
	);

	await userEvent.click(screen.getByRole('button', { name: 'Call back' }));

	expect(navigation.runActionLink).toHaveBeenCalledWith(message, 'callBack');
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
