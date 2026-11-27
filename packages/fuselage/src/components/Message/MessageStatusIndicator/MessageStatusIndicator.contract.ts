import type { ReactNode } from 'react';

import type { ActionContract } from '../../../types/Attributes.contract';

export type MessageStatusIndicatorContract = ActionContract & {
	/** The status items. With none, the indicator renders nothing. */
	children?: ReactNode;
};

export type MessageStatusPrivateIndicatorContract = ActionContract & {
	children?: ReactNode;
};
