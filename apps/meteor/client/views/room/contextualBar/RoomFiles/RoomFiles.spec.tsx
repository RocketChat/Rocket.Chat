import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './RoomFiles.stories';
import { expectListKeyboard, expectListSemantics, listWrapper } from '../../../../../tests/mocks/utils/listContract';

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

it('follows the semantics and keyboard model of a composite list', async () => {
	const { Default } = composeStories(stories);
	render(<Default />, { wrapper: listWrapper() });

	const list = await expectListSemantics('Files_list');
	await expectListKeyboard(list);
});
