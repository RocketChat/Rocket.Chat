import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ScreenViewer from './ScreenViewer';

const LABEL = 'Ada Lovelace — screen';

const dispatchToastMessage = jest.fn();
const requestFullscreen = jest.fn();
const exitFullscreen = jest.fn();
let fullscreenElement: Element | null = null;

const renderViewer = () =>
	render(<ScreenViewer stream={{ id: 'screen' } as MediaStream} label={LABEL} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Zoom_in: 'Zoom in',
				Zoom_out: 'Zoom out',
				Fullscreen: 'Fullscreen',
				Exit_fullscreen: 'Exit fullscreen',
				Fullscreen_failed_to_switch_not_allowed: 'Switching to fullscreen was not allowed',
				Screen_share_zoomed_hint: 'Drag, or use the arrow keys, to move around the zoomed screen',
			})
			.withToastMessageDispatch(dispatchToastMessage)
			.build(),
	});

const viewer = () => screen.getByRole('group', { name: LABEL });

// Read back from the picture's transform: how far it is zoomed, and how far it has moved, in fractions of the viewer.
const zoomShown = () => {
	const transform = viewer().querySelector('video')?.style.transform ?? '';
	const [, x = '0', y = '0', scale = '1'] = /translate\((.+)%, (.+)%\) scale\((.+)\)/.exec(transform) ?? [];
	return { scale: Number(scale), x: Number(x) / 100, y: Number(y) / 100 };
};

// jsdom has no PointerEvent, so a mouse event stands in for one, carrying the pointer it came from.
const pointer = (type: string, clientX: number, clientY: number) =>
	Object.assign(new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY }), { pointerId: 1 });

beforeEach(() => {
	jest.clearAllMocks();
	fullscreenElement = null;
	requestFullscreen.mockResolvedValue(undefined);
	exitFullscreen.mockResolvedValue(undefined);

	jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
	jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
	jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 1000, height: 500 } as DOMRect);

	Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { value: jest.fn(), configurable: true });
	Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: requestFullscreen, configurable: true });
	Object.defineProperty(document, 'exitFullscreen', { value: exitFullscreen, configurable: true });
	Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
	Object.defineProperty(document, 'fullscreenElement', { get: () => fullscreenElement, configurable: true });
});

describe('zoom', () => {
	it('zooms in and back out from its buttons', async () => {
		const user = userEvent.setup();
		renderViewer();

		expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();

		await user.click(screen.getByRole('button', { name: 'Zoom in' }));
		expect(zoomShown()).toEqual({ scale: 1.5, x: 0, y: 0 });

		await user.click(screen.getByRole('button', { name: 'Zoom out' }));
		expect(zoomShown()).toEqual({ scale: 1, x: 0, y: 0 });
		expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
	});

	it('stops zooming in at the most it zooms', async () => {
		const user = userEvent.setup();
		renderViewer();

		for (let step = 0; step < 6; step++) {
			await user.click(screen.getByRole('button', { name: 'Zoom in' }));
		}

		expect(zoomShown().scale).toBe(4);
		expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
	});

	// Ctrl+wheel is also what a trackpad pinch arrives as.
	it('zooms around the pointer on ctrl+wheel, and keeps the browser from zooming the page', () => {
		renderViewer();

		const handled = !fireEvent.wheel(viewer(), { ctrlKey: true, deltaY: -50, clientX: 750, clientY: 250 });

		// A quarter of the way right of the centre, the point under the pointer stays there as the screen grows.
		const scale = Math.exp(0.5);
		expect(handled).toBe(true);
		expect(zoomShown().scale).toBeCloseTo(scale);
		expect(zoomShown().x).toBeCloseTo(0.25 - 0.25 * scale);
		expect(zoomShown().y).toBe(0);
	});

	it('leaves a plain wheel to scroll', () => {
		renderViewer();

		const handled = !fireEvent.wheel(viewer(), { deltaY: -50 });

		expect(handled).toBe(false);
		expect(zoomShown().scale).toBe(1);
	});

	it('moves around the zoomed screen by dragging', async () => {
		const user = userEvent.setup();
		renderViewer();
		await user.click(screen.getByRole('button', { name: 'Zoom in' }));

		fireEvent(viewer(), pointer('pointerdown', 500, 250));
		fireEvent(viewer(), pointer('pointermove', 600, 200));
		fireEvent(viewer(), pointer('pointerup', 600, 200));
		fireEvent(viewer(), pointer('pointermove', 900, 500));

		expect(zoomShown()).toEqual({ scale: 1.5, x: 0.1, y: -0.1 });
	});

	// The keyboard's way to do what dragging does, announced to whoever reaches the screen with it.
	it('moves around the zoomed screen with the arrow keys once it has focus', async () => {
		const user = userEvent.setup();
		renderViewer();

		expect(viewer()).not.toHaveAttribute('tabindex');

		await user.click(screen.getByRole('button', { name: 'Zoom in' }));
		await user.tab({ shift: true });
		await user.tab({ shift: true });

		expect(viewer()).toHaveFocus();
		expect(viewer()).toHaveAccessibleDescription('Drag, or use the arrow keys, to move around the zoomed screen');

		await user.keyboard('{ArrowRight}{ArrowUp}');
		expect(zoomShown()).toEqual({ scale: 1.5, x: -0.1, y: 0.1 });
	});

	it('has no a11y violations while zoomed', async () => {
		const user = userEvent.setup();
		const { container } = renderViewer();
		await user.click(screen.getByRole('button', { name: 'Zoom in' }));

		expect(await axe(container)).toHaveNoViolations();
	});
});

describe('fullscreen', () => {
	it('shows the screen fullscreen, and back', async () => {
		const user = userEvent.setup();
		renderViewer();

		await user.click(screen.getByRole('button', { name: 'Fullscreen' }));

		expect(requestFullscreen).toHaveBeenCalledTimes(1);
		const [target] = requestFullscreen.mock.contexts;
		expect(target).toContainElement(viewer());
		expect(target).toContainElement(screen.getByRole('button', { name: 'Fullscreen' }));

		act(() => {
			fullscreenElement = target;
			document.dispatchEvent(new Event('fullscreenchange'));
		});

		const toggle = screen.getByRole('button', { name: 'Fullscreen' });
		expect(toggle).toHaveAttribute('aria-pressed', 'true');
		expect(toggle).toHaveAttribute('title', 'Exit fullscreen');

		await user.click(toggle);
		expect(exitFullscreen).toHaveBeenCalledTimes(1);
	});

	it('says so when the browser refuses to go fullscreen', async () => {
		const user = userEvent.setup();
		requestFullscreen.mockRejectedValueOnce(new TypeError('Permissions check failed'));
		renderViewer();

		await user.click(screen.getByRole('button', { name: 'Fullscreen' }));

		await waitFor(() =>
			expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: 'Switching to fullscreen was not allowed' }),
		);
	});

	it('offers no fullscreen where the browser has none', () => {
		Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true });
		renderViewer();

		expect(screen.queryByRole('button', { name: 'Fullscreen' })).not.toBeInTheDocument();
	});
});
