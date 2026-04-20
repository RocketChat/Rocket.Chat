import { Box, Icon } from '@rocket.chat/fuselage';

const FilePreviewIcon = ({ format }: { format: string }) => {
	return (
		<Box
			width='x48'
			height='x48'
			borderRadius={4}
			bg='surface-neutral'
			justifyContent='center'
			display='flex'
			flexDirection='column'
			alignItems='center'
			flexShrink={0}
		>
			<Icon name='attachment-file' color='default' size={32} />
			<Box withTruncatedText fontScale='micro' maxWidth='x40' color='default' textTransform='uppercase'>
				{format}
			</Box>
		</Box>
	);
};

export default FilePreviewIcon;
