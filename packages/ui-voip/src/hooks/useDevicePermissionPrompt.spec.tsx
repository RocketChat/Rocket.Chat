import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ModalProvider, ModalRegion } from '@rocket.chat/ui-client';
import { renderHook, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { useDevicePermissionPrompt } from './useDevicePermissionPrompt';

const types = ['device-change', 'outgoing', 'incoming'] as const;

const modalWrapper = (children: ReactNode) => {
	return (
		<ModalProvider>
			<ModalRegion />
			{children}
		</ModalProvider>
	);
};

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		VoIP_device_permission_required: 'Mic/speaker access required',
		VoIP_allow_and_call: 'Allow and call',
		VoIP_allow_and_accept: 'Allow and accept',
		VoIP_cancel_and_reject: 'Cancel and reject',
		Cancel: 'Cancel',
		VoIP_device_permission_required_description:
			'Your web browser stopped {{workspaceUrl}} from using your microphone and/or speaker.\n\nAllow speaker and microphone access in your browser settings to prevent seeing this message again.',
	})
	.wrap(modalWrapper);

const onAccept = jest.fn(() => undefined);
const onReject = jest.fn(() => undefined);

Object.defineProperty(global.navigator, 'mediaDevices', {
	value: {
		getUserMedia: jest.fn(async () => ({ getTracks: () => [] })),
	},
});

describe.each(types)('useDevicePermissionPrompt - Action: %s', (actionType) => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('Should immediately call onAccept (permission granted)', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt({ onAccept, onReject, actionType }), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'granted' } as PermissionStatus).build(),
		});

		act(() => {
			result.current();
		});

		await waitFor(() => {
			expect(onAccept).toHaveBeenCalled();
			expect(result.current).toBeInstanceOf(Function);
		});
	});

	it('Should open "denied" modal (permission denied)', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt({ onAccept, onReject, actionType }), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'denied' } as PermissionStatus).build(),
		});

		act(() => {
			result.current();
		});

		const cancel = await screen.findByText('Cancel');
		expect(cancel).toBeInTheDocument();

		await userEvent.click(cancel);

		expect(onReject).not.toHaveBeenCalled();
		// There is no accept button in the denied state modal
		expect(onAccept).not.toHaveBeenCalled();
		expect(cancel).not.toBeInTheDocument();
	});
});

describe('useDevicePermissionPrompt - Permission state: prompt', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('Should open "incoming - prompt" modal and call respective actions', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt({ onAccept, onReject, actionType: 'incoming' }), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'prompt' } as PermissionStatus).build(),
		});

		act(() => {
			result.current();
		});

		const accept = await screen.findByText('Allow and accept');
		expect(accept).toBeInTheDocument();
		expect(await screen.findByText('Cancel and reject')).toBeInTheDocument();

		await userEvent.click(accept);

		expect(onAccept).toHaveBeenCalled();
		expect(onReject).not.toHaveBeenCalled();
		expect(screen.queryByText('Allow and accept')).not.toBeInTheDocument();

		jest.clearAllMocks();

		act(() => {
			result.current();
		});

		const cancel = await screen.findByText('Cancel and reject');

		expect(cancel).toBeInTheDocument();
		expect(await screen.findByText('Allow and accept')).toBeInTheDocument();

		await userEvent.click(cancel);

		expect(onReject).toHaveBeenCalled();
		expect(onAccept).not.toHaveBeenCalled();
		expect(cancel).not.toBeInTheDocument();
	});

	it('Should open "outgoing - prompt" modal and call respective actions', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt({ onAccept, onReject, actionType: 'outgoing' }), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'prompt' } as PermissionStatus).build(),
		});

		act(() => {
			result.current();
		});

		const accept = await screen.findByText('Allow and call');
		expect(accept).toBeInTheDocument();
		expect(await screen.findByText('Cancel')).toBeInTheDocument();

		await userEvent.click(accept);

		expect(onAccept).toHaveBeenCalled();
		expect(onReject).not.toHaveBeenCalled();
		expect(screen.queryByText('Allow and call')).not.toBeInTheDocument();

		jest.clearAllMocks();

		act(() => {
			result.current();
		});

		const cancel = await screen.findByText('Cancel');

		expect(cancel).toBeInTheDocument();
		expect(await screen.findByText('Allow and call')).toBeInTheDocument();

		await userEvent.click(cancel);

		// The outgoing prompt modal only closes when the user clicks the cancel button, no function is called.
		expect(onReject).not.toHaveBeenCalled();
		expect(onAccept).not.toHaveBeenCalled();
		expect(cancel).not.toBeInTheDocument();
	});

	it('Should open "device-change - prompt" modal and call respective actions', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt({ onAccept, onReject, actionType: 'device-change' }), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'prompt' } as PermissionStatus).build(),
		});

		act(() => {
			result.current();
		});

		const accept = await screen.findByText('Allow');
		expect(accept).toBeInTheDocument();
		expect(await screen.findByText('Cancel')).toBeInTheDocument();

		await userEvent.click(accept);

		expect(onAccept).toHaveBeenCalled();
		expect(onReject).not.toHaveBeenCalled();
		expect(screen.queryByText('Allow')).not.toBeInTheDocument();

		jest.clearAllMocks();

		act(() => {
			result.current();
		});

		const cancel = await screen.findByText('Cancel');

		expect(cancel).toBeInTheDocument();
		expect(await screen.findByText('Allow')).toBeInTheDocument();

		await userEvent.click(cancel);

		// The device-change modal only closes when the user clicks the cancel button, no function is called.
		expect(onReject).not.toHaveBeenCalled();
		expect(onAccept).not.toHaveBeenCalled();
		expect(cancel).not.toBeInTheDocument();
	});
});
