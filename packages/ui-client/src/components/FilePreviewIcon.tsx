import { Box, Icon } from '@rocket.chat/fuselage';

export type FilePreviewIconProps = { format: string };

const FilePreviewIcon = ({ format }: FilePreviewIconProps) => {
	return (
		<Box
			width='x48'
			height='x48'
			borderRadius='medium'
			backgroundColor='surface-neutral'
			color='default'
			justifyContent='center'
			display='flex'
			flexDirection='column'
			alignItems='center'
			flexShrink={0}
		>
			<Icon name='attachment-file' size={32} />
			<Box withTruncatedText fontScale='micro' maxWidth='x40' textTransform='uppercase'>
				{format}
			</Box>
		</Box>
	);
};

export default FilePreviewIcon;
