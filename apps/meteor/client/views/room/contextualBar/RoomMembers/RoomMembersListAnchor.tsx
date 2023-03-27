import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { useEffect, useRef } from 'react';

type RoomMembersListAnchorProps = {
	loadMoreMembers: () => void;
} & ComponentProps<typeof Box>;

const RoomMembersListAnchor = ({ loadMoreMembers, ...props }: RoomMembersListAnchorProps) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const target = ref.current;

		if (!target) {
			return;
		}

		const observer = new IntersectionObserver(
			(e) => {
				if (e[0].isIntersecting) {
					loadMoreMembers();
				}
			},
			{
				root: null,
				threshold: 0.1,
			},
		);

		observer.observe(target);

		return () => observer.disconnect();
	}, [loadMoreMembers]);

	return <Box width={10} height={10} backgroundColor='red' ref={ref} {...props} />;
};

export default RoomMembersListAnchor;
