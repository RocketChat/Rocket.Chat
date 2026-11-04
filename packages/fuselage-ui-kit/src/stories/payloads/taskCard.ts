import type * as UiKit from '@rocket.chat/ui-kit';

const richText = (text: string): UiKit.RichTextBlock => ({
	type: 'rich_text',
	elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text }] }],
});

export const taskCard: readonly UiKit.LayoutBlock[] = [
	{
		type: 'task_card',
		task_id: 'search',
		title: 'Searching the documentation',
		status: 'complete',
		details: richText('Look for the data retention policy'),
		output: richText('Found two pages that describe it'),
		sources: [
			{ type: 'url', url: 'https://docs.rocket.chat', text: 'Rocket.Chat docs' },
			{ type: 'url', url: 'https://rocket.chat', text: 'rocket.chat' },
		],
	},
];

export const plan: readonly UiKit.LayoutBlock[] = [
	{
		type: 'plan',
		title: 'Deployment checklist',
		tasks: [
			{ task_id: 'build', title: 'Built the container image', status: 'complete', output: richText('Image tagged v2.4.1') },
			{ task_id: 'migrate', title: 'Running database migrations', status: 'in_progress' },
			{ task_id: 'rollout', title: 'Rolling out to production', status: 'pending' },
			{ task_id: 'smoke', title: 'Smoke tests', status: 'error', output: richText('Login check timed out') },
		],
	},
];
