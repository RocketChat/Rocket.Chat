import type { RoomType } from '@rocket.chat/core-typings';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import RoomMenu from '../../../../../../client/sidebar/RoomMenu';

const defaultProps = {
	rid: 'roomId',
	type: 'c' as RoomType,
	hideDefaultOptions: false,
};
describe('RoomMenu component', () => {
	it('renders without crashing', () => {
		render(<RoomMenu {...defaultProps} />);
		expect(screen.getByTitle('Options')).toBeInTheDocument();
	});

	it('displays menu options', () => {
		render(<RoomMenu {...defaultProps} />);
		fireEvent.click(screen.getByTitle('Options'));
		expect(screen.getByText('Hide')).toBeInTheDocument();
		expect(screen.getByText('Mark_read')).toBeInTheDocument();
		expect(screen.getByText('Favorite')).toBeInTheDocument();
		expect(screen.getByText('Leave')).toBeInTheDocument();
	});

	it('displays menu options when omnichannel conversation', () => {
		render(<RoomMenu {...defaultProps} />);
		fireEvent.click(screen.getByTitle('Options'));
		expect(screen.getByText('Hide')).not.toBeInTheDocument();
		expect(screen.getByText('Mark_read')).toBeInTheDocument();
		expect(screen.getByText('Favorite')).toBeInTheDocument();
		expect(screen.getByText('Leave')).not.toBeInTheDocument();
	});
});
