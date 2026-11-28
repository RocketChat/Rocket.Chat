import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';

import CallMessagePreview from './CallMessagePreview.js';
import type { CallMessagePreviewProps } from './CallMessagePreview.js';
import CallMessagePreviewCompact from './CallMessagePreviewCompact.js';
import { MESSAGE_PREVIEW_VISIBLE_MS } from '../../lib/constants.js';

export type CallMessagePreviewTimedProps = CallMessagePreviewProps & {
	compact: boolean;
	/** While true the preview stays; letting go gives it its whole time again. */
	held: boolean;
	onExpire: () => void;
};

/** A chat message previewed over the call for a while. */
const CallMessagePreviewTimed = ({ compact, held, onExpire, ...props }: CallMessagePreviewTimedProps) => {
	const expire = useStableCallback(onExpire);

	useEffect(() => {
		if (held) {
			return;
		}

		const timer = setTimeout(expire, MESSAGE_PREVIEW_VISIBLE_MS);
		return () => clearTimeout(timer);
	}, [held, expire]);

	return compact ? <CallMessagePreviewCompact {...props} /> : <CallMessagePreview {...props} />;
};

export default CallMessagePreviewTimed;
