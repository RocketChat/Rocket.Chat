import path from 'path';

import type { Meta, Story } from '@storybook/preact';

export default {
	title: 'Components/Icons',
	argTypes: {
		color: {
			control: 'color',
			defaultValue: '#E0364D',
		},
	},
	decorators: [(storyFn) => <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>{storyFn()}</div>],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<{ color: string }>;

const req = require.context('./', true, /\.svg$/);
const iconset = req.keys().map((filename) => ({
	component: req(filename),
	name: path.basename(filename, '.svg'),
}));

export const All: Story<{ color: string }> = ({ color }) => (
	<>
		{iconset.map(
			(
				{
					// eslint-disable-next-line @typescript-eslint/naming-convention
					component: Icon,
					name,
				},
				i,
			) => (
				<div
					key={i}
					style={{
						width: 130,
						height: 130,
						margin: 10,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'stretch',
					}}
				>
					<div style={{ flex: 1, display: 'flex', alignItems: 'center', color }}>
						<Icon width={48} height={48} />
					</div>
					<div style={{ flex: 0 }}>{name}</div>
				</div>
			),
		)}
	</>
);
All.storyName = 'all';
