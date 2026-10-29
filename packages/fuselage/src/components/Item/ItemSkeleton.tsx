import type { AvatarProps } from '../Avatar';
import { Skeleton } from '../Skeleton';
import type { ItemProps } from './Item';
import Item from './Item';
import ItemContent from './ItemContent';
import ItemDescription from './ItemDescription';
import ItemMedia from './ItemMedia';
import ItemTitle from './ItemTitle';

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
