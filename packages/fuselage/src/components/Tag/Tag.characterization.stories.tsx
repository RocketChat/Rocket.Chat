import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import type { MouseEvent } from 'react';
import { expect, fn } from 'storybook/test';

import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';
import { Icon } from '../Icon';
import Tag from './Tag';

// G0 characterization of Tag on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Tag',
	component: Tag,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Tag>;

type Story = StoryObj<typeof Tag>;

const onClick = fn();
const onLinkClick = fn((event: MouseEvent<HTMLElement>) => event.preventDefault());
const forwardedRef = createRef<HTMLElement>();
const callbackRef = fn();

export const Forwarding: Story = {
	render: () => (
		<>
			<Tag
				ref={forwardedRef}
				className='consumer-class'
				id='tag-id'
				title='tag title'
				data-qa='tag-qa'
				data-anything='anything'
				aria-label='tag label'
				onClick={onClick}
			>
				john.doe
			</Tag>
			<Tag
				href='/somewhere'
				ref={callbackRef}
				className='consumer-link'
				id='link-id'
				title='link title'
				data-qa='link-qa'
				data-anything='link-anything'
				aria-label='link label'
				onClick={onLinkClick}
			>
				jane.doe
			</Tag>
		</>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'span.rcx-tag', {
			'className': 'consumer-class',
			'id': 'tag-id',
			'title': 'tag title',
			'data-qa': 'tag-qa',
			'data-anything': 'anything',
			'aria-label': 'tag label',
			'ref': forwardedRef,
			'handlers': { onClick },
		});
		await expectForwards(canvasElement, 'a.rcx-tag', {
			'className': 'consumer-link',
			'id': 'link-id',
			'title': 'link title',
			'data-qa': 'link-qa',
			'data-anything': 'link-anything',
			'aria-label': 'link label',
			'ref': callbackRef,
			'handlers': { onClick: onLinkClick },
		});
	},
};

export const Tags: Story = {
	render: () => (
		<>
			<Tag>plain</Tag>
			<Tag href='/somewhere'>link</Tag>
			<Tag href='/somewhere' target='_blank' rel='noopener'>
				blank
			</Tag>
		</>
	),
	play: async ({ canvasElement }) => {
		const [plain, link, blank] = [...canvasElement.querySelectorAll('.rcx-tag')];
		await expect(plain.tagName).toBe('SPAN');
		await expect(link.tagName).toBe('A');
		await expect(link).toHaveAttribute('href', '/somewhere');
		await expect(blank).toHaveAttribute('target', '_blank');
		await expect(blank).toHaveAttribute('rel', 'noopener');
	},
};

export const Handlers: Story = {
	render: () => (
		<>
			<Tag onClick={onClick}>Enabled</Tag>
			<Tag onClick={onClick} disabled>
				Disabled
			</Tag>
		</>
	),
	play: async ({ canvasElement }) => {
		const [enabled, disabled] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-tag')];
		onClick.mockClear();

		enabled.click();
		await expect(onClick).toHaveBeenCalledTimes(1);

		// The disabled look is cosmetic: develop still delivers the click
		disabled.click();
		await expect(onClick).toHaveBeenCalledTimes(2);
	},
};

const everyVariation = (
	<div>
		<Tag>Default</Tag>
		<Tag variant='primary'>Primary</Tag>
		<Tag variant='secondary'>Secondary</Tag>
		<Tag variant='danger'>Danger</Tag>
		<Tag variant='warning'>Warning</Tag>
		<Tag variant='featured'>Featured</Tag>
		<Tag variant='secondary-danger'>Secondary danger</Tag>
		<Tag variant='secondary-warning'>Secondary warning</Tag>
		<Tag variant='secondary-info'>Secondary info</Tag>
		<Tag medium>Medium</Tag>
		<Tag large>Large</Tag>
		<Tag pill variant='secondary-info' onClick={onClick}>
			Pill
		</Tag>
		<Tag disabled>Disabled</Tag>
		<Tag icon={<Icon name='team-lock' size='x12' />}>With icon</Tag>
		<Tag href='/somewhere' variant='primary'>
			Link
		</Tag>
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- text: "Default"',
				'- text: "Primary"',
				'- text: "Secondary"',
				'- text: "Danger"',
				'- text: "Warning"',
				'- text: "Featured"',
				'- text: "Secondary danger"',
				'- text: "Secondary warning"',
				'- text: "Secondary info"',
				'- text: "Medium"',
				'- text: "Large"',
				'- text: "Pill"',
				'- text: "Disabled"',
				'- text: "With icon"',
				'- link "Link"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > span[0]: rcx-box rcx-box--full rcx-tag',
				'root > div > span[0] > span: rcx-tag__inner',
				'root > div > span[1]: rcx-box rcx-box--full rcx-tag rcx-tag--primary',
				'root > div > span[1] > span: rcx-tag__inner',
				'root > div > span[2]: rcx-box rcx-box--full rcx-tag rcx-tag--secondary',
				'root > div > span[2] > span: rcx-tag__inner',
				'root > div > span[3]: rcx-box rcx-box--full rcx-tag rcx-tag--danger',
				'root > div > span[3] > span: rcx-tag__inner',
				'root > div > span[4]: rcx-box rcx-box--full rcx-tag rcx-tag--warning',
				'root > div > span[4] > span: rcx-tag__inner',
				'root > div > span[5]: rcx-box rcx-box--full rcx-tag rcx-tag--featured',
				'root > div > span[5] > span: rcx-tag__inner',
				'root > div > span[6]: rcx-box rcx-box--full rcx-tag rcx-tag--secondary-danger',
				'root > div > span[6] > span: rcx-tag__inner',
				'root > div > span[7]: rcx-box rcx-box--full rcx-tag rcx-tag--secondary-warning',
				'root > div > span[7] > span: rcx-tag__inner',
				'root > div > span[8]: rcx-box rcx-box--full rcx-tag rcx-tag--secondary-info',
				'root > div > span[8] > span: rcx-tag__inner',
				'root > div > span[9]: rcx-box rcx-box--full rcx-tag rcx-tag--medium',
				'root > div > span[9] > span: rcx-tag__inner',
				'root > div > span[10]: rcx-box rcx-box--full rcx-tag rcx-tag--large',
				'root > div > span[10] > span: rcx-tag__inner',
				'root > div > span[11]: rcx-box rcx-box--full rcx-tag rcx-tag--clickable rcx-tag--pill rcx-tag--secondary-info',
				'root > div > span[11] > span: rcx-tag__inner',
				'root > div > span[12]: rcx-box rcx-box--full rcx-tag rcx-tag--disabled',
				'root > div > span[12] > span: rcx-tag__inner',
				'root > div > span[13]: rcx-box rcx-box--full rcx-tag',
				'root > div > span[13] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-team-lock',
				'root > div > span[13] > span: rcx-tag__inner',
				'root > div > a: rcx-box rcx-box--full rcx-tag rcx-tag--clickable rcx-tag--primary',
				'root > div > a > span: rcx-tag__inner',
			].join('\n'),
		);
	},
};
