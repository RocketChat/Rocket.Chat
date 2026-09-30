import { ModalContext } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';
import type { ContextType, ReactNode } from 'react';

import { AutoupdateToastMessage } from './AutoupdateToastMessage';
import { useIdleActiveEvents } from '../hooks/useIdleActiveEvents';

jest.mock('../hooks/useIdleActiveEvents', () => ({
	useIdleActiveEvents: jest.fn(),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

const renderWithModal = (modal: ReactNode) => {
	const value = {
		modal: { setModal: jest.fn() },
		currentModal: { component: modal },
	} as unknown as ContextType<typeof ModalContext>;

	render(
		<ModalContext.Provider value={value}>
			<AutoupdateToastMessage />
		</ModalContext.Provider>,
	);

	const [[, onIdle]] = jest.mocked(useIdleActiveEvents).mock.calls.slice(-1);
	return onIdle;
};

// jsdom cannot navigate and window.location is unforgeable, so a reload surfaces only as jsdom's "not implemented" report.
const reload = {
	get calls() {
		return jest
			.mocked(console.error)
			.mock.calls.filter(([error]) => String((error as Error)?.message ?? error).includes('Not implemented: navigation')).length;
	},
};

describe('AutoupdateToastMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('reloads the page when the user goes idle', () => {
		renderWithModal(null)();

		expect(reload.calls).toBe(1);
	});

	it('does not reload while a modal is open, such as the two-factor prompt', () => {
		renderWithModal(<div />)();

		expect(reload.calls).toBe(0);
	});
});
