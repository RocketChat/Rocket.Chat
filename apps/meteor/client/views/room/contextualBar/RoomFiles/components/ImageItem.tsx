import { Avatar, Box } from '@rocket.chat/fuselage';

type ImageItemProps = {
	id: string;
	url: string | undefined;
	name: string | undefined;
	timestamp: string;
	username?: string;
};

const ImageItem = ({ id, url, name, timestamp, username }: ImageItemProps) => {
	return (
		<Box minWidth={0} data-id={id} className='gallery-item-container' title={name} display='flex' flexGrow={1} flexShrink={1}>
			{url && (
				<Box minWidth='x48'>
					<Avatar size='x48' url={url} className='gallery-item' />
				</Box>
			)}
			<Box mis={8} flexShrink={1} overflow='hidden' className='gallery-item' cursor='default'>
				{name && (
					<Box withTruncatedText color='default' fontScale='p2m' className='gallery-item'>
						{name}
					</Box>
				)}
				{username && (
					<Box withTruncatedText color='hint' fontScale='p2' className='gallery-item'>
						@{username}
					</Box>
				)}
				<Box color='hint' fontScale='micro' className='gallery-item'>
					{timestamp}
				</Box>
			</Box>
		</Box>
	);
};

export default ImageItem;
