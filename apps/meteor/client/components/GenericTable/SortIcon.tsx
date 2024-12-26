import { Box } from '@rocket.chat/fuselage';

type SortIconProps = {
	direction?: 'asc' | 'desc';
};

const SortIcon = ({ direction }: SortIconProps) => (
	<Box is='svg' width='x16' height='x16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
		<path
			d='M5.33337 5.99999L8.00004 3.33333L10.6667 5.99999'
			stroke={direction === 'desc' ? '#9EA2A8' : '#E4E7EA'}
			strokeWidth='1.33333'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<path
			d='M5.33337 10L8.00004 12.6667L10.6667 10'
			stroke={direction === 'asc' ? '#9EA2A8' : '#E4E7EA'}
			strokeWidth='1.33333'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</Box>
);

export default SortIcon;
