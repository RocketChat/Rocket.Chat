import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';

import { bannerParser, messageParser } from '../surfaces';

it('renders the first row as the header and the rest as body rows', async () => {
	render(
		<MockedServerContext>
			{messageParser.render([
				{
					type: 'table',
					column_settings: [null, { align: 'right' }],
					rows: [
						[
							{ type: 'raw_text', text: 'Service' },
							{ type: 'raw_text', text: 'Uptime' },
						],
						[
							{ type: 'mrkdwn', text: '**API**' },
							{ type: 'plain_text', text: '99.9%' },
						],
					],
				},
			])}
		</MockedServerContext>,
	);

	const [headerGroup, bodyGroup] = screen.getAllByRole('rowgroup');
	expect(within(headerGroup).getByText('Service')).toBeInTheDocument();
	expect(within(headerGroup).getByText('Uptime')).toBeInTheDocument();
	expect(await within(bodyGroup).findByText('API')).toBeInTheDocument();
	expect(within(bodyGroup).getByText('99.9%')).toBeInTheDocument();
});

it('renders nothing in a banner, which does not accept tables', () => {
	render(
		<MockedServerContext>
			{bannerParser.render([{ type: 'table', rows: [[{ type: 'raw_text', text: 'Service' }]] }] as any)}
		</MockedServerContext>,
	);

	expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('renders cells that are not text as empty instead of drawing them', () => {
	render(
		<MockedServerContext>
			{messageParser.render([
				{
					type: 'table',
					rows: [
						[{ type: 'raw_text', text: 'Action' }],
						[{ type: 'button', text: { type: 'plain_text', text: 'Delete' }, actionId: 'delete', appId: 'app', blockId: 'b' }],
					],
				},
			] as any)}
		</MockedServerContext>,
	);

	expect(screen.getByText('Action')).toBeInTheDocument();
	expect(screen.queryByRole('button')).not.toBeInTheDocument();
	expect(screen.queryByText('Delete')).not.toBeInTheDocument();
});

it.each([
	['rows that are not a list', 'rows'],
	['a row that is not a list', [[{ type: 'raw_text', text: 'Service' }], 'row']],
	['cells that are not objects', [[null, 'cell', { type: 'raw_text', text: 'Service' }]]],
])('renders %s without throwing', (_, rows) => {
	render(<MockedServerContext>{messageParser.render([{ type: 'table', rows }] as any)}</MockedServerContext>);

	expect(screen.getByRole('table')).toBeInTheDocument();
});
