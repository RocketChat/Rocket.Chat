import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SidebarBanner } from './SidebarBanner';
import { render } from '../../testing';

describe('SidebarBanner close button', () => {
	it('is named "Close" by default', () => {
		render(<SidebarBanner title='Title' onClose={() => undefined} />);

		expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
	});

	it('takes its name from closeLabel', () => {
		render(<SidebarBanner title='Title' onClose={() => undefined} closeLabel='Fechar' />);

		expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
	});

	it('is absent without onClose', () => {
		render(<SidebarBanner title='Title' />);

		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
});

describe('SidebarBanner action', () => {
	it('is a link when it has an href', () => {
		render(<SidebarBanner title='Title' linkText='Learn more' linkProps={{ href: '#' }} />);

		expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '#');
	});

	it.each([
		['Enter', '{Enter}'],
		['Space', ' '],
		['click', null],
	])('is a button activated with %s when it has no href', async (_, key) => {
		const onClick = jest.fn();
		render(<SidebarBanner title='Title' linkText='Learn more' linkProps={{ onClick }} />);

		const button = screen.getByRole('button', { name: 'Learn more' });
		if (key) {
			await userEvent.tab();
			expect(button).toHaveFocus();
			await userEvent.keyboard(key);
		} else {
			await userEvent.click(button);
		}

		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
