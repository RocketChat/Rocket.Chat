import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';

import Badge from './Badge';
import * as stories from './Badge.stories';
import { render } from '../../testing';

const { Default, Primary, Secondary, Danger, Warning } = composeStories(stories);

describe('[Badge Component]', () => {
	describe('Story renders without crashing', () => {
		it('Default', () => {
			render(<Default title='badge' />);
			expect(screen.getByTitle('badge')).toHaveClass('rcx-badge--secondary');
		});
		it('Primary', () => {
			render(<Primary title='badge' />);
			expect(screen.getByTitle('badge')).toHaveClass('rcx-badge--primary');
		});
		it('Secondary', () => {
			render(<Secondary title='badge' />);
			expect(screen.getByTitle('badge')).toHaveClass('rcx-badge--secondary');
		});
		it('Danger', () => {
			render(<Danger title='badge' />);
			expect(screen.getByTitle('badge')).toHaveClass('rcx-badge--danger');
		});
		it('Warning', () => {
			render(<Warning title='badge' />);
			expect(screen.getByTitle('badge')).toHaveClass('rcx-badge--warning');
		});
	});

	it('should display children', () => {
		render(<Badge>Children</Badge>);
		expect(screen.getByText('Children')).toBeInTheDocument();
	});

	it('should have class according to variant', () => {
		render(<Badge variant='primary'>1</Badge>);
		expect(screen.getByText('1')).toHaveClass('rcx-badge--primary');
	});

	it('should have class passed as property', () => {
		render(<Badge className='test-class'>1</Badge>);
		expect(screen.getByText('1')).toHaveClass('test-class');
	});

	it('should show title when hovered', () => {
		render(<Badge title='test-title' />);
		expect(screen.getByTitle('test-title')).toBeInTheDocument();
	});
});
