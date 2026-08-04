import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { useEffect, useRef } from 'react';

export type InfiniteListAnchorProps = {
	loadMore: () => void;
} & BoxProps;

const InfiniteListAnchor = ({ loadMore, ...props }: InfiniteListAnchorProps) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const target = ref.current;

		if (!target) {
			return;
		}

		const observer = new IntersectionObserver(
			(e) => {
				if (e[0].isIntersecting) {
					loadMore();
				}
			},
			{
				root: null,
				threshold: 0.1,
			},
		);

		observer.observe(target);

		return () => observer.disconnect();
	}, [loadMore]);

	return <Box width={5} height={5} ref={ref} {...props} />;
};

export default InfiniteListAnchor;
