/// <reference types="vite/client" />
import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentType, JSX } from 'preact';

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

const icons = import.meta.glob<ComponentType<JSX.SVGAttributes<SVGSVGElement>>>('./**/*.svg', { eager: true, import: 'default' });
const iconset = Object.entries(icons).map(([filename, component]) => ({
	component,
	name: filename.replace(/^.*\//, '').replace(/\.svg$/, ''),
}));

export const All: StoryFn<{ color: string }> = ({ color }: { color: string }) => (
	<>
		{iconset.map(({ component: Icon, name }, i) => (
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
		))}
	</>
);
All.storyName = 'all';
