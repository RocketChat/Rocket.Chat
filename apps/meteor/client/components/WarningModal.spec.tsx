import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import React from 'react';

import WarningModal from './WarningModal';

it('should look good', async () => {
	render(<WarningModal text='text' confirmText='confirm' cancelText='cancel' confirm={() => undefined} close={() => undefined} />, {
		legacyRoot: true,
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByRole('heading')).toHaveTextContent('Are_you_sure');
	expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'confirm' })).toBeInTheDocument();
	expect(screen.getByText('text')).toBeInTheDocument();
});
