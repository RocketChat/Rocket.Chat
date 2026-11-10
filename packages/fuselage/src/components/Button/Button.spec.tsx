import { composeStories } from '@storybook/react';
import { fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import Button from './Button';
import * as stories from './Button.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Button Component]', () => {
	it('renders Button without crashing', () => {
		render(<Default />);
	});

	it('should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should render a button of type button by default', () => {
		render(<Button>Save</Button>);
		expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
	});

	it('should keep the rel passed to a link', () => {
		render(
			<Button is='a' href='/somewhere' external rel='nofollow'>
				Go
			</Button>,
		);
		expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('rel', 'nofollow');
	});

	it('should default the rel of an external link', () => {
		render(
			<Button is='a' href='/somewhere' external>
				Go
			</Button>,
		);
		expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('should render a link without a type when is is a', () => {
		render(
			<Button is='a' href='/somewhere'>
				Go
			</Button>,
		);
		expect(screen.getByRole('link', { name: 'Go' })).not.toHaveAttribute('type');
	});

	it('should keep the handlers of a disabled button', () => {
		const onBlur = jest.fn();
		const onFocus = jest.fn();
		render(
			<Button disabled onFocus={onFocus} onBlur={onBlur}>
				Save
			</Button>,
		);
		const button = screen.getByRole('button', { name: 'Save' });

		expect(button).toBeDisabled();
		fireEvent.focus(button);
		fireEvent.blur(button);
		expect(onFocus).toHaveBeenCalledTimes(1);
		expect(onBlur).toHaveBeenCalledTimes(1);
	});

	it('should keep onTouchStart next to a press handler', () => {
		const onTouchStart = jest.fn();
		render(
			<Button onClick={() => undefined} onTouchStart={onTouchStart}>
				Save
			</Button>,
		);

		fireEvent.touchStart(screen.getByRole('button', { name: 'Save' }));
		expect(onTouchStart).toHaveBeenCalledTimes(1);
	});

	it('should forward the aria and data attributes it does not declare', () => {
		const ref = createRef<HTMLButtonElement>();
		render(
			<Button ref={ref} className='custom' id='save' data-tooltip='Save it' aria-keyshortcuts='Control+S'>
				Save
			</Button>,
		);
		const button = screen.getByRole('button', { name: 'Save' });

		expect(button).toHaveAttribute('data-tooltip', 'Save it');
		expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+S');
		expect(button).toHaveAttribute('id', 'save');
		expect(button).toHaveClass('rcx-button', 'custom');
		expect(ref.current).toBe(button);
	});
});
