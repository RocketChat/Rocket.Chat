import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import AutoTranslateWithData from './AutoTranslateWithData';
import { RoomContext } from '../../contexts/RoomContext';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useEndpoint: () => jest.fn().mockResolvedValue({ languages: [] }),
	useLanguage: () => 'en',
	useRoomToolbox: () => ({ closeTab: jest.fn() }),
	useToastMessageDispatch: () => jest.fn(),
}));

jest.mock('../../../../hooks/useEndpointMutation', () => ({
	useEndpointMutation: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('./AutoTranslate', () => ({
	__esModule: true,
	default: ({ language }: { language: string }) => <div data-testid='current-language'>{language}</div>,
}));

const roomContextValue = (language: string) =>
	({
		rid: 'room-id',
		room: { _id: 'room-id', t: 'c', name: 'Room' },
		subscription: {
			rid: 'room-id',
			autoTranslate: false,
			autoTranslateLanguage: language,
		},
		hasMorePreviousMessages: false,
		hasMoreNextMessages: false,
		isLoadingMoreMessages: false,
	}) as any;

describe('AutoTranslateWithData', () => {
	it('updates the selected language when the room subscription changes', () => {
		const Wrapper = ({ children, language }: { children: ReactNode; language: string }) => (
			<RoomContext.Provider value={roomContextValue(language)}>{children}</RoomContext.Provider>
		);

		const appWrapper = mockAppRoot().build();

		const { rerender } = render(
			<Wrapper language='fr'>
				<AutoTranslateWithData />
			</Wrapper>,
			{ wrapper: appWrapper },
		);

		expect(screen.getByTestId('current-language')).toHaveTextContent('fr');

		rerender(
			<Wrapper language='de'>
				<AutoTranslateWithData />
			</Wrapper>,
		);

		expect(screen.getByTestId('current-language')).toHaveTextContent('de');
	});
});
