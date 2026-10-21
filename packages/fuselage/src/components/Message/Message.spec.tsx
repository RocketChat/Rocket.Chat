import { composeStories } from '@storybook/react-webpack5';

import MessageBlock from './MessageBlock';
import * as stories from './Messages.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Message Component]', () => {
	it('renders without crashing', () => {
		expect(() => render(<Default />)).not.toThrow();
	});

	describe('MessageBlock', () => {
		it('preserves className when passed to MessageBlock', () => {
			const { container } = render(<MessageBlock className='rcx-message-reactions' />);
			expect(container.firstElementChild).toHaveClass('rcx-message-block');
			expect(container.firstElementChild).toHaveClass('rcx-message-reactions');
		});
	});
});
