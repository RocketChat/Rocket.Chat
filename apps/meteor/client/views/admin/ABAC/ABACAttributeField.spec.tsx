import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './ABACAttributeField.stories';

const mockAttribute1 = {
	_id: 'attr1',
	key: 'Department',
	label: 'Department',
	values: ['Engineering', 'Sales', 'Marketing'],
};

const mockAttribute2 = {
	_id: 'attr2',
	key: 'Security-Level',
	label: 'Security Level',
	values: ['Public', 'Internal', 'Confidential'],
};

const mockAttribute3 = {
	_id: 'attr3',
	key: 'Location',
	label: 'Location',
	values: ['US', 'EU', 'APAC'],
};

jest.mock('./hooks/useABACAttributeList', () => ({
	useABACAttributeList: jest.fn(() => ({
		data: [mockAttribute1, mockAttribute2, mockAttribute3],
		fetchNextPage: jest.fn(),
		isLoading: false,
	})),
}));

describe('ABACAttributeField', () => {
	// TODO: Once the autocomplete components are a11y compliant, and testable, add more tests
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);
		expect(baseElement).toMatchSnapshot();
	});
});
