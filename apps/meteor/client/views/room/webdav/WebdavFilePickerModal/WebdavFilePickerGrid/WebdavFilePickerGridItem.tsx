import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

export type WebdavFilePickerGridItemProps = BoxProps;

const WebdavFilePickerGridItem = (props: WebdavFilePickerGridItemProps) => (
	<Box
		borderRadius='x4'
		width='33.33%'
		display='flex'
		flexDirection='column'
		alignItems='center'
		justifyContent='center'
		minHeight='130px'
		{...props}
	/>
);

export default WebdavFilePickerGridItem;
