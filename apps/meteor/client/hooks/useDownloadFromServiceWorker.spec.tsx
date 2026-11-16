import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useDownloadFromServiceWorker } from './useDownloadFromServiceWorker';

const downloadAs = jest.fn();

jest.mock('../lib/download', () => ({ downloadAs: (...args: unknown[]) => downloadAs(...args) }));

type WorkerMessage = { type: string; url: string; id: string };
type TestServiceWorker = { controller?: { postMessage: (message: WorkerMessage) => void }; addEventListener: jest.Mock };

const serviceWorker = navigator.serviceWorker as unknown as TestServiceWorker;

// The hook's module listens for the service worker's answers as soon as it loads.
const [, answerListener] = serviceWorker.addEventListener.mock.calls[0] as [string, (event: { data: unknown }) => void];

const answer = (id: string) => answerListener({ data: { type: 'attachment-download-result', id, result: new ArrayBuffer(1) } });

const posted: WorkerMessage[] = [];

beforeEach(() => {
	posted.length = 0;
	downloadAs.mockClear();
	serviceWorker.controller = { postMessage: (message) => posted.push(message) };
});

afterEach(() => {
	delete serviceWorker.controller;
});

const renderDownload = () =>
	renderHook(() => useDownloadFromServiceWorker('/file-decrypt/id/a.txt', 'a.txt'), { wrapper: mockAppRoot().build() });

describe('useDownloadFromServiceWorker', () => {
	it('downloads again on a second activation (message-attachments R24)', () => {
		const { result } = renderDownload();

		for (let activation = 1; activation <= 2; activation++) {
			act(() => result.current.onClick({ preventDefault: () => undefined } as never));
			expect(posted).toHaveLength(activation);
			act(() => answer(posted[activation - 1].id));
			expect(downloadAs).toHaveBeenCalledTimes(activation);
		}
	});

	it('asks the service worker for the file, saves it under its title and does not navigate (message-attachments R24)', () => {
		const { result } = renderDownload();
		const preventDefault = jest.fn();

		act(() => result.current.onClick({ preventDefault } as never));
		act(() => answer(posted[0].id));

		expect(preventDefault).toHaveBeenCalled();
		expect(posted[0]).toMatchObject({ type: 'attachment-download', url: '/file-decrypt/id/a.txt' });
		expect(downloadAs).toHaveBeenCalledWith(expect.anything(), 'a.txt');
	});
});
