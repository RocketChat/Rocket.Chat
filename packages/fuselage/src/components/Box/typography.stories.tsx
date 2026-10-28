import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from '../Divider';
import Box from './Box';

export default {
	title: 'Layout/Box/Typography',
	component: Box,
} satisfies Meta<typeof Box>;

type Story = StoryObj<typeof Box>;

export const FontFamilies: Story = {
	render: () => (
		<Box color='default'>
			<Box fontFamily='sans'>Sans: The quick brown fox jumps over the lazy dog</Box>
			<Box fontFamily='mono'>Mono: The quick brown fox jumps over the lazy dog</Box>
		</Box>
	),
};

export const FontScales: Story = {
	render: () => (
		<Box color='default'>
			<Box fontScale='hero'>hero</Box>
			<Box fontScale='h1'>h1</Box>
			<Box fontScale='h2'>h2</Box>
			<Box fontScale='h3'>h3</Box>
			<Box fontScale='h4'>h4</Box>
			<Box fontScale='h5'>h5</Box>
			<Box fontScale='p1'>p1</Box>
			<Box fontScale='p1m'>p1m</Box>
			<Box fontScale='p1b'>p1b</Box>
			<Box fontScale='p2'>p2</Box>
			<Box fontScale='p2m'>p2m</Box>
			<Box fontScale='p2b'>p2b</Box>
			<Box fontScale='c1'>c1</Box>
			<Box fontScale='c2'>c2</Box>
			<Box fontScale='micro'>micro</Box>
		</Box>
	),
};

export const FontSizes: Story = {
	render: () => (
		<Box color='default'>
			<Box fontSize='hero'>hero</Box>
			<Box fontSize='h1'>h1</Box>
			<Box fontSize='h2'>h2</Box>
			<Box fontSize='h3'>h3</Box>
			<Box fontSize='h4'>h4</Box>
			<Box fontSize='h5'>h5</Box>
			<Box fontSize='p1'>p1</Box>
			<Box fontSize='p1m'>p1m</Box>
			<Box fontSize='p1b'>p1b</Box>
			<Box fontSize='p2'>p2</Box>
			<Box fontSize='p2m'>p2m</Box>
			<Box fontSize='p2b'>p2b</Box>
			<Box fontSize='c1'>c1</Box>
			<Box fontSize='c2'>c2</Box>
			<Box fontSize='micro'>micro</Box>
		</Box>
	),
};

export const FontWeights: Story = {
	render: () => (
		<Box color='default'>
			<Box fontWeight={100}>100</Box>
			<Box fontWeight={200}>200</Box>
			<Box fontWeight={300}>300</Box>
			<Box fontWeight={400}>400</Box>
			<Box fontWeight={500}>500</Box>
			<Box fontWeight={600}>600</Box>
			<Box fontWeight={700}>700</Box>
			<Box fontWeight={800}>800</Box>
			<Box fontWeight={900}>900</Box>
			<Box fontWeight='hero'>hero</Box>
			<Box fontWeight='h1'>h1</Box>
			<Box fontWeight='h2'>h2</Box>
			<Box fontWeight='h3'>h3</Box>
			<Box fontWeight='h4'>h4</Box>
			<Box fontWeight='h5'>h5</Box>
			<Box fontWeight='p1'>p1</Box>
			<Box fontWeight='p1m'>p1m</Box>
			<Box fontWeight='p1b'>p1b</Box>
			<Box fontWeight='p2'>p2</Box>
			<Box fontWeight='p2m'>p2m</Box>
			<Box fontWeight='p2b'>p2b</Box>
			<Box fontWeight='c1'>c1</Box>
			<Box fontWeight='c2'>c2</Box>
			<Box fontWeight='micro'>micro</Box>
		</Box>
	),
};

export const LineHeights: Story = {
	render: () => (
		<Box color='default'>
			<Box lineHeight='hero'>hero</Box>
			<Box lineHeight='h1'>h1</Box>
			<Box lineHeight='h2'>h2</Box>
			<Box lineHeight='h3'>h3</Box>
			<Box lineHeight='h4'>h4</Box>
			<Box lineHeight='h5'>h5</Box>
			<Box lineHeight='p1'>p1</Box>
			<Box lineHeight='p1m'>p1m</Box>
			<Box lineHeight='p1b'>p1b</Box>
			<Box lineHeight='p2'>p2</Box>
			<Box lineHeight='p2m'>p2m</Box>
			<Box lineHeight='p2b'>p2b</Box>
			<Box lineHeight='c1'>c1</Box>
			<Box lineHeight='c2'>c2</Box>
			<Box lineHeight='micro'>micro</Box>
		</Box>
	),
};

export const LetterSpacings: Story = {
	render: () => (
		<Box color='default'>
			<Box letterSpacing='hero'>hero</Box>
			<Box letterSpacing='h1'>h1</Box>
			<Box letterSpacing='h2'>h2</Box>
			<Box letterSpacing='h3'>h3</Box>
			<Box letterSpacing='h4'>h4</Box>
			<Box letterSpacing='h5'>h5</Box>
			<Box letterSpacing='p1'>p1</Box>
			<Box letterSpacing='p1m'>p1m</Box>
			<Box letterSpacing='p1b'>p1b</Box>
			<Box letterSpacing='p2'>p2</Box>
			<Box letterSpacing='p2m'>p2m</Box>
			<Box letterSpacing='p2b'>p2b</Box>
			<Box letterSpacing='c1'>c1</Box>
			<Box letterSpacing='c2'>c2</Box>
			<Box letterSpacing='micro'>micro</Box>
		</Box>
	),
};

export const FontStyles: Story = {
	render: () => (
		<Box color='default'>
			<Box fontStyle='normal'>normal</Box>
			<Box fontStyle='italic'>italic</Box>
		</Box>
	),
};

export const TextTransform: Story = {
	render: () => (
		<Box color='default'>
			<Box textTransform='none'>none</Box>
			<Box textTransform='uppercase'>uppercase</Box>
			<Box textTransform='lowercase'>lowercase</Box>
			<Box textTransform='capitalize'>capitalize</Box>
		</Box>
	),
};

export const WordBreak: Story = {
	render: () => (
		<Box color='default'>
			<Box wordBreak='break-word'>
				break-word:
				Breakwoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooord
			</Box>
			<Divider />
			<Box wordBreak='break-all'>
				break-all:
				Breakaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaall
			</Box>
		</Box>
	),
};

export const WithTruncatedText: Story = {
	render: () => (
		<Box color='default'>
			<Box withTruncatedText width='x120' border='1px solid' borderColor='stroke-dark' borderRadius='medium' padding={4}>
				This text is truncated.
			</Box>
		</Box>
	),
};
