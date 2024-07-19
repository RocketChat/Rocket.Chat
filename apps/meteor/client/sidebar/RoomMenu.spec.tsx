import type { RoomType } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import React from 'react';

import RoomMenu from './RoomMenu';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useRouter: () => ({
		navigate: () => {},
	}),
	useSetModal: () => () => {},
	useToastMessageDispatch: () => () => {},
	useUserSubscription: () => ({
		name: 'test-name',
		t: 't',
	}),
	useSetting: () => true,
	usePermission: () => {},
	useMethod: () => () => {},
	useTranslation: () => (key: string) => key,
	useEndpoint: () => () => {},
}));

jest.mock('../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			getUiText: () => 'leaveWarning',
		}),
	},
}));

jest.mock('../../app/ui-utils/client', () => ({
	LegacyRoomManager: {
		close: () => {},
	},
}));

jest.mock('../../definition/IRoomTypeConfig', () => ({
	UiTextContext: {
		LEAVE_WARNING: 'leave',
		HIDE_WARNING: 'hide',
	},
}));

jest.mock('../components/GenericModal', () => ({
	GenericModalDoNotAskAgain: () => <>Generic Modal</>,
}));

jest.mock('../hooks/useDontAskAgain', () => ({
	useDontAskAgain: () => true,
}));

jest.mock('../omnichannel/hooks/useOmnichannelPrioritiesMenu', () => ({
	useOmnichannelPrioritiesMenu: () => undefined,
}));

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
		screen.debug();
		userEvent.click(screen.getByTitle('Options'));
		screen.debug();
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
