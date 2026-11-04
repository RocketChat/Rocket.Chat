import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { bannerParser, messageParser, modalParser } from '../surfaces';

const wrapper = mockAppRoot().build();

const richText = (text: string) => ({
	type: 'rich_text',
	elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text }] }],
});

it('renders the title, status, details, output and safe sources of a task card', () => {
	render(
		<>
			{messageParser.render([
				{
					type: 'task_card',
					task_id: 'search',
					title: 'Searching the docs',
					status: 'complete',
					details: richText('Look for the retention policy'),
					output: richText('Found two pages'),
					sources: [
						{ type: 'url', url: 'https://example.com/policy', text: 'Retention policy' },
						{ type: 'url', url: 'javascript:alert(1)', text: 'Unsafe' },
					],
				},
			] as any)}
		</>,
		{ wrapper },
	);

	expect(screen.getByText('Searching the docs')).toBeInTheDocument();
	expect(screen.getByText('Completed')).toBeInTheDocument();
	expect(screen.getByText('Look for the retention policy')).toBeInTheDocument();
	expect(screen.getByText('Found two pages')).toBeInTheDocument();
	expect(screen.getByRole('link', { name: 'Retention policy' })).toHaveAttribute('href', 'https://example.com/policy');
	expect(screen.queryByRole('link', { name: 'Unsafe' })).not.toBeInTheDocument();
});

it.each([
	['pending', 'Pending'],
	['in_progress', 'In_progress'],
	['complete', 'Completed'],
	['error', 'Error'],
])('labels a %s task', (status, label) => {
	render(<>{messageParser.render([{ type: 'task_card', task_id: 't', title: 'Step', status }] as any)}</>, { wrapper });

	expect(screen.getByText(label)).toBeInTheDocument();
});

it('hides the title when hide_title is set', () => {
	render(
		<>
			{messageParser.render([
				{ type: 'task_card', task_id: 't', title: 'Hidden title', status: 'pending', hide_title: true, details: richText('Only details') },
			] as any)}
		</>,
		{ wrapper },
	);

	expect(screen.queryByText('Hidden title')).not.toBeInTheDocument();
	expect(screen.getByText('Only details')).toBeInTheDocument();
});

it('renders a plan with its title and every task', () => {
	render(
		<>
			{modalParser.render([
				{
					type: 'plan',
					title: 'Deployment checklist',
					tasks: [
						{ task_id: 'build', title: 'Built the image', status: 'complete' },
						{ task_id: 'migrate', title: 'Running migrations', status: 'in_progress' },
					],
				},
			] as any)}
		</>,
		{ wrapper },
	);

	expect(screen.getByText('Deployment checklist')).toBeInTheDocument();
	expect(screen.getByText('Built the image')).toBeInTheDocument();
	expect(screen.getByText('Running migrations')).toBeInTheDocument();
	expect(screen.getByText('In_progress')).toBeInTheDocument();
});

it('renders nothing in a banner, which does not accept them', () => {
	render(
		<>
			{bannerParser.render([
				{ type: 'task_card', task_id: 't', title: 'Step', status: 'pending' },
				{ type: 'plan', title: 'Plan', tasks: [] },
			] as any)}
		</>,
		{ wrapper },
	);

	expect(screen.queryByText('Step')).not.toBeInTheDocument();
	expect(screen.queryByText('Plan')).not.toBeInTheDocument();
});
