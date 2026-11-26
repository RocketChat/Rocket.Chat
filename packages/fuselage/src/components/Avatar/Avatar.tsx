import type { AvatarContract } from './Avatar.contract';
import AvatarContainer from './AvatarContainer';
import AvatarImage from './AvatarImage';
import type { WebImageProps } from '../../types/WebTriggerProps';

export type { AvatarSize } from './AvatarContainer.contract';

/** The `className` goes on the container, every other attribute on the image. */
export type AvatarProps = WebImageProps<AvatarContract>;

const Avatar = ({ className, ...image }: AvatarProps) => (
	<AvatarContainer size={image.size ?? 'x36'} className={className}>
		<AvatarImage {...image} />
	</AvatarContainer>
);

export default Avatar;
