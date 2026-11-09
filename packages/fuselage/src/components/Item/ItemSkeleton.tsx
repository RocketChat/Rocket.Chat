import type { ItemProps } from './Item.js';
import Item from './Item.js';
import ItemContent from './ItemContent.js';
import ItemDescription from './ItemDescription.js';
import ItemMedia from './ItemMedia.js';
import ItemTitle from './ItemTitle.js';
import type { AvatarProps } from '../Avatar/index.js';
import { Skeleton } from '../Skeleton/index.js';

export type ItemSkeletonProps = Pick<ItemProps, 'is' | 'inset'> & {
	/**
	 * The size of the avatar the loaded row shows.
	 */
	mediaSize?: AvatarProps['size'];
	/**
	 * Adds a second text line.
	 */
	description?: boolean;
};

/**
 * A loading placeholder with the same height as an `Item` with the same media and lines.
 */
const ItemSkeleton = ({ is, inset, mediaSize = 'x20', description = false }: ItemSkeletonProps) => (
	<Item is={is} inset={inset} aria-hidden>
		<ItemMedia>
			<Skeleton variant='rect' width={mediaSize} height={mediaSize} />
		</ItemMedia>
		<ItemContent>
			<ItemTitle>
				<Skeleton variant='text' width='60%' />
			</ItemTitle>
			{description && (
				<ItemDescription>
					<Skeleton variant='text' width='40%' />
				</ItemDescription>
			)}
		</ItemContent>
	</Item>
);

export default ItemSkeleton;
