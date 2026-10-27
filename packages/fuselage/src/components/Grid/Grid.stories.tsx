import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Fragment } from 'react';

import { Table, TableBody, TableCell, TableHead, TableRow } from '../Table';
import { Tile } from '../Tile';
import Grid from './Grid';
import GridItem from './GridItem';

export default {
	title: 'Layout/Grid',
	component: Grid,
	subcomponents: {
		GridItem,
	},
	argTypes: {
		xs: {
			control: 'boolean',
			description: 'Activates the extra-small breakpoint grid variant.',
			table: { category: 'Breakpoints' },
		},
		sm: {
			control: 'boolean',
			description: 'Activates the small breakpoint grid variant.',
			table: { category: 'Breakpoints' },
		},
		md: {
			control: 'boolean',
			description: 'Activates the medium breakpoint grid variant.',
			table: { category: 'Breakpoints' },
		},
		lg: {
			control: 'boolean',
			description: 'Activates the large breakpoint grid variant.',
			table: { category: 'Breakpoints' },
		},
		xl: {
			control: 'boolean',
			description: 'Activates the extra-large breakpoint grid variant.',
			table: { category: 'Breakpoints' },
		},
	},
} satisfies Meta<typeof Grid>;

type Story = StoryObj<typeof Grid>;

export const Default: Story = {
	render: () => (
		<Grid>
			<GridItem>
				<Tile />
			</GridItem>
			<GridItem>
				<Tile />
			</GridItem>
			<GridItem>
				<Tile />
			</GridItem>
		</Grid>
	),
};

export const Breakpoints: Story = {
	render: () => (
		<Table fixed striped sticky>
			<TableHead>
				<TableRow>
					<TableCell />
					<TableCell>extra-small</TableCell>
					<TableCell>small</TableCell>
					<TableCell>medium</TableCell>
					<TableCell>large</TableCell>
					<TableCell>extra-large</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				<TableRow>
					<TableCell is='th' scope='row'>
						Alias
					</TableCell>
					<TableCell>xs</TableCell>
					<TableCell>sm</TableCell>
					<TableCell>md</TableCell>
					<TableCell>lg</TableCell>
					<TableCell>xl</TableCell>
				</TableRow>
				<TableRow>
					<TableCell is='th' scope='row'>
						Minimun width
					</TableCell>
					<TableCell>320px</TableCell>
					<TableCell>600px</TableCell>
					<TableCell>768px</TableCell>
					<TableCell>1024px</TableCell>
					<TableCell>1440px</TableCell>
				</TableRow>
				<TableRow>
					<TableCell is='th' scope='row'>
						Columns
					</TableCell>
					<TableCell>4</TableCell>
					<TableCell>8</TableCell>
					<TableCell>8</TableCell>
					<TableCell>12</TableCell>
					<TableCell>12</TableCell>
				</TableRow>
				<TableRow>
					<TableCell is='th' scope='row'>
						Margins / Gutters
					</TableCell>
					<TableCell>16px</TableCell>
					<TableCell>16px</TableCell>
					<TableCell>24px</TableCell>
					<TableCell>24px</TableCell>
					<TableCell>24px</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

export const ExtraSmall: Story = {
	name: 'Extra Small (xs)',
	render: () => {
		type ColumnsType = 1 | 2 | 3 | 4;
		return (
			<Grid>
				{Array.from({ length: 4 })
					.map((_, i) => (i + 1) as ColumnsType)
					.map((columns) => (
						<Fragment key={columns}>
							<GridItem xs={columns}>
								<Tile>xs={columns}</Tile>
							</GridItem>
							{4 - columns > 0 && (
								<GridItem xs={(4 - columns) as ColumnsType}>
									<Tile>xs={4 - columns}</Tile>
								</GridItem>
							)}
						</Fragment>
					))}
			</Grid>
		);
	},
};

export const Small: Story = {
	name: 'Small (sm)',
	render: () => {
		type ColumnsType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
		return (
			<Grid>
				{Array.from({ length: 8 })
					.map((_, i) => (i + 1) as ColumnsType)
					.map((columns) => (
						<Fragment key={columns}>
							<GridItem sm={columns}>
								<Tile>sm={columns}</Tile>
							</GridItem>
							{8 - columns > 0 && (
								<GridItem sm={(8 - columns) as ColumnsType}>
									<Tile>sm={8 - columns}</Tile>
								</GridItem>
							)}
						</Fragment>
					))}
			</Grid>
		);
	},
};

export const Medium: Story = {
	name: 'Medium (md)',
	render: () => {
		type ColumnsType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
		return (
			<Grid>
				{Array.from({ length: 8 })
					.map((_, i) => (i + 1) as ColumnsType)
					.map((columns) => (
						<Fragment key={columns}>
							<GridItem md={columns}>
								<Tile>md={columns}</Tile>
							</GridItem>
							{8 - columns > 0 && (
								<GridItem md={(8 - columns) as ColumnsType}>
									<Tile>md={8 - columns}</Tile>
								</GridItem>
							)}
						</Fragment>
					))}
			</Grid>
		);
	},
};

export const Large: Story = {
	name: 'Large (lg)',
	render: () => {
		type ColumnsType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
		return (
			<Grid>
				{Array.from({ length: 12 })
					.map((_, i) => (i + 1) as ColumnsType)
					.map((columns) => (
						<Fragment key={columns}>
							<GridItem lg={columns}>
								<Tile>lg={columns}</Tile>
							</GridItem>
							{12 - columns > 0 && (
								<GridItem lg={(12 - columns) as ColumnsType}>
									<Tile>lg={12 - columns}</Tile>
								</GridItem>
							)}
						</Fragment>
					))}
			</Grid>
		);
	},
};

export const ExtraLarge: Story = {
	name: 'Extra Large (xl)',
	render: () => {
		type ColumnsType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
		return (
			<Grid>
				{Array.from({ length: 12 })
					.map((_, i) => (i + 1) as ColumnsType)
					.map((columns) => (
						<Fragment key={columns}>
							<GridItem xl={columns}>
								<Tile>xl={columns}</Tile>
							</GridItem>
							{12 - columns > 0 && (
								<GridItem xl={(12 - columns) as ColumnsType}>
									<Tile>xl={12 - columns}</Tile>
								</GridItem>
							)}
						</Fragment>
					))}
			</Grid>
		);
	},
};
