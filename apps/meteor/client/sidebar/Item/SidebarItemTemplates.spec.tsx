import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentType } from 'react';

import Condensed from './Condensed';
import Extended from './Extended';
import Medium from './Medium';

type TemplateProps = {
	'title': string;
	'href': string;
	'avatar': null;
	'selected'?: boolean;
	'aria-current'?: 'page';
	'aria-label'?: string;
	'badges'?: JSX.Element;
	'menu'?: () => JSX.Element;
	'onClick'?: () => void;
	'subtitle'?: string;
};

const templates = [
	['Condensed', Condensed],
	['Medium', Medium],
	['Extended', Extended],
] as unknown as [string, ComponentType<TemplateProps>][];

const renderRow = (template: ComponentType<TemplateProps>, props: Partial<TemplateProps> = {}) => {
	const Template = template;

	return render(
		<div role='list'>
			<div role='listitem'>
				<Template
					title='general'
					href='/channel/general'
					avatar={null}
					badges={<span role='status' aria-label='3 unread messages' />}
					menu={() => (
						<button type='button' aria-label='Options'>
							menu
						</button>
					)}
					subtitle='Rafael: release notes are up'
					{...props}
				/>
			</div>
		</div>,
		{ wrapper: mockAppRoot().build() },
	);
};

describe.each(templates)('%s', (_name, template) => {
	it('renders the room as a link to its route', () => {
		renderRow(template, { 'selected': true, 'aria-current': 'page' });

		const link = screen.getByRole('link', { name: 'general' });
		expect(link).toHaveAttribute('href', '/channel/general');
		expect(link).toHaveAttribute('aria-current', 'page');
	});

	it('names the link with the unread summary when one is given', () => {
		renderRow(template, { 'aria-label': '3 unread messages from general' });

		expect(screen.getByRole('link', { name: '3 unread messages from general' })).toBeInTheDocument();
	});

	it('keeps badges and the menu beside the link instead of inside it', async () => {
		renderRow(template);

		const link = screen.getByRole('link', { name: 'general' });
		expect(link).not.toContainElement(screen.getByRole('status', { name: '3 unread messages' }));

		await userEvent.tab();
		expect(link).toHaveFocus();

		const menu = await screen.findByRole('button', { name: 'Options' });
		expect(link).not.toContainElement(menu);
	});

	it('calls onClick when the link is clicked', async () => {
		const onClick = jest.fn((event: Event) => event.preventDefault());
		renderRow(template, { onClick: onClick as unknown as () => void });

		await userEvent.click(screen.getByRole('link', { name: 'general' }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('has no a11y violations', async () => {
		const { container } = renderRow(template);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
