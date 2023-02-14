import type { ReactElement } from 'react';
import React from 'react';

import SeatsCapUsage from './SeatsCapUsage';

export default {
	title: 'Enterprise/Admin/Users/SeatsCapUsage',
	component: SeatsCapUsage,
};

export const Example = (): ReactElement => <SeatsCapUsage members={150} limit={300} />;
export const CloseToLimit = (): ReactElement => <SeatsCapUsage members={270} limit={300} />;
export const ReachedLimit = (): ReactElement => <SeatsCapUsage members={300} limit={300} />;
