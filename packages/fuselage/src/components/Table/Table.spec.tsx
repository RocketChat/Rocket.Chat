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

			expect(screen.getByRole('cell')).toHaveStyle({ verticalAlign: cellVerticalAlign });
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

		expect(screen.getByRole('cell', { name: 'Row default' })).toHaveStyle({ verticalAlign: 'top' });
		expect(screen.getByRole('cell', { name: 'Override' })).toHaveStyle({ verticalAlign: 'bottom' });
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
		expect(nestedCell).not.toHaveStyle({ verticalAlign: 'top' });
	});

	it('accepts any CSS vertical-align value on a cell', () => {
		render(
			<Table>
				<TableBody>
					<TableRow>
						<TableCell verticalAlign='text-top'>Cell</TableCell>
					</TableRow>
				</TableBody>
			</Table>,
		);

		expect(screen.getByRole('cell')).toHaveStyle({ verticalAlign: 'text-top' });
	});
});
