import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { modalParser } from '../surfaces';

const base: UiKit.TimePickerElement = { type: 'time_picker', appId: 'app', blockId: 'block', actionId: 'at', initialTime: '09:30' };

const renderPicker = (element: UiKit.TimePickerElement) =>
	render(modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'At' }, element }]), { wrapper: mockAppRoot().build() });

it('names the time zone of the value', () => {
	renderPicker({ ...base, timezone: 'UTC' });

	expect(screen.getByDisplayValue('09:30')).toBeInTheDocument();
	expect(screen.getByText('UTC')).toBeInTheDocument();
});

it('shows no zone without a timezone', () => {
	renderPicker(base);

	expect(screen.queryByText('UTC')).not.toBeInTheDocument();
});

it('ignores an unknown time zone', () => {
	renderPicker({ ...base, timezone: 'Not/AZone' });

	expect(screen.getByDisplayValue('09:30')).toBeInTheDocument();
});
