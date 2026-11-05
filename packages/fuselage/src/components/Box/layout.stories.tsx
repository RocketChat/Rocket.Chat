import type { Meta, StoryObj, StoryFn, StoryContext } from '@storybook/react-webpack5';
import { cloneElement } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import { Divider } from '../Divider';
import type { BoxProps } from './Box';
import Box from './Box';

export default {
	title: 'Layout/Box/Layout',
	component: Box,
	parameters: {
		docs: {
			description: {
				component: 'Here is how rich content will be rendered, in details.',
			},
		},
	},
} satisfies Meta<typeof Box>;

type Story = StoryObj<typeof Box>;

export const Borders: Story = {
	render: () => (
		<>
			<Box border='2px solid currentColor' />
			<Box borderBlock='2px solid currentColor' />
			<Box borderBlockStart='2px solid currentColor' />
			<Box borderBlockEnd='2px solid currentColor' />
			<Box borderInline='2px solid currentColor' />
			<Box borderInlineStart='2px solid currentColor' />
			<Box borderInlineEnd='2px solid currentColor' />
			<Box borderWidth='medium' />
			<Box borderBlockWidth='medium' />
			<Box borderBlockStartWidth='medium' />
			<Box borderBlockEndWidth='medium' />
			<Box borderInlineWidth='medium' />
			<Box borderInlineStartWidth='medium' />
			<Box borderInlineEndWidth='medium' />
			<Box borderWidth='default' borderStyle='dashed' />
			<Box borderWidth='default' borderBlockStyle='dashed' />
			<Box borderWidth='default' borderBlockStartStyle='dashed' />
			<Box borderWidth='default' borderBlockEndStyle='dashed' />
			<Box borderWidth='default' borderInlineStyle='dashed' />
			<Box borderWidth='default' borderInlineStartStyle='dashed' />
			<Box borderWidth='default' borderInlineEndStyle='dashed' />
			<Box borderWidth='large' borderColor='primary-500' />
			<Box borderWidth='large' borderBlockColor='primary-500' />
			<Box borderWidth='large' borderBlockStartColor='primary-500' />
			<Box borderWidth='large' borderBlockEndColor='primary-500' />
			<Box borderWidth='large' borderInlineColor='primary-500' />
			<Box borderWidth='large' borderInlineStartColor='primary-500' />
			<Box borderWidth='large' borderInlineEndColor='primary-500' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(child, {
						size: 'x32',
						margin: 'x16',
						borderColor: 'stroke-dark',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const BorderRadii: Story = {
	render: () => (
		<>
			<Box borderRadius='full' />
			<Box borderStartStartRadius='full' />
			<Box borderStartEndRadius='full' />
			<Box borderEndStartRadius='full' />
			<Box borderEndEndRadius='full' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(child, {
						backgroundColor: 'dark',
						size: 'x32',
						margin: 'x16',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const Display: Story = {
	render: () => (
		<>
			<Box display='none' />
			<Box display='inline' />
			<Box display='inline-block' />
			<Box display='inline-flex' />
			<Box display='block' />
			<Box display='flex' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box color='default'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(child, {
						children: child.props.display,
						border: '1px solid',
						borderColor: 'stroke-light',
						margin: 'x4',
						padding: 'x4',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const Elevation: Story = {
	render: () => (
		<>
			<Box elevation='0' />
			<Box elevation='1' />
			<Box elevation='2' />
			<Box elevation='1nb' />
			<Box elevation='2nb' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(child, {
						backgroundColor: 'light',
						size: 'x32',
						margin: 'x16',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const Heights: Story = {
	render: () => (
		<>
			<Box height='x64' />
			<Box height='x64' />
			<Box height='none' minHeight='x64' />
			<Box height='sw' maxHeight='x64' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context)).map((child: any) =>
					cloneElement(child, {
						backgroundColor: 'neutral',
						width: 'x32',
						margin: 'x4',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const Insets: Story = {
	render: () => (
		<>
			<Box inset='none' />
			<Box inset='x1' />
			<Box inset='x2' />
			<Box inset='x4' />
			<Box inset='x8' />
			<Box inset='x16' />
			<Box insetBlock='x16' />
			<Box insetBlockStart='x16' />
			<Box insetBlockEnd='x16' />
			<Box insetInline='x16' />
			<Box insetInlineStart='x16' />
			<Box insetInlineEnd='x16' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any) => (
					<Box key={child.key} position='relative' backgroundColor='selected' margin={16} size='x64'>
						{cloneElement(child, {
							backgroundColor: 'neutral',
							position: 'absolute',
							minSize: 'x16',
						} satisfies BoxProps)}
					</Box>
				))}
			</Box>
		),
	],
};

export const Invisible: Story = {
	render: () => <Box invisible>Invisible</Box>,
};

export const Margins: Story = {
	render: () => (
		<>
			<Box backgroundColor='neutral'>
				<Box margin={16} backgroundColor='tint' size='x16' />
			</Box>
			<Box margin={16} />
			<Box marginBlock={16} />
			<Box marginBlock={16} />
			<Box marginBlockStart={16} />
			<Box marginBlockStart={16} />
			<Box marginBlockEnd={16} />
			<Box marginBlockEnd={16} />
			<Box marginInline={16} />
			<Box marginInline={16} />
			<Box marginInlineStart={16} />
			<Box marginInlineStart={16} />
			<Box marginInlineEnd={16} />
			<Box marginInlineEnd={16} />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any, i) => (
					<Box key={i} backgroundColor='neutral-200' margin={16}>
						{cloneElement(child, { backgroundColor: 'primary-200' } satisfies BoxProps, <Box backgroundColor='neutral-500' size='x16' />)}
					</Box>
				))}
			</Box>
		),
	],
};

export const Gap: Story = {
	render: () => (
		<>
			<Box display='flex' gap='x4'>
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
			</Box>
			<Box display='flex' gap='x8'>
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
			</Box>
			<Box display='flex' gap='x16'>
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
			</Box>
			<Box display='grid' rowGap='x8' columnGap='x4'>
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
				<Box backgroundColor='neutral-500' size='x16' />
			</Box>
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexDirection='column' gap='x16'>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any, i) => (
					<Box key={i} backgroundColor='neutral-200' padding='x8'>
						{child}
					</Box>
				))}
			</Box>
		),
	],
};

export const ObjectFit: Story = {
	render: () => {
		const testImage =
			'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNWY1ZjUiLz4KICAKICA8IS0tIENvcm5lciBzcXVhcmVzIHRvIHNob3cgb3JpZW50YXRpb24gLS0+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmYwMDAwIi8+CiAgPHJlY3QgeD0iMzIwIiB5PSIwIiB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiMwMGZmMDAiLz4KICA8cmVjdCB4PSIwIiB5PSIxMjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzAwMDBmZiIvPgogIDxyZWN0IHg9IjMyMCIgeT0iMTIwIiB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNmZmZmMDAiLz4KICAKICA8IS0tIENlbnRlciBjaXJjbGUgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTAwIiByPSI0MCIgZmlsbD0iI2ZmNjYwMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz4KICAKICA8IS0tIEJvcmRlciAtLT4KICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjYiLz4KICAKICA8IS0tIExhYmVscyAtLT4KICA8dGV4dCB4PSI0MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmYiPjQwMHgyMDA8L3RleHQ+CiAgPHRleHQgeD0iMTYwIiB5PSIxMTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPk9iamVjdCBGaXQ8L3RleHQ+Cjwvc3ZnPg==';

		return (
			<Box display='flex' flexWrap='wrap' gap='x16' alignItems='flex-start'>
				<Box display='flex' flexDirection='column' alignItems='center' gap='x8'>
					<Box color='default' fontScale='c2'>
						fill
					</Box>
					<Box
						is='img'
						src={testImage}
						alt='fill'
						objectFit='fill'
						width='100px'
						height='100px'
						border='1px solid'
						borderColor='stroke-light'
					/>
				</Box>
				<Box display='flex' flexDirection='column' alignItems='center' gap='x8'>
					<Box color='default' fontScale='c2'>
						contain
					</Box>
					<Box
						is='img'
						src={testImage}
						alt='contain'
						objectFit='contain'
						width='100px'
						height='100px'
						border='1px solid'
						borderColor='stroke-light'
					/>
				</Box>
				<Box display='flex' flexDirection='column' alignItems='center' gap='x8'>
					<Box color='default' fontScale='c2'>
						cover
					</Box>
					<Box
						is='img'
						src={testImage}
						alt='cover'
						objectFit='cover'
						width='100px'
						height='100px'
						border='1px solid'
						borderColor='stroke-light'
					/>
				</Box>
				<Box display='flex' flexDirection='column' alignItems='center' gap='x8'>
					<Box color='default' fontScale='c2'>
						none
					</Box>
					<Box
						is='img'
						src={testImage}
						alt='none'
						objectFit='none'
						width='100px'
						height='100px'
						border='1px solid'
						borderColor='stroke-light'
					/>
				</Box>
				<Box display='flex' flexDirection='column' alignItems='center' gap='x8'>
					<Box color='default' fontScale='c2'>
						scale-down
					</Box>
					<Box
						is='img'
						src={testImage}
						alt='scale-down'
						objectFit='scale-down'
						width='100px'
						height='100px'
						border='1px solid'
						borderColor='stroke-light'
					/>
				</Box>
			</Box>
		);
	},
};

export const Opacity: Story = {
	render: () => (
		<Box display='flex'>
			<Box size={32} opacity={0.1} backgroundColor='dark' />
			<Box size={32} opacity={0.3} backgroundColor='dark' />
			<Box size={32} opacity={0.5} backgroundColor='dark' />
			<Box size={32} opacity={0.7} backgroundColor='dark' />
			<Box size={32} opacity={0.9} backgroundColor='dark' />
			<Box size={32} opacity={1} backgroundColor='dark' />
		</Box>
	),
};

export const Paddings: Story = {
	render: () => (
		<>
			<Box backgroundColor='neutral'>
				<Box padding={16} backgroundColor='tint' size='x16' />
			</Box>
			<Box padding={16} />
			<Box paddingBlock={16} />
			<Box paddingBlock={16} />
			<Box paddingBlockStart={16} />
			<Box paddingBlockStart={16} />
			<Box paddingBlockEnd={16} />
			<Box paddingBlockEnd={16} />
			<Box paddingInline={16} />
			<Box paddingInline={16} />
			<Box paddingInlineStart={16} />
			<Box paddingInlineStart={16} />
			<Box paddingInlineEnd={16} />
			<Box paddingInlineEnd={16} />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any, i) => (
					<Box key={i} backgroundColor='neutral-200' margin={16}>
						{cloneElement(child, { backgroundColor: 'primary-200' } satisfies BoxProps, <Box backgroundColor='neutral-500' size='x16' />)}
					</Box>
				))}
			</Box>
		),
	],
};

export const Position: Story = {
	render: () => (
		<>
			<Box position='static' />
			<Box position='relative' />
			<Box position='absolute' />
			<Box position='fixed' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any) =>
					cloneElement(child, {
						backgroundColor: 'neutral',
						size: 'x32',
						margin: 'x16',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const Widths: Story = {
	render: () => (
		<>
			<Box width='x64' />
			<Box width='x64' />
			<Box width='none' minWidth='x64' />
			<Box width='sw' maxWidth='x64' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any) =>
					cloneElement(child, {
						backgroundColor: 'neutral',
						height: 'x32',
						margin: 'x4',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const Sizes: Story = {
	render: () => (
		<>
			<Box size='x64' />
			<Box size='none' minSize='x64' />
			<Box size={9999} maxSize='x64' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any) =>
					cloneElement(child, {
						backgroundColor: 'neutral',
						margin: 'x4',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const TextAlign: Story = {
	render: () => (
		<Box display='flex' color='default' flexDirection='column'>
			<Box textAlign='left'>left</Box>
			<Divider />
			<Box textAlign='center'>center</Box>
			<Divider />
			<Box textAlign='right'>right</Box>
			<Divider />
			<Box textAlign='justify'>justify</Box>
			<Divider />
		</Box>
	),
};

export const VerticalAlign: Story = {
	render: () => (
		<>
			<Box verticalAlign='top' />
			<Box verticalAlign='baseline' />
			<Box verticalAlign='sub' />
			<Box verticalAlign='middle' />
			<Box verticalAlign='bottom' />
			<Box verticalAlign='-40px' />
			<Box verticalAlign='40px' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any) =>
					cloneElement(child, {
						display: 'inline',
						children: child.props.verticalAlign,
						color: 'default',
						border: '1px solid',
						borderColor: 'stroke-dark',
						borderRadius: 'medium',
						margin: 'x4',
						padding: 'x4',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const ZIndex: Story = {
	render: () => (
		<>
			<Box zIndex={2} borderColor='stroke-extra-light-highlight' />
			<Box zIndex={1} borderColor='stroke-highlight' />
			<Box zIndex={2} borderColor='stroke-extra-light-error' />
			<Box zIndex={1} borderColor='stroke-error' />
		</>
	),
	decorators: [
		(_: StoryFn, context: StoryContext) => (
			<Box display='flex' flexWrap='wrap' alignItems='center'>
				{flattenChildren(context.originalStoryFn(context.args, context).props.children).map((child: any) =>
					cloneElement(child, {
						backgroundColor: 'neutral',
						borderWidth: 'large',
						size: 'x32',
						margin: 'neg-x2',
					} satisfies BoxProps),
				)}
			</Box>
		),
	],
};

export const Focusable: Story = {
	render: () => (
		<Box color='default' is='span' role='button' tabIndex={0} focusable>
			Focus me
		</Box>
	),
};
