import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ModalProvider, ModalRegion } from '@rocket.chat/ui-client';
import { renderHook, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { PermissionRequestCancelledCallRejectedError, useDevicePermissionPrompt2 } from './useDevicePermissionPrompt';

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
		Allow: 'Allow',
		VoIP_device_permission_required_description:
			'Your web browser stopped {{workspaceUrl}} from using your microphone and/or speaker.\n\nAllow speaker and microphone access in your browser settings to prevent seeing this message again.',
	})
	.wrap(modalWrapper);

Object.defineProperty(global.navigator, 'mediaDevices', {
	value: {
		getUserMedia: jest.fn(async () => ({ getTracks: () => [] })),
	},
});

describe.each(types)('useDevicePermissionPrompt2 - Action: %s', (actionType) => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('Should immediately resolve with stream (permission granted)', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt2(), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'granted' } as PermissionStatus).build(),
		});

		let stream: MediaStream | undefined;
		await act(async () => {
			stream = await result.current({ actionType });
		});

		await waitFor(() => {
			expect(stream).toBeDefined();
			expect(result.current).toBeInstanceOf(Function);
		});
	});

	it('Should open "denied" modal (permission denied)', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt2(), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'denied' } as PermissionStatus).build(),
		});

		act(() => {
			void result.current({ actionType });
		});

		const cancel = await screen.findByText('Cancel');
		expect(cancel).toBeInTheDocument();

		await userEvent.click(cancel);

		expect(cancel).not.toBeInTheDocument();
	});
});

describe('useDevicePermissionPrompt2 - Permission state: prompt', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('Should open "incoming - prompt" modal and resolve/reject respectively', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt2(), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'prompt' } as PermissionStatus).build(),
		});

		let acceptPromise!: Promise<MediaStream>;
		act(() => {
			acceptPromise = result.current({ actionType: 'incoming' });
		});

		const accept = await screen.findByText('Allow and accept');
		expect(accept).toBeInTheDocument();
		expect(await screen.findByText('Cancel and reject')).toBeInTheDocument();

		await userEvent.click(accept);

		const stream = await acceptPromise;
		expect(stream).toBeDefined();
		expect(screen.queryByText('Allow and accept')).not.toBeInTheDocument();

		jest.clearAllMocks();

		let rejectPromise!: Promise<MediaStream>;
		act(() => {
			rejectPromise = result.current({ actionType: 'incoming' });
		});
		// eslint-disable-next-line jest/valid-expect
		const rejectionExpectation = expect(rejectPromise).rejects.toThrow(PermissionRequestCancelledCallRejectedError);

		const cancel = await screen.findByText('Cancel and reject');

		expect(cancel).toBeInTheDocument();
		expect(await screen.findByText('Allow and accept')).toBeInTheDocument();

		await userEvent.click(cancel);

		await rejectionExpectation;
		expect(cancel).not.toBeInTheDocument();
	});

	it('Should open "outgoing - prompt" modal and resolve / close on cancel', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt2(), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'prompt' } as PermissionStatus).build(),
		});

		let acceptPromise!: Promise<MediaStream>;
		act(() => {
			acceptPromise = result.current({ actionType: 'outgoing' });
		});

		const accept = await screen.findByText('Allow and call');
		expect(accept).toBeInTheDocument();
		expect(await screen.findByText('Cancel')).toBeInTheDocument();

		await userEvent.click(accept);

		const stream = await acceptPromise;
		expect(stream).toBeDefined();
		expect(screen.queryByText('Allow and call')).not.toBeInTheDocument();

		jest.clearAllMocks();

		act(() => {
			void result.current({ actionType: 'outgoing' });
		});

		const cancel = await screen.findByText('Cancel');

		expect(cancel).toBeInTheDocument();
		expect(await screen.findByText('Allow and call')).toBeInTheDocument();

		await userEvent.click(cancel);

		expect(cancel).not.toBeInTheDocument();
	});

	it('Should open "device-change - prompt" modal and resolve / close on cancel', async () => {
		const { result } = renderHook(() => useDevicePermissionPrompt2(), {
			wrapper: appRoot.withMicrophonePermissionState({ state: 'prompt' } as PermissionStatus).build(),
		});

		let acceptPromise!: Promise<MediaStream>;
		act(() => {
			acceptPromise = result.current({ actionType: 'device-change' });
		});

		const accept = await screen.findByText('Allow');
		expect(accept).toBeInTheDocument();
		expect(await screen.findByText('Cancel')).toBeInTheDocument();

		await userEvent.click(accept);

		const stream = await acceptPromise;
		expect(stream).toBeDefined();
		expect(screen.queryByText('Allow')).not.toBeInTheDocument();

		jest.clearAllMocks();

		act(() => {
			void result.current({ actionType: 'device-change' });
		});

		const cancel = await screen.findByText('Cancel');

		expect(cancel).toBeInTheDocument();
		expect(await screen.findByText('Allow')).toBeInTheDocument();

		await userEvent.click(cancel);

		expect(cancel).not.toBeInTheDocument();
	});
});
