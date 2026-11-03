import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';

import CallMessagePreview, { type CallMessagePreviewProps } from './CallMessagePreview';
import { MESSAGE_PREVIEW_VISIBLE_MS } from '../../lib/constants';

export type TimedCallMessagePreviewProps = Omit<CallMessagePreviewProps, 'onPointerEnter' | 'onPointerLeave' | 'onFocus' | 'onBlur'>;

const TimedCallMessagePreview = ({ onDismiss, ...props }: TimedCallMessagePreviewProps) => {
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);
	const expire = useStableCallback(onDismiss);

	useEffect(() => {
		if (hovered || focused) {
			return;
		}

		const timer = setTimeout(expire, MESSAGE_PREVIEW_VISIBLE_MS);

		return () => clearTimeout(timer);
	}, [hovered, focused, expire]);

	return (
		<CallMessagePreview
			{...props}
			onDismiss={onDismiss}
			onPointerEnter={() => setHovered(true)}
			onPointerLeave={() => setHovered(false)}
			onFocus={() => setFocused(true)}
			onBlur={(event) => setFocused(event.currentTarget.contains(event.relatedTarget))}
		/>
	);
};

export default TimedCallMessagePreview;
