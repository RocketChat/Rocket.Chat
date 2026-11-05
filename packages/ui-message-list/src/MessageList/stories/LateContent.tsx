import { Box } from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';

/** Content whose height is only known after a delay, standing in for an image that loads late. */
export type LateContentProps = { height: number; delay: number };

const LateContent = ({ height, delay }: LateContentProps) => {
	const [resolvedHeight, setResolvedHeight] = useState(0);

	useEffect(() => {
		const timeout = setTimeout(() => setResolvedHeight(height), delay);
		return () => clearTimeout(timeout);
	}, [height, delay]);

	return <Box data-late-content height={resolvedHeight} width='full' maxWidth={320} backgroundColor='surface-tint' borderRadius='small' />;
};

export default LateContent;
