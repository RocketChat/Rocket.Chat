import { Box, Tile, Scrollable } from '@rocket.chat/fuselage';
import React, { useMemo, forwardRef, useCallback } from 'react';

import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import Tag from '../../views/InfoPanel/Tag';
import TagGroup from '../../views/InfoPanel/TagGroup';

const TagsTile = forwardRef(function TagsTile({ tags, onChange, onSelect, ...props }, ref) {
	const discoveryRoute = useRoute('discovery');
	const tab = useRouteParameter('tab');

	const onClickTag = useCallback(
		(tag) => {
			if (tab === 'all') {
				onSelect(true);
				onChange([tag]);
			} else discoveryRoute.push({ tab: 'all', tag });
		},
		[discoveryRoute, onChange, onSelect, tab],
	);

	const tagsGroup = useMemo(
		() =>
			tags.map((tag) => (
				<Tag
					key={tag}
					tag={tag}
					onMouseDown={() => {
						onClickTag(tag);
					}}
				/>
			)),
		[onClickTag, tags],
	);

	return (
		<Box rcx-tags {...props}>
			<Tile padding={'x4'} elevation='2'>
				<Scrollable vertical smooth>
					<Tile
						ref={ref}
						elevation='0'
						padding='none'
						maxWidth='300px'
						maxHeight='200px'
						role='tagbox'
						onMouseDown={(e) => e.preventDefault()}
						onClick={(e) => e.preventDefault()}
					>
						<TagGroup>{tagsGroup}</TagGroup>
					</Tile>
				</Scrollable>
			</Tile>
		</Box>
	);
});

export default TagsTile;
