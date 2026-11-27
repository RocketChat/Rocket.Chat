import type * as UiKit from '@rocket.chat/ui-kit';

// Invented message-surface payloads in the shapes of docs/features/uikit/reference.md and the apps/uikit-playground samples
const appId = 'sample-app';
const logo = 'https://open.rocket.chat/images/logo/android-chrome-192x192.png';
const plain = (text: string) => ({ type: 'plain_text', text }) as const;
const mrkdwn = (text: string) => ({ type: 'mrkdwn', text }) as const;
const button = (actionId: string, text: string, style?: 'primary' | 'danger' | 'warning' | 'success', extra?: { secondary?: boolean }) =>
	({ type: 'button', appId, blockId: 'b', actionId, text: plain(text), ...(style && { style }), ...extra }) as const;

export type SamplePayload = { name: string; blocks: readonly UiKit.Block[] };

export const samplePayloads: SamplePayload[] = [
	{
		name: 'section: mrkdwn + fields',
		blocks: [
			{
				type: 'section',
				appId,
				blockId: 's1',
				text: mrkdwn('*Deploy finished* for `web-client` with _no warnings_. See [the run](https://rocket.chat).'),
				fields: [mrkdwn('*Status*\nSucceeded'), mrkdwn('*Duration*\n4m 12s'), mrkdwn('*Branch*\n`release/9.0`'), plain('Plain field')],
			},
		],
	},
	{
		name: 'section: button accessory',
		blocks: [{ type: 'section', appId, blockId: 's2', text: mrkdwn('Approve the *staging* rollout?'), accessory: button('approve', 'Approve', 'primary') }],
	},
	{
		name: 'section: image accessory',
		blocks: [{ type: 'section', appId, blockId: 's3', text: mrkdwn('Section with an image accessory'), accessory: { type: 'image', imageUrl: logo, altText: 'Logo' } }],
	},
	{
		name: 'actions: primary / default / danger / outlined',
		blocks: [
			{
				type: 'actions',
				appId,
				blockId: 'a1',
				elements: [button('ok', 'Ship it', 'primary'), button('later', 'Later'), button('drop', 'Discard', 'danger'), button('warn', 'Careful', 'warning', { secondary: true }), button('good', 'Good', 'success')],
			},
		],
	},
	{
		name: 'context: image + text',
		blocks: [{ type: 'context', appId, blockId: 'c1', elements: [{ type: 'image', imageUrl: logo, altText: 'Logo' }, mrkdwn('Posted by *Build bot* · 2 minutes ago')] }],
	},
	{ name: 'image block', blocks: [{ type: 'image', appId, blockId: 'i1', imageUrl: logo, altText: 'Rocket.Chat logo', title: plain('Rocket.Chat logo') }] },
	{
		name: 'divider + header',
		blocks: [
			{ type: 'header', appId, blockId: 'h1', text: plain('Release checklist') },
			{ type: 'divider', appId, blockId: 'd1' },
			{ type: 'markdown', appId, blockId: 'm1', text: '- [x] tests\n- [ ] changelog\n\n> keep it short' },
		],
	},
	{
		name: 'callout + alert',
		blocks: [
			{ type: 'callout', appId, blockId: 'co1', variant: 'warning', title: plain('Heads up'), text: mrkdwn('The *cache* will be cleared at 18:00.'), accessory: button('ack', 'Got it') },
			{ type: 'alert', appId, blockId: 'al1', level: 'error', text: plain('Could not reach the build server') },
			{ type: 'alert', appId, blockId: 'al2', level: 'success', text: mrkdwn('All **checks** passed') },
		],
	},
	{
		name: 'unsupported blocks and elements',
		blocks: [
			{ type: 'input', appId, blockId: 'in1', label: plain('Name'), element: { type: 'plain_text_input', appId, blockId: 'in1', actionId: 'name' } },
			{ type: 'actions', appId, blockId: 'a2', elements: [button('go', 'Go', 'primary'), { type: 'static_select', appId, blockId: 'a2', actionId: 'pick', placeholder: plain('Pick'), options: [{ text: plain('One'), value: '1' }] }] },
			{ type: 'unknown_future_block', appId, blockId: 'u1' },
		] as unknown as UiKit.Block[],
	},
	{
		name: 'malformed (must not throw)',
		blocks: [
			null,
			'text',
			{ type: 'section', blockId: 'x1' },
			{ type: 'actions', appId, blockId: 'x2', elements: [null, { type: 'button' }, 42] },
			{ type: 'image', appId, blockId: 'x3', imageUrl: 'javascript:alert(1)', altText: 'bad scheme' },
			{ type: 'context', appId, blockId: 'x4', elements: 'not an array' },
			{ type: 'section', appId, blockId: 'x5', text: { type: 'mrkdwn', text: 42 }, fields: 'nope' },
		] as unknown as UiKit.Block[],
	},
];
