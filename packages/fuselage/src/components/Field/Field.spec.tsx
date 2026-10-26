import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import { FieldContext } from './Field';
import * as stories from './Field.stories';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Field Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[WithErrorWrapper]', () => {
	it('logs instead of throwing when used outside its parent', () => {
		const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

		const { container } = render(
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName='FieldLabel'>
				<span>content</span>
			</WithErrorWrapper>,
		);

		expect(container).toHaveTextContent('content');
		expect(error).toHaveBeenCalledWith('FieldLabel should be used as children of Field Component');
		error.mockRestore();
	});
});
