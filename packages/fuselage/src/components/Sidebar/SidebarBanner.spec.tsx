import { screen } from '@testing-library/react';

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
