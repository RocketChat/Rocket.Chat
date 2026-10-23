import { composeStories } from '@storybook/react-webpack5';

import { MessageContainer, MessageContainerFixed, MessageLeftContainer } from '.';
import * as stories from './Messages.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Message Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});

	describe('className handling', () => {
		it('preserves default classes on MessageContainer when className is passed', () => {
			const { container } = render(<MessageContainer className='custom-container' />);
			expect(container.firstElementChild).toHaveClass('rcx-box', 'rcx-box--full', 'rcx-message-container', 'custom-container');
		});

		it('preserves default classes on MessageContainerFixed when className is passed', () => {
			const { container } = render(<MessageContainerFixed className='custom-fixed' />);
			expect(container.firstElementChild).toHaveClass(
				'rcx-box',
				'rcx-box--full',
				'rcx-message-container',
				'rcx-message-container--fixed',
				'custom-fixed',
			);
		});

		it('preserves default classes on MessageLeftContainer when className is passed', () => {
			const { container } = render(<MessageLeftContainer className='custom-left' />);
			expect(container.firstElementChild).toHaveClass(
				'rcx-box',
				'rcx-box--full',
				'rcx-message-container',
				'rcx-message-container--left',
				'custom-left',
			);
		});
	});
});
