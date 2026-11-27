import { Box, FieldError } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import RetryButton from '../components/OutboundMessageWizard/components/RetryButton';

export type FieldErrorWithRetryProps = {
	id: string;
	children: ReactNode;
	canRetry?: boolean;
	retrying: boolean;
	onRetry(): void;
};

/**
 * A field's error message, followed by a button that retries the request that failed.
 */
const FieldErrorWithRetry = ({ id, children, canRetry, retrying, onRetry }: FieldErrorWithRetryProps) => (
	<FieldError aria-live='assertive' id={id}>
		<Box display='flex' alignItems='center' gap='x4'>
			{children}
			{canRetry && <RetryButton loading={retrying} onClick={onRetry} />}
		</Box>
	</FieldError>
);

export default FieldErrorWithRetry;
