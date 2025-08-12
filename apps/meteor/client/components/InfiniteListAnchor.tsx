import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';

type InfiniteListAnchorProps = {
	loadMore: () => void;
} & ComponentProps<typeof Box>;

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
