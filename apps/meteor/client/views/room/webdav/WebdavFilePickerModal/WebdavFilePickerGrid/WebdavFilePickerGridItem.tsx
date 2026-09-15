import { Box } from '@rocket.chat/fuselage';

const WebdavFilePickerGridItem = ({ ...props }) => (
	<Box
		borderRadius='medium'
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
