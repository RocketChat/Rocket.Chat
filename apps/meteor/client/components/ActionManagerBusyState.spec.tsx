import { Emitter } from '@rocket.chat/emitter';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';

import ActionManagerBusyState from './ActionManagerBusyState';
import { useUiKitActionManager } from '../uikit/hooks/useUiKitActionManager';

jest.mock('../uikit/hooks/useUiKitActionManager', () => ({
	useUiKitActionManager: jest.fn(),
}));

const createActionManager = (initiallyBusy = false) => {
	const events = new Emitter<{ busy: { busy: boolean } }>();
	let busy = initiallyBusy;

	return {
		on: (event: 'busy', listener: (payload: { busy: boolean }) => void) => events.on(event, listener),
		off: (event: 'busy', listener: (payload: { busy: boolean }) => void) => events.off(event, listener),
		isBusy: () => busy,
		notifyBusy: () => {
			busy = true;
			events.emit('busy', { busy: true });
		},
		notifyIdle: () => {
			busy = false;
			events.emit('busy', { busy: false });
		},
	};
};

const renderWith = (actionManager: ReturnType<typeof createActionManager>) => {
	jest.mocked(useUiKitActionManager).mockReturnValue(actionManager as unknown as ReturnType<typeof useUiKitActionManager>);
	return render(<ActionManagerBusyState />, { wrapper: mockAppRoot().build() });
};

it('renders nothing while the action manager is idle', () => {
	renderWith(createActionManager());

	expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});

it('shows the loading banner while the action manager is busy', () => {
	const actionManager = createActionManager();
	renderWith(actionManager);

	act(() => actionManager.notifyBusy());
	expect(screen.getByText('Loading')).toBeInTheDocument();

	act(() => actionManager.notifyIdle());
	expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});

it('shows the loading banner when mounted while an interaction is already running', () => {
	renderWith(createActionManager(true));

	expect(screen.getByText('Loading')).toBeInTheDocument();
});
