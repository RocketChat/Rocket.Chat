import type { Meta, StoryObj } from '@storybook/react-vite';

import { CheckBox } from '../CheckBox';
import Table from './Table';
import TableBody from './TableBody';
import TableCell from './TableCell';
import TableHead from './TableHead';
import TableRow from './TableRow';
import { TableSelection, TableSelectionButton, TableSelectionButtonGroup } from './TableSelection';

export default {
	title: 'Data Display/Table',
	component: Table,
	subcomponents: {
		TableHead,
		TableRow,
		TableCell,
		TableBody,
		TableSelection,
		TableSelectionButton,
		TableSelectionButtonGroup,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Displays tabular data with sortable columns, selectable rows, and cell content (title/subtitle, tags, actions).\n\n' +
					'**Rules**\n' +
					"- Match the header column count to the row's column count.\n" +
					'- Supports multi-row selection (e.g. "3 items selected") and row actions.\n' +
					'- Typically paired with Pagination.',
			},
		},
	},
	argTypes: {
		striped: {
			control: 'boolean',
			description: 'Applies alternating row background stripes.',
		},
		sticky: {
			control: 'boolean',
			description: 'Keeps the table header fixed while the body scrolls.',
		},
		fixed: {
			control: 'boolean',
			description: 'Uses a fixed table layout algorithm for column widths.',
		},
		columns: {
			control: 'object',
			description: "Declares the width of each column, in order: a size token like `'x36'`, or `'auto'`.",
		},
	},
} satisfies Meta<typeof Table>;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
	render: () => (
		<>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Dessert (100g serving)</TableCell>
						<TableCell align='end'>Calories</TableCell>
						<TableCell align='end'>Fat&nbsp;(g)</TableCell>
						<TableCell align='end'>Carbs&nbsp;(g)</TableCell>
						<TableCell align='end'>Protein&nbsp;(g)</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					<TableRow action>
						<TableCell is='th' scope='row'>
							Frozen yoghurt
						</TableCell>
						<TableCell align='end'>159</TableCell>
						<TableCell align='end'>6</TableCell>
						<TableCell align='end'>24</TableCell>
						<TableCell align='end'>4</TableCell>
					</TableRow>
					<TableRow>
						<TableCell is='th' scope='row'>
							Ice cream sandwich
						</TableCell>
						<TableCell align='end'>237</TableCell>
						<TableCell align='end'>9</TableCell>
						<TableCell align='end'>37</TableCell>
						<TableCell align='end'>4.3</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</>
	),
};

export const WithSelection: Story = {
	render: () => (
		<>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>
							<CheckBox aria-label='select all' checked={false} />
						</TableCell>
						<TableCell>Dessert (100g serving)</TableCell>
						<TableCell align='end'>Calories</TableCell>
						<TableCell align='end'>Fat&nbsp;(g)</TableCell>
						<TableCell align='end'>Carbs&nbsp;(g)</TableCell>
						<TableCell align='end'>Protein&nbsp;(g)</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					<TableRow selected>
						<TableCell>
							<CheckBox aria-label='select frozen yoghurt' checked />
						</TableCell>
						<TableCell is='th' scope='row'>
							Frozen yoghurt
						</TableCell>
						<TableCell align='end'>159</TableCell>
						<TableCell align='end'>6</TableCell>
						<TableCell align='end'>24</TableCell>
						<TableCell align='end'>4</TableCell>
					</TableRow>
					<TableRow selected>
						<TableCell>
							<CheckBox aria-label='select frozen yoghurt' checked />
						</TableCell>
						<TableCell is='th' scope='row'>
							Frozen yoghurt
						</TableCell>
						<TableCell align='end'>159</TableCell>
						<TableCell align='end'>6</TableCell>
						<TableCell align='end'>24</TableCell>
						<TableCell align='end'>4</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>
							<CheckBox aria-label='select frozen yoghurt' checked={false} />
						</TableCell>
						<TableCell is='th' scope='row'>
							Frozen yoghurt
						</TableCell>
						<TableCell align='end'>159</TableCell>
						<TableCell align='end'>6</TableCell>
						<TableCell align='end'>24</TableCell>
						<TableCell align='end'>4</TableCell>
					</TableRow>
					<TableRow selected>
						<TableCell>
							<CheckBox aria-label='select frozen yoghurt' checked />
						</TableCell>
						<TableCell is='th' scope='row'>
							Frozen yoghurt
						</TableCell>
						<TableCell align='end'>159</TableCell>
						<TableCell align='end'>6</TableCell>
						<TableCell align='end'>24</TableCell>
						<TableCell align='end'>4</TableCell>
					</TableRow>
					<TableRow selected>
						<TableCell>
							<CheckBox aria-label='select frozen yoghurt' checked />
						</TableCell>
						<TableCell is='th' scope='row'>
							Frozen yoghurt
						</TableCell>
						<TableCell align='end'>159</TableCell>
						<TableCell align='end'>6</TableCell>
						<TableCell align='end'>24</TableCell>
						<TableCell align='end'>4</TableCell>
					</TableRow>
				</TableBody>
			</Table>
			<TableSelection text='5 Items selected'>
				<TableSelectionButtonGroup>
					<TableSelectionButton>Delete</TableSelectionButton>
					<TableSelectionButton>Cancel</TableSelectionButton>
				</TableSelectionButtonGroup>
			</TableSelection>
		</>
	),
};

export const Striped: Story = {
	render: () => (
		<Table fixed striped sticky>
			<TableHead>
				<TableRow>
					<TableCell>Dessert (100g serving)</TableCell>
					<TableCell align='end'>Calories</TableCell>
					<TableCell align='end'>Fat&nbsp;(g)</TableCell>
					<TableCell align='end'>Carbs&nbsp;(g)</TableCell>
					<TableCell align='end'>Protein&nbsp;(g)</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				<TableRow>
					<TableCell is='th' scope='row'>
						Frozen yoghurt
					</TableCell>
					<TableCell align='end'>159</TableCell>
					<TableCell align='end'>6</TableCell>
					<TableCell align='end'>24</TableCell>
					<TableCell align='end'>4</TableCell>
				</TableRow>
				<TableRow>
					<TableCell is='th' scope='row'>
						Frozen yoghurt
					</TableCell>
					<TableCell align='end'>159</TableCell>
					<TableCell align='end'>6</TableCell>
					<TableCell align='end'>24</TableCell>
					<TableCell align='end'>4</TableCell>
				</TableRow>
				<TableRow>
					<TableCell is='th' scope='row'>
						Frozen yoghurt
					</TableCell>
					<TableCell align='end'>159</TableCell>
					<TableCell align='end'>6</TableCell>
					<TableCell align='end'>24</TableCell>
					<TableCell align='end'>4</TableCell>
				</TableRow>
				<TableRow>
					<TableCell is='th' scope='row'>
						Frozen yoghurt
					</TableCell>
					<TableCell align='end'>159</TableCell>
					<TableCell align='end'>6</TableCell>
					<TableCell align='end'>24</TableCell>
					<TableCell align='end'>4</TableCell>
				</TableRow>
				<TableRow>
					<TableCell is='th' scope='row'>
						Ice cream sandwich
					</TableCell>
					<TableCell align='end'>237</TableCell>
					<TableCell align='end'>9</TableCell>
					<TableCell align='end'>37</TableCell>
					<TableCell align='end'>4.3</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

export const Columns: Story = {
	render: () => (
		<Table columns={['x36', 'auto', 'x80', 'x80']}>
			<TableHead>
				<TableRow>
					<TableCell>
						<CheckBox aria-label='select all' checked={false} />
					</TableCell>
					<TableCell>Dessert (100g serving)</TableCell>
					<TableCell align='end'>Calories</TableCell>
					<TableCell align='end'>Fat&nbsp;(g)</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				<TableRow>
					<TableCell>
						<CheckBox aria-label='select frozen yoghurt' checked={false} />
					</TableCell>
					<TableCell is='th' scope='row'>
						Frozen yoghurt
					</TableCell>
					<TableCell align='end'>159</TableCell>
					<TableCell align='end'>6</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>
						<CheckBox aria-label='select ice cream sandwich' checked={false} />
					</TableCell>
					<TableCell is='th' scope='row'>
						Ice cream sandwich
					</TableCell>
					<TableCell align='end'>237</TableCell>
					<TableCell align='end'>9</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

export const RowHeader: Story = {
	render: () => (
		<Table striped>
			<TableBody>
				<TableRow>
					<TableCell rowHeader align='end'>
						Address
					</TableCell>
					<TableCell>10.0.4.17</TableCell>
				</TableRow>
				<TableRow>
					<TableCell rowHeader align='end'>
						Current Status &gt; Connected
					</TableCell>
					<TableCell>true</TableCell>
				</TableRow>
				<TableRow>
					<TableCell rowHeader align='end'>
						Instance Record &gt; Created at
					</TableCell>
					<TableCell>22/10/2026 09:14</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

export const Fixed: Story = {
	render: () => (
		<Table fixed>
			<TableHead>
				<TableRow>
					<TableCell>Dessert (100g serving)</TableCell>
					<TableCell align='end'>Calories</TableCell>
					<TableCell align='end'>Fat&nbsp;(g)</TableCell>
					<TableCell align='end'>Carbs&nbsp;(g)</TableCell>
					<TableCell align='end'>Protein&nbsp;(g)</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				<TableRow>
					<TableCell is='th' scope='row'>
						Frozen yoghurt
					</TableCell>
					<TableCell align='end'>159</TableCell>
					<TableCell align='end'>6</TableCell>
					<TableCell align='end'>24</TableCell>
					<TableCell align='end'>4</TableCell>
				</TableRow>
				<TableRow>
					<TableCell is='th' scope='row'>
						Ice cream sandwich
					</TableCell>
					<TableCell align='end'>237</TableCell>
					<TableCell align='end'>9</TableCell>
					<TableCell align='end'>37</TableCell>
					<TableCell align='end'>4.3</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};
