import type { ReactNode } from 'react';

import type { ActionContract } from '../../../types/Attributes.contract';

/** The row of metrics under a message, and each part of it that only holds content. */
export type MessageMetricsPartContract = ActionContract & {
	children?: ReactNode;
};
