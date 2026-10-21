import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import { render, screen } from '../../testing';
import Table from './Table';
import * as stories from './Table.stories';
import TableBody from './TableBody';
import TableCell from './TableCell';
import TableRow from './TableRow';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Table Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('renders TableRow with cellVerticalAlign prop', () => {
		render(
			<Table>
				<TableBody>
					<TableRow cellVerticalAlign='top'>
						<TableCell>Cell</TableCell>
					</TableRow>
				</TableBody>
			</Table>,
		);
		expect(screen.getByRole('row')).toHaveClass('rcx-table__row--cell-align-top');
	});

	it('renders TableCell with verticalAlign prop', () => {
		render(
			<Table>
				<TableBody>
					<TableRow>
						<TableCell verticalAlign='top'>Cell</TableCell>
					</TableRow>
				</TableBody>
			</Table>,
		);
		expect(screen.getByRole('cell')).toHaveClass('rcx-table__cell--vertical-align-top');
	});
});
