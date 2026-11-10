import type { Meta, StoryObj, StoryFn, StoryContext } from '@storybook/react-webpack5';
import { cloneElement } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import type { BoxProps } from './Box';
import Box from './Box';

export default {
	title: 'Layout/Box/Colors',
	component: Box,
	parameters: {
		docs: {
			description: {
				component: 'Here are the available color props and values.',
			},
		},
	},
} satisfies Meta<typeof Box>;

type Story = StoryObj<typeof Box>;

export const SurfaceColors: Story = {
	render: () => (
		<>
			<Box backgroundColor='light' />
			<Box backgroundColor='tint' />
			<Box backgroundColor='room' />
			<Box backgroundColor='neutral' />
			<Box backgroundColor='disabled' />
			<Box backgroundColor='hover' />
			<Box backgroundColor='selected' />
			<Box backgroundColor='dark' />
			<Box backgroundColor='featured' />
			<Box backgroundColor='featured-hover' />
			<Box backgroundColor='transparent' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(
						child,
						{
							margin: 'x4',
							size: 'x122',
							color: 'annotation',
							border: '2px solid',
							borderColor: 'stroke light',
							borderRadius: 'medium',
							textAlign: 'center',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						} satisfies BoxProps,
						child.props.backgroundColor,
					),
				)}
			</Box>
		),
	],
};

export const StatusColors: Story = {
	render: () => (
		<>
			<Box backgroundColor='status-background-info' color='status-font-on-info' />
			<Box backgroundColor='status-background-success' color='status-font-on-success' />
			<Box backgroundColor='status-background-danger' color='status-font-on-danger' />
			<Box backgroundColor='status-background-warning' color='status-font-on-warning' />
			<Box backgroundColor='status-background-service-1' color='status-font-on-service-1' />
			<Box backgroundColor='status-background-service-2' color='status-font-on-service-2' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center' overflow='hidden'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(
						child,
						{
							margin: 'x4',
							size: 'x122',
							border: '2px solid',
							borderRadius: 'medium',
							textAlign: 'center',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						} satisfies BoxProps,
						child.props.backgroundColor.replace('status-background-', ''),
					),
				)}
			</Box>
		),
	],
};

export const StrokeColors: Story = {
	render: () => (
		<>
			<Box borderColor='stroke-extra-light' />
			<Box borderColor='stroke-light' />
			<Box borderColor='stroke-medium' />
			<Box borderColor='stroke-dark' />
			<Box borderColor='stroke-extra-dark' />
			<Box borderColor='stroke-extra-light-highlight' />
			<Box borderColor='stroke-highlight' />
			<Box borderColor='stroke-extra-light-error' />
			<Box borderColor='stroke-error' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center' overflow='hidden'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(
						child,
						{
							margin: 'x4',
							textAlign: 'center',
							size: 'x122',
							color: 'default',
							borderWidth: 'extra-large',
							borderRadius: 'medium',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: 8,
						} satisfies BoxProps,
						child.props.borderColor,
					),
				)}
			</Box>
		),
	],
};

export const FontColors: Story = {
	render: () => (
		<>
			<Box color='font-white' backgroundColor='dark' borderRadius='medium' />
			<Box color='font-disabled' />
			<Box color='font-annotation' />
			<Box color='font-secondary-info' />
			<Box color='font-hint' />
			<Box color='font-default' />
			<Box color='font-titles-labels' />
			<Box color='font-info' />
			<Box color='font-danger' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' alignItems='flex-start' overflow='hidden' flexDirection='column'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(child, { margin: 'x4', padding: 'x4' } satisfies BoxProps, child.props.color),
				)}
			</Box>
		),
	],
};
