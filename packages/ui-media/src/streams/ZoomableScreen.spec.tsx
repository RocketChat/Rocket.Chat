import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ZoomableScreen from './ZoomableScreen.js';
import { useScreenZoom } from './useScreenZoom.js';
import ScreenZoomButtons from '../components/ScreenZoomButtons.js';

const LABEL = 'Ada Lovelace — screen';

// The screen and its zoom buttons, put together the way a viewer would.
const Viewer = ({ screenId }: { screenId: string }) => {
	const { zoom, changeZoom, zoomIn, zoomOut, canZoomIn, canZoomOut } = useScreenZoom(screenId);

	return (
		<>
			<ZoomableScreen stream={{ id: screenId } as MediaStream} zoom={zoom} onZoomChange={changeZoom} aria-labelledby='screen-label' />
			<span id='screen-label'>{LABEL}</span>
			<ScreenZoomButtons canZoomIn={canZoomIn} canZoomOut={canZoomOut} onZoomIn={zoomIn} onZoomOut={zoomOut} />
		</>
	);
};

const renderViewer = () =>
	render(<Viewer screenId='screen' />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Zoom_in: 'Zoom in',
				Zoom_out: 'Zoom out',
				Zoom_level_percent: 'Zoom {{percent}}%',
				Screen_share_zoomed_hint: 'Drag, or use the arrow keys, to move around the zoomed screen',
			})
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
	jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
	jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
	jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 1000, height: 500 } as DOMRect);
	Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { value: jest.fn(), configurable: true });
});

afterEach(() => {
	jest.restoreAllMocks();
});

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

// Disabled under the keyboard, a button would leave it with nothing focused.
it('hands focus to the other button when the focused one can go no further', async () => {
	const user = userEvent.setup();
	renderViewer();

	await user.tab();
	expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveFocus();
	await user.keyboard('{Enter}{Enter}{Enter}{Enter}{Enter}{Enter}');
	expect(screen.getByRole('button', { name: 'Zoom out' })).toHaveFocus();

	await user.keyboard('{Enter}{Enter}{Enter}{Enter}{Enter}{Enter}');
	expect(zoomShown().scale).toBe(1);
	expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveFocus();
});

// A zoom change shows only as a bigger picture, which a screen reader cannot tell.
it('announces how far it is zoomed', async () => {
	const user = userEvent.setup();
	renderViewer();

	expect(screen.getByRole('status')).toHaveTextContent('Zoom 100%');
	await user.click(screen.getByRole('button', { name: 'Zoom in' }));
	expect(screen.getByRole('status')).toHaveTextContent('Zoom 150%');
});

it('starts another screen unzoomed', async () => {
	const user = userEvent.setup();
	const { rerender } = renderViewer();
	await user.click(screen.getByRole('button', { name: 'Zoom in' }));

	rerender(<Viewer screenId='another-screen' />);

	expect(zoomShown().scale).toBe(1);
	expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
});

// A 2:1 viewer showing a 4:3 screen has bars at its sides, which are not part of the screen to move onto.
it('keeps a letterboxed screen centred until it is zoomed past its bars', async () => {
	jest.spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get').mockReturnValue(800);
	jest.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockReturnValue(600);
	const user = userEvent.setup();
	renderViewer();
	await user.click(screen.getByRole('button', { name: 'Zoom in' }));

	fireEvent(viewer(), pointer('pointerdown', 500, 250));
	fireEvent(viewer(), pointer('pointermove', 900, 200));

	expect(zoomShown()).toEqual({ scale: 1.5, x: 0, y: -0.1 });
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

	expect(viewer()).toHaveAttribute('tabindex', '-1');

	await user.click(screen.getByRole('button', { name: 'Zoom in' }));
	await user.tab({ shift: true });
	await user.tab({ shift: true });

	expect(viewer()).toHaveFocus();
	expect(viewer()).toHaveAccessibleDescription('Drag, or use the arrow keys, to move around the zoomed screen');

	await user.keyboard('{ArrowRight}{ArrowUp}');
	expect(zoomShown()).toEqual({ scale: 1.5, x: -0.1, y: 0.1 });
});

it('leaves the arrow keys held with a modifier to the browser', async () => {
	const user = userEvent.setup();
	renderViewer();
	await user.click(screen.getByRole('button', { name: 'Zoom in' }));
	await user.tab({ shift: true });
	await user.tab({ shift: true });

	await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');

	expect(zoomShown()).toEqual({ scale: 1.5, x: 0, y: 0 });
});

it('has no a11y violations while zoomed', async () => {
	const user = userEvent.setup();
	const { container } = renderViewer();
	await user.click(screen.getByRole('button', { name: 'Zoom in' }));

	expect(await axe(container)).toHaveNoViolations();
});
