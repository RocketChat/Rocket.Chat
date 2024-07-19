import type { RoomType } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import proxyquire from 'proxyquire';
import React from 'react';

import type { default as _RoomMenu } from '../../../../../../client/sidebar/RoomMenu';

const RoomMenu = proxyquire.noCallThru().load('../../../../../../client/sidebar/RoomMenu', {
	'../hooks/useDontAskAgain': {
		useDontAskAgain: () => false,
	},
	'../../app/ui-utils/client': {
		LegacyRoomManager: () => false,
	},
	'../omnichannel/hooks/useOmnichannelPrioritiesMenu': {
		useOmnichannelPrioritiesMenu: () => false,
	},
	'../UiTextContext': () => 'leaveWarning',
	'../lib/rooms/roomCoordinator': () => 'leaveWarning',
}).default as typeof _RoomMenu;

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
		userEvent.click(screen.getByTitle('Options'));
		expect(screen.getByText('Hide')).toBeInTheDocument();
		expect(screen.getByText('Mark_read')).toBeInTheDocument();
		expect(screen.getByText('Favorite')).toBeInTheDocument();
		expect(screen.getByText('Leave')).toBeInTheDocument();
	});

	it('displays menu options when omnichannel conversation', () => {
		render(<RoomMenu {...defaultProps} type='l' />);
		userEvent.click(screen.getByTitle('Options'));
		expect(screen.queryByText('Hide')).not.toBeInTheDocument();
		expect(screen.getByText('Mark_read')).toBeInTheDocument();
		expect(screen.getByText('Favorite')).toBeInTheDocument();
		expect(screen.queryByText('Leave')).not.toBeInTheDocument();
	});
});
