import { Avatar, ItemContent, ItemDescription, ItemLink, ItemMedia, ItemMeta, ItemRow, ItemTitle } from '@rocket.chat/fuselage';

export type ImageItemProps = {
	id: string;
	url: string | undefined;
	name: string | undefined;
	timestamp: string;
	username?: string;
	alt?: string;
};

const ImageItem = ({ id, url, name, timestamp, username, alt = '' }: ImageItemProps) => {
	return (
		<>
			{url && (
				<ItemMedia>
					<Avatar objectFit='cover' size='x36' url={url} alt={alt} />
				</ItemMedia>
			)}
			<ItemContent>
				<ItemRow>
					<ItemTitle>
						<ItemLink is='button' className='gallery-item' data-id={id} title={name}>
							{name}
						</ItemLink>
					</ItemTitle>
					<ItemMeta>{timestamp}</ItemMeta>
				</ItemRow>
				{username && <ItemDescription>@{username}</ItemDescription>}
			</ItemContent>
		</>
	);
};

export default ImageItem;
