import type { RoomType } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import React from 'react';

import RoomMenu from '../../../../../client/sidebar/RoomMenu';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useRouter: () => ({
		navigate: jest.fn(),
	}),
	useSetModal: () => jest.fn(),
	useToastMessageDispatch: () => jest.fn(),
	useUserSubscription: () => ({
		name: 'test-name',
		t: 't',
	}),
	useSetting: () => true,
	usePermission: jest.fn(),
	useMethod: () => jest.fn(),
	useTranslation: () => (key: string) => key,
	useEndpoint: () => jest.fn(),
}));

jest.mock('../../../../../client/lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			getUiText: () => 'leaveWarning',
		}),
	},
}));

jest.mock('../../../../../app/ui-utils/client', () => ({
	LegacyRoomManager: {
		close: jest.fn(),
	},
}));

jest.mock('../../../../../definition/IRoomTypeConfig', () => ({
	UiTextContext: {
		LEAVE_WARNING: 'leave',
		HIDE_WARNING: 'hide',
	},
}));

jest.mock('../../../../../client/components/GenericModal', () => ({
	GenericModalDoNotAskAgain: () => <>Generic Modal</>,
}));

jest.mock('../../../../../client/hooks/useDontAskAgain', () => ({
	useDontAskAgain: () => true,
}));

jest.mock('../../../../../client/omnichannel/hooks/useOmnichannelPrioritiesMenu', () => ({
	useOmnichannelPrioritiesMenu: () => undefined,
}));

jest.mock('@rocket.chat/fuselage', () => ({
	Menu: ({ options }: any) => (
		<>
			{Object.keys(options).map((key) => {
				const { label } = options[key];
				return <div key={key}>{label.label}</div>;
			})}
		</>
	),
}));

const defaultProps = {
	rid: 'roomId',
	type: 'c' as RoomType,
	hideDefaultOptions: false,
	placement: 'right-start',
};

describe('RoomMenu component', () => {
	it('renders without crashing', async () => {
		render(<RoomMenu {...defaultProps} />);
		expect(await screen.findByText('Hide')).toBeInTheDocument();
	});

	it('displays menu options', () => {
		render(<RoomMenu {...defaultProps} />);
		expect(screen.getByText('Hide')).toBeInTheDocument();
		expect(screen.getByText('Mark_unread')).toBeInTheDocument();
		expect(screen.getByText('Favorite')).toBeInTheDocument();
	});

	it('displays menu options when omnichannel conversation', () => {
		render(<RoomMenu {...defaultProps} type='l' />);
		expect(screen.queryByText('Hide')).not.toBeInTheDocument();
		expect(screen.getByText('Mark_unread')).toBeInTheDocument();
		expect(screen.getByText('Favorite')).toBeInTheDocument();
	});
});
