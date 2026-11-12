import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties, Ref } from 'react';
import { createRef, useRef, useState } from 'react';
import { expect, fireEvent, fn, waitFor } from 'storybook/test';

import Tooltip from './Tooltip';
import type { TooltipProps } from './Tooltip';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';
import { Box } from '../Box';
import { PositionAnimated } from '../PositionAnimated';

// G0 characterization of Tooltip on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Tooltip',
	component: Tooltip,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

type Story = StoryObj<typeof Tooltip>;

const onMouseEnter = fn();
const onMouseLeave = fn();
const onAnimationEnd = fn();
const forwardedRef = createRef<HTMLDivElement>();

export const Forwarding: Story = {
	render: () => (
		<Tooltip
			ref={forwardedRef}
			className='consumer-class'
			id='tooltip-id'
			role='tooltip'
			data-qa='tooltip-qa'
			data-anything='anything'
			aria-label='tooltip label'
			aria-hidden='false'
			placement='top-middle'
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onAnimationEnd={onAnimationEnd}
		>
			Tooltip text
		</Tooltip>
	),
	play: async ({ canvasElement }) => {
		const tooltip = canvasElement.querySelector('.rcx-tooltip') as HTMLElement;
		await expectForwards(canvasElement, tooltip, {
			'className': 'consumer-class',
			'id': 'tooltip-id',
			'data-qa': 'tooltip-qa',
			'data-anything': 'anything',
			'aria-label': 'tooltip label',
			'ref': forwardedRef,
			'handlers': { onMouseEnter, onMouseLeave, onAnimationEnd },
		});
		await expect(tooltip).toHaveAttribute('role', 'tooltip');
		await expect(tooltip).toHaveAttribute('aria-hidden', 'false');
		await expect(tooltip.tagName).toBe('DIV');
	},
};

const positionStyle: CSSProperties = {
	position: 'fixed',
	top: 10,
	left: 20,
	bottom: 30,
	zIndex: 999999,
	opacity: 0.5,
	visibility: 'visible',
	overflowY: 'auto',
};

// What Position hands the element it places
export const PositionedStyle: Story = {
	render: () => <Tooltip style={positionStyle}>Positioned</Tooltip>,
	play: async ({ canvasElement }) => {
		const { style } = canvasElement.querySelector('.rcx-tooltip') as HTMLElement;
		await expect(style.position).toBe('fixed');
		await expect(style.top).toBe('10px');
		await expect(style.left).toBe('20px');
		await expect(style.bottom).toBe('30px');
		await expect(style.zIndex).toBe('999999');
		await expect(style.opacity).toBe('0.5');
		await expect(style.visibility).toBe('visible');
		await expect(style.overflowY).toBe('auto');
	},
};

const Anchored = ({ visible }: { visible: 'visible' | 'hidden' }) => {
	const anchor = useRef<HTMLButtonElement>(null);

	return (
		<>
			<button ref={anchor}>Anchor</button>
			<PositionAnimated anchor={anchor} placement='top-middle' margin={8} visible={visible}>
				<Tooltip role='tooltip'>Anchored tooltip</Tooltip>
			</PositionAnimated>
		</>
	);
};

const findPositioned = (canvasElement: HTMLElement) =>
	canvasElement.ownerDocument.querySelector<HTMLElement>('#position-container [role="tooltip"]');

// The path of the app's TooltipComponent: a direct child of PositionAnimated, which hands it ref, style, className and onAnimationEnd
const UnderPositionAnimated = () => {
	const [visible, setVisible] = useState<'visible' | 'hidden'>('visible');

	return (
		<>
			<Anchored visible={visible} />
			<button onClick={() => setVisible('hidden')}>Dismiss</button>
		</>
	);
};

export const UnderPosition: Story = {
	render: () => <UnderPositionAnimated />,
	play: async ({ canvasElement }) => {
		const tooltip = findPositioned(canvasElement);
		if (!tooltip) throw new Error('The tooltip was not portalled');

		await expect(tooltip).toHaveTextContent('Anchored tooltip');
		await expect(tooltip.style.position).toBe('fixed');
		await expect(tooltip.className).toMatch(/rcx-css-/);
	},
};

// AnimatedVisibility goes from hiding to hidden on the child's animationend: a Tooltip child has to forward it
export const HidesWhenItsAnimationEnds: Story = {
	render: () => <UnderPositionAnimated />,
	play: async ({ canvasElement }) => {
		const tooltip = findPositioned(canvasElement);
		if (!tooltip) throw new Error('The tooltip was not portalled');

		const dismiss = [...canvasElement.querySelectorAll('button')].find((button) => button.textContent === 'Dismiss') as HTMLElement;
		dismiss.click();

		await waitFor(() => expect(tooltip.className).toMatch(/rcx-css-/));
		await fireEvent.animationEnd(tooltip);
		await waitFor(() => expect(findPositioned(canvasElement)).toBeNull());
	},
};

// layout's InnerTooltip: the wrapper takes the ref and style and spreads the rest onto the Tooltip
type InnerTooltipProps = Omit<TooltipProps, 'ref'> & { ref?: Ref<HTMLDivElement> };
const InnerTooltip = ({ ref, style, ...props }: InnerTooltipProps) => (
	<div ref={ref} style={style} data-testid='wrapper'>
		<Tooltip {...props} />
	</div>
);

const wrapperRef = createRef<HTMLDivElement>();

export const SpreadByAWrapper: Story = {
	render: () => (
		<InnerTooltip
			ref={wrapperRef}
			style={{ position: 'fixed', top: 12 }}
			id='inner-id'
			aria-hidden='true'
			className='inner-class'
			placement='bottom-start'
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			Wrapped
		</InnerTooltip>
	),
	play: async ({ canvasElement }) => {
		const wrapper = canvasElement.querySelector('[data-testid="wrapper"]') as HTMLElement;
		const tooltip = canvasElement.querySelector('.rcx-tooltip') as HTMLElement;
		await expect(wrapperRef.current).toBe(wrapper);
		await expect(wrapper.style.top).toBe('12px');
		await expect(tooltip.style.top).toBe('');
		await expectForwards(canvasElement, tooltip, {
			className: 'inner-class',
			id: 'inner-id',
			handlers: { onMouseEnter, onMouseLeave },
		});
		await expect(tooltip).toHaveAttribute('aria-hidden', 'true');
		await expect(tooltip).toHaveClass('rcx-tooltip--dir-bottom', 'rcx-tooltip--pos-start');
	},
};

export const WithoutPosition: Story = {
	render: () => (
		<Box>
			<Tooltip>Chart tooltip</Tooltip>
		</Box>
	),
	play: async ({ canvasElement }) => {
		const tooltip = canvasElement.querySelector('.rcx-tooltip') as HTMLElement;
		await expect(tooltip).toHaveTextContent('Chart tooltip');
		await expect(tooltip.className).not.toMatch(/rcx-tooltip--dir/);
	},
};

const everyVariation = (
	<>
		<Tooltip>Dark</Tooltip>
		<Tooltip variation='light'>Light</Tooltip>
		<Tooltip placement='top-start'>Top start</Tooltip>
		<Tooltip placement='top-middle'>Top middle</Tooltip>
		<Tooltip placement='top-end'>Top end</Tooltip>
		<Tooltip placement='bottom-start'>Bottom start</Tooltip>
		<Tooltip placement='bottom-middle'>Bottom middle</Tooltip>
		<Tooltip placement='bottom-end'>Bottom end</Tooltip>
		<Tooltip placement='top'>Top</Tooltip>
		<Tooltip placement='bottom'>Bottom</Tooltip>
		<Tooltip placement='left'>Left</Tooltip>
		<Tooltip placement='right'>Right</Tooltip>
		<Tooltip placement={null}>No placement</Tooltip>
		<Tooltip variation='light' placement='bottom-middle'>
			Light bottom middle
		</Tooltip>
	</>
);

export const AriaTree: Story = {
	render: () => (
		<>
			<Tooltip role='tooltip'>Dark</Tooltip>
			<Tooltip role='tooltip' variation='light'>
				Light
			</Tooltip>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(['- tooltip "Dark"', '- tooltip "Light"'].join('\n'));
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		const box = 'rcx-box rcx-box--full rcx-tooltip';
		await expect(classContract(canvasElement)).toBe(
			[
				`root > div[0]: ${box} rcx-tooltip--dark`,
				`root > div[1]: ${box} rcx-tooltip--light`,
				`root > div[2]: ${box} rcx-tooltip--dark rcx-tooltip--dir-top rcx-tooltip--pos-start`,
				`root > div[3]: ${box} rcx-tooltip--dark rcx-tooltip--dir-top rcx-tooltip--pos-middle`,
				`root > div[4]: ${box} rcx-tooltip--dark rcx-tooltip--dir-top rcx-tooltip--pos-end`,
				`root > div[5]: ${box} rcx-tooltip--dark rcx-tooltip--dir-bottom rcx-tooltip--pos-start`,
				`root > div[6]: ${box} rcx-tooltip--dark rcx-tooltip--dir-bottom rcx-tooltip--pos-middle`,
				`root > div[7]: ${box} rcx-tooltip--dark rcx-tooltip--dir-bottom rcx-tooltip--pos-end`,
				`root > div[8]: ${box} rcx-tooltip--dark rcx-tooltip--dir-top`,
				`root > div[9]: ${box} rcx-tooltip--dark rcx-tooltip--dir-bottom`,
				`root > div[10]: ${box} rcx-tooltip--dark rcx-tooltip--dir-left`,
				`root > div[11]: ${box} rcx-tooltip--dark rcx-tooltip--dir-right`,
				`root > div[12]: ${box} rcx-tooltip--dark`,
				`root > div[13]: ${box} rcx-tooltip--dir-bottom rcx-tooltip--light rcx-tooltip--pos-middle`,
			].join('\n'),
		);
	},
};
