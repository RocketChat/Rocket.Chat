import nameToCharacterMapping from '@rocket.chat/icons';
import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import { ToastBarClose, ToastBarIcon, ToastBarMessage, ToastBarProgress, ToastBarSurface } from '.';
import * as stories from './ToastBarComposition.stories';
import { render } from '../../testing';
import { expectForwards } from '../../testing/g0';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const forwarded = {
	'className': 'consumer-class',
	'id': 'part-id',
	'title': 'part title',
	'data-qa': 'part-qa',
	'data-anything': 'anything',
	'aria-label': 'part label',
} as const;

describe('[ToastBar composition rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test.each(testCases)('%s should have no a11y violations as a list item', async (_storyname, Story) => {
		const { container } = render(
			<ul>
				<Story is='li' />
			</ul>,
		);

		expect(screen.getByRole('listitem')).toHaveClass('rcx-toastbar');
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('ToastBarSurface', () => {
	it('forwards attributes, the class, the ref and the pointer handlers to its root', async () => {
		const ref = createRef<HTMLElement>();
		const onPointerEnter = jest.fn();
		const onPointerLeave = jest.fn();
		const { container } = render(
			<ToastBarSurface {...forwarded} ref={ref} variant='success' onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} />,
		);
		const surface = screen.getByTitle(forwarded.title);

		expect(surface).toHaveClass('rcx-toastbar');
		await expectForwards(container, surface, { ...forwarded, ref });

		await userEvent.hover(surface);
		expect(onPointerEnter).toHaveBeenCalled();
		await userEvent.unhover(surface);
		expect(onPointerLeave).toHaveBeenCalled();
	});

	it('renders a div by default and an li when asked', () => {
		render(
			<>
				<ToastBarSurface data-testid='div' />
				<ul>
					<ToastBarSurface is='li' data-testid='li' />
				</ul>
			</>,
		);

		expect(screen.getByTestId('div').tagName).toBe('DIV');
		expect(screen.getByTestId('li').tagName).toBe('LI');
		expect(screen.getByTestId('li')).toHaveClass('rcx-toastbar');
	});

	it('carries the class of its variant, and none without a variant', () => {
		render(
			<>
				<ToastBarSurface data-testid='plain' />
				<ToastBarSurface data-testid='error' variant='error' />
			</>,
		);

		expect(screen.getByTestId('plain').className).not.toMatch(/rcx-toastbar--/);
		expect(screen.getByTestId('error')).toHaveClass('rcx-toastbar', 'rcx-toastbar--error');
	});
});

describe('ToastBarIcon', () => {
	it.each([
		[undefined, 'info'],
		['info', 'info'],
		['success', 'circle-check'],
		['error', 'ban'],
	] as const)('shows the %s variant as the %s icon, hidden from assistive technologies', (variant, icon) => {
		render(
			<ToastBarSurface variant={variant}>
				<ToastBarIcon />
			</ToastBarSurface>,
		);

		const glyph = screen.getByText(nameToCharacterMapping[icon]);
		expect(glyph).toHaveClass('rcx-icon', `rcx-icon--name-${icon}`);
		expect(glyph).toHaveAttribute('aria-hidden', 'true');
	});

	it('forwards attributes, the class and the ref to its media slot', async () => {
		const ref = createRef<HTMLElement>();
		const { container } = render(
			<ToastBarSurface>
				<ToastBarIcon {...forwarded} ref={ref} />
			</ToastBarSurface>,
		);
		const media = screen.getByTitle(forwarded.title);

		expect(media).toHaveClass('rcx-item__media');
		await expectForwards(container, media, { ...forwarded, ref });
	});
});

describe('ToastBarMessage', () => {
	it.each([
		[undefined, 'status'],
		['info', 'status'],
		['success', 'status'],
		['error', 'alert'],
	] as const)('announces a %s toast with role="%s"', (variant, role) => {
		render(
			<ToastBarSurface variant={variant}>
				<ToastBarMessage>Saved</ToastBarMessage>
			</ToastBarSurface>,
		);

		expect(screen.getByRole(role)).toHaveTextContent('Saved');
	});

	it('forwards attributes, the class and the ref to its content slot', async () => {
		const ref = createRef<HTMLElement>();
		const { container } = render(
			<ToastBarSurface>
				<ToastBarMessage {...forwarded} ref={ref} />
			</ToastBarSurface>,
		);
		const content = screen.getByRole('status');

		expect(content).toHaveClass('rcx-item__content');
		await expectForwards(container, content, { ...forwarded, ref });
	});
});

describe('ToastBarClose', () => {
	it('calls onClose when its button is pressed', async () => {
		const onClose = jest.fn();
		render(
			<ToastBarSurface>
				<ToastBarClose onClose={onClose} />
			</ToastBarSurface>,
		);

		await userEvent.click(screen.getByRole('button', { name: 'Dismiss alert' }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('names its button with the label', () => {
		render(
			<ToastBarSurface>
				<ToastBarClose label='Close it' onClose={jest.fn()} />
			</ToastBarSurface>,
		);

		expect(screen.getByRole('button', { name: 'Close it' })).toBeInTheDocument();
	});

	it('forwards attributes, the class and the ref to its actions slot', async () => {
		const ref = createRef<HTMLElement>();
		const { container } = render(
			<ToastBarSurface>
				<ToastBarClose {...forwarded} ref={ref} onClose={jest.fn()} />
			</ToastBarSurface>,
		);
		const actions = screen.getByTitle(forwarded.title);

		expect(actions).toHaveClass('rcx-item__actions');
		await expectForwards(container, actions, { ...forwarded, ref });
	});
});

describe('ToastBarProgress', () => {
	it('runs for `time` seconds and holds while paused', () => {
		render(
			<>
				<ToastBarProgress data-testid='running' time={3} />
				<ToastBarProgress data-testid='paused' paused />
			</>,
		);

		const running = screen.getByTestId('running');
		const paused = screen.getByTestId('paused');
		expect(running).toHaveClass('rcx-toastbar_progressbar');
		expect(running).not.toHaveClass('rcx-toastbar_progressbar--paused');
		expect(running.style.getPropertyValue('--toast-time')).toBe('3s');
		expect(paused).toHaveClass('rcx-toastbar_progressbar', 'rcx-toastbar_progressbar--paused');
		expect(paused.style.getPropertyValue('--toast-time')).toBe('5s');
	});

	it('forwards attributes, the class and the ref', async () => {
		const ref = createRef<HTMLDivElement>();
		const { container } = render(<ToastBarProgress {...forwarded} ref={ref} />);
		const bar = screen.getByTitle(forwarded.title);

		expect(bar).toHaveClass('rcx-toastbar_progressbar');
		await expectForwards(container, bar, { ...forwarded, ref });
	});
});
