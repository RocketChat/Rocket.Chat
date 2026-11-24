import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import Avatar from './Avatar';
import AvatarContainer from './AvatarContainer';
import AvatarStack from './AvatarStack';
import { blankAvatar } from '../../../.storybook/helpers';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Avatar, AvatarContainer and AvatarStack on their develop implementation. A rewrite passes these
// unedited, in jest and in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Avatar',
	component: Avatar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Avatar>;

type Story = StoryObj<typeof Avatar>;

const onClick = fn();
const onLoad = fn();
const onError = fn();
const forwardedRef = createRef<HTMLImageElement>();
const containerRef = createRef<HTMLElement>();
const stackRef = createRef<HTMLDivElement>();

// The wrapper takes the `className`; every other attribute, the ref and the handlers go to the image
export const Forwarding: Story = {
	render: () => (
		<Avatar
			{...{ ref: forwardedRef }}
			url={blankAvatar}
			className='consumer-class'
			id='avatar-id'
			title='avatar title'
			alt='avatar alt'
			data-qa='avatar-qa'
			data-anything='anything'
			data-tooltip='tooltip'
			data-username='marie'
			aria-label='avatar label'
			aria-hidden='true'
			onClick={onClick}
			onLoad={onLoad}
			onError={onError}
			onMouseEnter={fn()}
			onMouseLeave={fn()}
			onFocus={fn()}
			onBlur={fn()}
			onKeyDown={fn()}
		/>
	),
	play: async ({ canvasElement }) => {
		const figure = canvasElement.querySelector('figure') as HTMLElement;
		const image = canvasElement.querySelector('img') as HTMLImageElement;

		await expectForwards(canvasElement, figure, { className: 'consumer-class' });
		await expectForwards(canvasElement, image, {
			'id': 'avatar-id',
			'title': 'avatar title',
			'data-qa': 'avatar-qa',
			'data-anything': 'anything',
			'aria-label': 'avatar label',
			'ref': forwardedRef,
			'handlers': { onClick, onLoad, onError },
		});

		await expect(figure).not.toHaveAttribute('id');
		await expect(image).not.toHaveClass('consumer-class');
		await expect(image).toHaveAttribute('alt', 'avatar alt');
		await expect(image).toHaveAttribute('src', blankAvatar);
		await expect(image).toHaveAttribute('data-tooltip', 'tooltip');
		await expect(image).toHaveAttribute('data-username', 'marie');
		await expect(image).toHaveAttribute('aria-hidden', 'true');
	},
};

export const EmptyAlt: Story = {
	render: () => <Avatar url={blankAvatar} />,
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('img')).toHaveAttribute('alt', '');
	},
};

export const ContainerForwarding: Story = {
	render: () => (
		<AvatarContainer
			{...{ ref: containerRef }}
			size='x40'
			className='consumer-class'
			id='container-id'
			title='container title'
			data-qa='container-qa'
			data-anything='anything'
			aria-label='container label'
			onClick={onClick}
			onMouseEnter={fn()}
		>
			<img alt='' src={blankAvatar} />
		</AvatarContainer>
	),
	play: async ({ canvasElement }) => {
		const figure = canvasElement.querySelector('figure') as HTMLElement;
		await expectForwards(canvasElement, figure, {
			'className': 'consumer-class',
			'id': 'container-id',
			'title': 'container title',
			'data-qa': 'container-qa',
			'data-anything': 'anything',
			'aria-label': 'container label',
			'ref': containerRef,
			'handlers': { onClick },
		});
		await expect(figure.querySelector('img')).not.toBeNull();
	},
};

export const StackForwarding: Story = {
	render: () => (
		<AvatarStack
			{...{ ref: stackRef }}
			className='consumer-class'
			id='stack-id'
			title='stack title'
			data-qa='stack-qa'
			data-anything='anything'
			aria-label='stack label'
			onClick={onClick}
		>
			<Avatar url={blankAvatar} alt='first' />
			<Avatar url={blankAvatar} alt='second' />
			<Avatar url={blankAvatar} alt='third' />
		</AvatarStack>
	),
	play: async ({ canvasElement }) => {
		const stack = canvasElement.querySelector('.rcx-avatar-stack') as HTMLElement;
		await expectForwards(canvasElement, stack, {
			'className': 'consumer-class',
			'id': 'stack-id',
			'title': 'stack title',
			'data-qa': 'stack-qa',
			'data-anything': 'anything',
			'aria-label': 'stack label',
			'ref': stackRef,
			'handlers': { onClick },
		});
		// The stack reverses its children, so the first one paints on top in its row-reverse layout
		await expect([...stack.querySelectorAll('img')].map((image) => image.alt)).toEqual(['third', 'second', 'first']);
	},
};

const sizes = ['x16', 'x18', 'x20', 'x24', 'x28', 'x32', 'x36', 'x40', 'x48', 'x124', 'x200', 'x332'] as const;

const everyVariation = (
	<>
		{sizes.map((size) => (
			<Avatar key={size} size={size} url={blankAvatar} alt={size} />
		))}
		<Avatar url={blankAvatar} alt='rounded' rounded />
		<Avatar url={blankAvatar} alt='contain' objectFit='contain' />
		<Avatar url={blankAvatar} alt='cover' objectFit='cover' />
		<Avatar url={blankAvatar} alt='fill' objectFit='fill' />
		<Avatar url={blankAvatar} alt='none' objectFit='none' />
		<Avatar url={blankAvatar} alt='scale-down' objectFit='scale-down' />
		<AvatarStack>
			<Avatar url={blankAvatar} alt='first' size='x24' />
			<Avatar url={blankAvatar} alt='second' size='x24' />
		</AvatarStack>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- img "x16"',
				'- img "x18"',
				'- img "x20"',
				'- img "x24"',
				'- img "x28"',
				'- img "x32"',
				'- img "x36"',
				'- img "x40"',
				'- img "x48"',
				'- img "x124"',
				'- img "x200"',
				'- img "x332"',
				'- img "rounded"',
				'- img "contain"',
				'- img "cover"',
				'- img "fill"',
				'- img "none"',
				'- img "scale-down"',
				'- img "second"',
				'- img "first"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > figure[0]: rcx-avatar rcx-avatar--x16 rcx-box rcx-box--full',
				'root > figure[0] > img: rcx-avatar__element rcx-avatar__element--x16',
				'root > figure[1]: rcx-avatar rcx-avatar--x18 rcx-box rcx-box--full',
				'root > figure[1] > img: rcx-avatar__element rcx-avatar__element--x18',
				'root > figure[2]: rcx-avatar rcx-avatar--x20 rcx-box rcx-box--full',
				'root > figure[2] > img: rcx-avatar__element rcx-avatar__element--x20',
				'root > figure[3]: rcx-avatar rcx-avatar--x24 rcx-box rcx-box--full',
				'root > figure[3] > img: rcx-avatar__element rcx-avatar__element--x24',
				'root > figure[4]: rcx-avatar rcx-avatar--x28 rcx-box rcx-box--full',
				'root > figure[4] > img: rcx-avatar__element rcx-avatar__element--x28',
				'root > figure[5]: rcx-avatar rcx-avatar--x32 rcx-box rcx-box--full',
				'root > figure[5] > img: rcx-avatar__element rcx-avatar__element--x32',
				'root > figure[6]: rcx-avatar rcx-avatar--x36 rcx-box rcx-box--full',
				'root > figure[6] > img: rcx-avatar__element rcx-avatar__element--x36',
				'root > figure[7]: rcx-avatar rcx-avatar--x40 rcx-box rcx-box--full',
				'root > figure[7] > img: rcx-avatar__element rcx-avatar__element--x40',
				'root > figure[8]: rcx-avatar rcx-avatar--x48 rcx-box rcx-box--full',
				'root > figure[8] > img: rcx-avatar__element rcx-avatar__element--x48',
				'root > figure[9]: rcx-avatar rcx-avatar--x124 rcx-box rcx-box--full',
				'root > figure[9] > img: rcx-avatar__element rcx-avatar__element--x124',
				'root > figure[10]: rcx-avatar rcx-avatar--x200 rcx-box rcx-box--full',
				'root > figure[10] > img: rcx-avatar__element rcx-avatar__element--x200',
				'root > figure[11]: rcx-avatar rcx-avatar--x332 rcx-box rcx-box--full',
				'root > figure[11] > img: rcx-avatar__element rcx-avatar__element--x332',
				'root > figure[12]: rcx-avatar rcx-avatar--x36 rcx-box rcx-box--full',
				'root > figure[12] > img: rcx-avatar__element rcx-avatar__element--rounded rcx-avatar__element--x36',
				'root > figure[13]: rcx-avatar rcx-avatar--x36 rcx-box rcx-box--full',
				'root > figure[13] > img: rcx-avatar__element rcx-avatar__element--object-fit-contain rcx-avatar__element--x36',
				'root > figure[14]: rcx-avatar rcx-avatar--x36 rcx-box rcx-box--full',
				'root > figure[14] > img: rcx-avatar__element rcx-avatar__element--object-fit-cover rcx-avatar__element--x36',
				'root > figure[15]: rcx-avatar rcx-avatar--x36 rcx-box rcx-box--full',
				'root > figure[15] > img: rcx-avatar__element rcx-avatar__element--object-fit-fill rcx-avatar__element--x36',
				'root > figure[16]: rcx-avatar rcx-avatar--x36 rcx-box rcx-box--full',
				'root > figure[16] > img: rcx-avatar__element rcx-avatar__element--object-fit-none rcx-avatar__element--x36',
				'root > figure[17]: rcx-avatar rcx-avatar--x36 rcx-box rcx-box--full',
				'root > figure[17] > img: rcx-avatar__element rcx-avatar__element--object-fit-scale-down rcx-avatar__element--x36',
				'root > div: rcx-avatar-stack',
				'root > div > figure[0]: rcx-avatar rcx-avatar--x24 rcx-box rcx-box--full',
				'root > div > figure[0] > img: rcx-avatar__element rcx-avatar__element--x24',
				'root > div > figure[1]: rcx-avatar rcx-avatar--x24 rcx-box rcx-box--full',
				'root > div > figure[1] > img: rcx-avatar__element rcx-avatar__element--x24',
			].join('\n'),
		);
	},
};
