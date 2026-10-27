import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Table from './Table';
import * as stories from './Table.stories';
import TableBody from './TableBody';
import TableCell from './TableCell';
import TableRow from './TableRow';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Table Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('renders one col per declared column', () => {
		const { Columns } = composeStories(stories);
		const { container } = render(<Columns />);

		expect(container.querySelectorAll('table > colgroup > col')).toHaveLength(4);
	});

	it.each(['top', 'middle', 'bottom', 'baseline'] as const)(
		'aligns the cells of a row with cellVerticalAlign="%s"',
		(cellVerticalAlign) => {
			render(
				<Table>
					<TableBody>
						<TableRow cellVerticalAlign={cellVerticalAlign}>
							<TableCell>Cell</TableCell>
						</TableRow>
					</TableBody>
				</Table>,
			);

			expect(screen.getByRole('cell')).toHaveClass(`rcx-table__cell--vertical-align-${cellVerticalAlign}`);
		},
	);

	it("lets a cell's own verticalAlign override its row", () => {
		render(
			<Table>
				<TableBody>
					<TableRow cellVerticalAlign='top'>
						<TableCell>Row default</TableCell>
						<TableCell verticalAlign='bottom'>Override</TableCell>
					</TableRow>
				</TableBody>
			</Table>,
		);

		expect(screen.getByRole('cell', { name: 'Row default' })).toHaveClass('rcx-table__cell--vertical-align-top');
		expect(screen.getByRole('cell', { name: 'Override' })).toHaveClass('rcx-table__cell--vertical-align-bottom');
		expect(screen.getByRole('cell', { name: 'Override' })).not.toHaveClass('rcx-table__cell--vertical-align-top');
	});

	it("does not apply a row's cellVerticalAlign to a nested table", () => {
		render(
			<Table>
				<TableBody>
					<TableRow cellVerticalAlign='top'>
						<TableCell>
							<Table>
								<TableBody>
									<TableRow>
										<TableCell>Nested</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>,
		);

		const nestedCell = screen.getAllByRole('cell', { name: 'Nested' }).at(-1);
		expect(nestedCell).not.toHaveClass('rcx-table__cell--vertical-align-top');
	});
});
