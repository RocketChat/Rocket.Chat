import { render, screen, act } from '@testing-library/react';

import IframeModal from './IframeModal';

jest.mock('@rocket.chat/fuselage', () => ({
	Modal: ({ children }: any) => <div role='dialog'>{children}</div>,
	Box: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

describe('IframeModal', () => {
	it('should render iframe with the given url', () => {
		render(<IframeModal url='https://marketplace.rocket.chat/test' confirm={jest.fn()} cancel={jest.fn()} />);

		const iframe = screen.getByTitle('Marketplace_apps');
		expect(iframe).toBeInTheDocument();
		expect(iframe).toHaveAttribute('src', 'https://marketplace.rocket.chat/test');
	});

	it('should ignore postMessage if event.source is not the iframe contentWindow', () => {
		const confirm = jest.fn();
		const cancel = jest.fn();

		render(<IframeModal url='https://marketplace.rocket.chat/test' confirm={confirm} cancel={cancel} />);

		act(() => {
			window.dispatchEvent(
				new MessageEvent('message', {
					data: JSON.stringify({ result: true }),
					source: window,
				}),
			);
		});

		expect(confirm).not.toHaveBeenCalled();
		expect(cancel).not.toHaveBeenCalled();
	});

	it('should call confirm if event.source matches the iframe contentWindow and result is true', () => {
		const confirm = jest.fn();
		const cancel = jest.fn();

		render(<IframeModal url='https://marketplace.rocket.chat/test' confirm={confirm} cancel={cancel} />);

		const iframe = screen.getByTitle('Marketplace_apps') as HTMLIFrameElement;

		act(() => {
			window.dispatchEvent(
				new MessageEvent('message', {
					data: JSON.stringify({ result: true }),
					source: iframe.contentWindow,
				}),
			);
		});

		expect(confirm).toHaveBeenCalledTimes(1);
		expect(confirm).toHaveBeenCalledWith({ result: true });
		expect(cancel).not.toHaveBeenCalled();
	});

	it('should call cancel if event.source matches the iframe contentWindow and result is false', () => {
		const confirm = jest.fn();
		const cancel = jest.fn();

		render(<IframeModal url='https://marketplace.rocket.chat/test' confirm={confirm} cancel={cancel} />);

		const iframe = screen.getByTitle('Marketplace_apps') as HTMLIFrameElement;

		act(() => {
			window.dispatchEvent(
				new MessageEvent('message', {
					data: JSON.stringify({ result: false }),
					source: iframe.contentWindow,
				}),
			);
		});

		expect(cancel).toHaveBeenCalledTimes(1);
		expect(confirm).not.toHaveBeenCalled();
	});
});
