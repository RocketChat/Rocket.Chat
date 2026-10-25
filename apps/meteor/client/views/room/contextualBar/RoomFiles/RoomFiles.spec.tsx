import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './RoomFiles.stories';
import { expectListKeyboard, listWrapper } from '../../../../../tests/mocks/utils/listContract';

jest.mock('../../../../../client/lib/getURL', () => ({
	getURL: jest.fn((url: string) => url),
}));

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	// Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
	const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });
	expect(results).toHaveNoViolations();
});

it('follows the keyboard model of a list of rows', async () => {
	const { Default } = composeStories(stories);
	const files = (Default.args.filesItems ?? []).map((file) => ({ ...file, path: `/file-upload/${file._id}` }));
	render(<Default filesItems={files} />, { wrapper: listWrapper() });

	await expectListKeyboard(screen.getByTestId('virtuoso-item-list'));
});
