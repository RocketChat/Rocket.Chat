import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import ThreadMessage from './ThreadMessage';
import ThreadMessageBody from './ThreadMessageBody';
import ThreadMessageContainer from './ThreadMessageContainer';
import ThreadMessageEmoji from './ThreadMessageEmoji';
import ThreadMessageIconThread from './ThreadMessageIconThread';
import ThreadMessageOrigin from './ThreadMessageOrigin';
import ThreadMessageRow from './ThreadMessageRow';
import ThreadMessageUnfollow from './ThreadMessageUnfollow';
import { ariaSnapshot, classContract, computed, expectComputed, expectForwards, forcePseudo, isJsdom } from '../../../testing/g0';
import MessageLeftContainer from '../MessageLeftContainer';

// G0 characterization of the thread message preview on its develop implementation. A rewrite passes these unedited, in jest and
// in the compiled zero-runtime Storybook; see src/testing/README.md. The specs pass only the props that survive the migration:
// `sequential`, `isEditing` and `isPending`, which the preview ignores and the rewrite drops, stay out.
export default {
	title: 'Characterization/ThreadMessage',
	component: ThreadMessage,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof ThreadMessage>;

type Story = StoryObj<typeof ThreadMessage>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const rowRef = createRef<HTMLDivElement>();
const rowHandlers = { onClick: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onKeyDown: fn() };
const partHandlers = { onClick: fn(), onMouseEnter: fn() };
const sprite = 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)';

export const Forwarding: Story = {
	render: () => (
		<ThreadMessage ref={rowRef} {...forwarded('root')} title='root title' tabIndex={0} {...rowHandlers}>
			<ThreadMessageRow {...forwarded('row')}>
				<MessageLeftContainer>
					<ThreadMessageIconThread />
				</MessageLeftContainer>
				<ThreadMessageContainer {...forwarded('container')} {...partHandlers}>
					<ThreadMessageOrigin {...forwarded('origin')} {...partHandlers}>
						Origin
					</ThreadMessageOrigin>
					<ThreadMessageBody {...forwarded('body')} {...partHandlers}>
						Body <ThreadMessageEmoji {...forwarded('emoji')} name=':smile:' />
					</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessage>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message-thread', {
			...forwarded('root'),
			title: 'root title',
			ref: rowRef,
			handlers: rowHandlers,
		});
		await expect(canvasElement.querySelector('.rcx-message-thread')).toHaveAttribute('tabindex', '0');
		await expectForwards(canvasElement, '.rcx-message-thread__row', forwarded('row'));
		await expectForwards(canvasElement, '.rcx-message-thread__container', { ...forwarded('container'), handlers: partHandlers });
		await expectForwards(canvasElement, '.rcx-message-thread__origin', { ...forwarded('origin'), handlers: partHandlers });
		await expectForwards(canvasElement, '.rcx-message-thread__message', { ...forwarded('body'), handlers: partHandlers });
		await expectForwards(canvasElement, '.rcx-message-thread__emoji', forwarded('emoji'));
	},
};

const everyVariation = (
	<>
		<ThreadMessage>
			<ThreadMessageRow>
				<MessageLeftContainer>
					<ThreadMessageIconThread />
				</MessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageOrigin>Origin</ThreadMessageOrigin>
					<ThreadMessageUnfollow />
				</ThreadMessageContainer>
			</ThreadMessageRow>
			<ThreadMessageRow>
				<MessageLeftContainer>
					<span>Av</span>
				</MessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>
						Body <ThreadMessageEmoji name=':smile:' />
					</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessage>
		<ThreadMessage clickable isSelected tabIndex={0}>
			<ThreadMessageRow>
				<ThreadMessageContainer>
					<ThreadMessageOrigin system>system</ThreadMessageOrigin>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessage>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement).replace(/\p{Co}/gu, '')).toBe(
			['- text: "Origin"', '- text: "Av"', '- text: "Body"', '- text: "system"'].join('\n'),
		);
	},
};

// The row is an Item: its own modifiers (`rcx-item--*`) belong to the Item contract, which may grow, so only the rest is compared
const threadClasses = (root: Element) => classContract(root).replace(/ rcx-item--[\w-]+/g, '');

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(threadClasses(canvasElement)).toBe(
			[
				'root > div[0]: rcx-item rcx-message-thread',
				'root > div[0] > div: rcx-item__content rcx-message-thread__content',
				'root > div[0] > div > div[0]: rcx-item__row rcx-message-thread__row',
				'root > div[0] > div > div[0] > div[0]: rcx-item__media rcx-message-container--left',
				'root > div[0] > div > div[0] > div[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-thread',
				'root > div[0] > div > div[0] > div[1]: rcx-message-thread__container',
				'root > div[0] > div > div[0] > div[1] > div[0]: rcx-message-thread__origin',
				'root > div[0] > div > div[0] > div[1] > div[1]: rcx-item__actions rcx-item__actions--reveal-hover',
				'root > div[0] > div > div[0] > div[1] > div[1] > div: rcx-item__actions-inner',
				'root > div[0] > div > div[0] > div[1] > div[1] > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-bell-off',
				'root > div[0] > div > div[1]: rcx-item__row rcx-message-thread__row',
				'root > div[0] > div > div[1] > div[0]: rcx-item__media rcx-message-container--left',
				'root > div[0] > div > div[1] > div[1]: rcx-message-thread__container',
				'root > div[0] > div > div[1] > div[1] > div: rcx-message-thread__message',
				'root > div[0] > div > div[1] > div[1] > div > span: rcx-message-thread__emoji',
				'root > div[1]: rcx-item rcx-message-thread',
				'root > div[1] > div: rcx-item__content rcx-message-thread__content',
				'root > div[1] > div > div: rcx-item__row rcx-message-thread__row',
				'root > div[1] > div > div > div: rcx-message-thread__container',
				'root > div[1] > div > div > div > div: rcx-message-thread__origin rcx-message-thread__origin--system',
			].join('\n'),
		);
	},
};

const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;

const longText = 'A thread preview text that is far too long to fit a single line of this width. '.repeat(4);

export const PreviewType: Story = {
	render: () => (
		<div style={{ width: 320 }}>
			<ThreadMessage id='root'>
				<ThreadMessageRow id='first-row'>
					<MessageLeftContainer id='left'>
						<ThreadMessageIconThread />
					</MessageLeftContainer>
					<ThreadMessageContainer id='container'>
						<ThreadMessageOrigin id='origin'>{longText}</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
				<ThreadMessageRow id='second-row'>
					<MessageLeftContainer>
						<span>Av</span>
					</MessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageBody id='body'>{longText}</ThreadMessageBody>
					</ThreadMessageContainer>
				</ThreadMessageRow>
				<ThreadMessageRow>
					<ThreadMessageContainer>
						<ThreadMessageOrigin id='system' system>
							system text
						</ThreadMessageOrigin>
					</ThreadMessageContainer>
				</ThreadMessageRow>
			</ThreadMessage>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const rect = (id: string) => el(canvasElement, id).getBoundingClientRect();

		// The preview is small text, in the info color, and every line is a single truncated one
		await expect(computed(el(canvasElement, 'root'), 'font-size')).toBe('12px');
		await expect(computed(el(canvasElement, 'origin'), 'font-size')).toBe('12px');
		await expect(computed(el(canvasElement, 'body'), 'color')).not.toBe(computed(el(canvasElement, 'origin'), 'color'));
		for (const id of ['origin', 'body']) {
			const part = el(canvasElement, id);
			await expect([id, computed(part, 'white-space')]).toEqual([id, 'nowrap']);
			await expect([id, computed(part, 'overflow-x')]).toEqual([id, 'hidden']);
			await expect([id, computed(part, 'text-overflow')]).toEqual([id, 'ellipsis']);
			await expect(rect(id).right).toBeLessThanOrEqual(rect('root').right);
		}
		await expect(computed(el(canvasElement, 'container'), 'display')).toBe('flex');
		await expect(rect('container').width).toBeGreaterThan(0);

		// The system origin reads as the body does, and starts with a capital
		await expect(computed(el(canvasElement, 'system'), 'color')).toBe(computed(el(canvasElement, 'body'), 'color'));
		await expect(getComputedStyle(el(canvasElement, 'system'), '::first-letter').textTransform).toBe('uppercase');
		await expect(getComputedStyle(el(canvasElement, 'origin'), '::first-letter').textTransform).toBe('none');
	},
};

// The preview text starts on the text column of a message row: 8px after the left column
export const RowGap: Story = {
	render: () => (
		<ThreadMessage>
			<ThreadMessageRow id='row'>
				<MessageLeftContainer id='left'>
					<span>Av</span>
				</MessageLeftContainer>
				<ThreadMessageContainer id='container'>
					<ThreadMessageBody>Body</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessage>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		await expect(
			el(canvasElement, 'container').getBoundingClientRect().left - el(canvasElement, 'left').getBoundingClientRect().right,
		).toBe(8);
	},
};

export const RowsAreGapped: Story = {
	render: () => (
		<ThreadMessage id='root'>
			<ThreadMessageRow id='first'>
				<ThreadMessageContainer>One</ThreadMessageContainer>
			</ThreadMessageRow>
			<ThreadMessageRow id='second'>
				<ThreadMessageContainer>Two</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessage>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		await expect(el(canvasElement, 'second').getBoundingClientRect().top - el(canvasElement, 'first').getBoundingClientRect().bottom).toBe(
			8,
		);
	},
};

export const Emoji: Story = {
	render: () => (
		<ThreadMessageBody>
			<ThreadMessageEmoji id='emoji' name='emoji-class' image={sprite} />
		</ThreadMessageBody>
	),
	play: async ({ canvasElement }) => {
		const emoji = el(canvasElement, 'emoji');
		await expect(emoji).toHaveClass('rcx-message-thread__emoji', 'emoji-class');
		if (isJsdom()) return;
		await expect(computed(emoji, 'background-image')).toMatch(/data:image\/gif/);
		await expect(computed(emoji, 'display')).toBe('inline-flex');
		await expect(computed(emoji, 'vertical-align')).toBe('middle');
		await expect(emoji.getBoundingClientRect().width).toBe(12);
		await expect(emoji.getBoundingClientRect().height).toBe(12);
	},
};

export const UnfollowRevealsOnRowHover: Story = {
	render: () => (
		<div style={{ width: 320 }}>
			<ThreadMessage id='root' clickable tabIndex={0}>
				<ThreadMessageRow>
					<MessageLeftContainer>
						<ThreadMessageIconThread />
					</MessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin>Origin</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
			</ThreadMessage>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const actions = canvasElement.querySelector('.rcx-item__actions') as HTMLElement;
		await expect(computed(actions, 'opacity')).toBe('0');
		forcePseudo(el(canvasElement, 'root'), 'hover');
		await expectComputed(actions, 'opacity', '1');
	},
};

export const InteractiveState: Story = {
	render: () => (
		<>
			<ThreadMessage id='plain'>
				<ThreadMessageRow>
					<ThreadMessageContainer>Plain</ThreadMessageContainer>
				</ThreadMessageRow>
			</ThreadMessage>
			<ThreadMessage id='clickable' clickable tabIndex={0}>
				<ThreadMessageRow>
					<ThreadMessageContainer>Clickable</ThreadMessageContainer>
				</ThreadMessageRow>
			</ThreadMessage>
			<ThreadMessage id='selected' isSelected>
				<ThreadMessageRow>
					<ThreadMessageContainer>Selected</ThreadMessageContainer>
				</ThreadMessageRow>
			</ThreadMessage>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const rest = computed(el(canvasElement, 'plain'), 'background-color');
		await expect(computed(el(canvasElement, 'selected'), 'background-color')).not.toBe(rest);
		forcePseudo(el(canvasElement, 'clickable'), 'hover');
		await expect(computed(el(canvasElement, 'clickable'), 'background-color')).not.toBe(rest);
	},
};
