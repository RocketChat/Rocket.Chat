import React, { ReactElement } from 'react';

import SeatsCapUsage from './SeatsCapUsage';

export default {
	title: 'admin/users/SeatsCapUsage',
	component: SeatsCapUsage,
};

export const _default = (): ReactElement => <SeatsCapUsage members={150} limit={300} />;
export const CloseToLimit = (): ReactElement => <SeatsCapUsage members={270} limit={300} />;
export const ReachedLimit = (): ReactElement => <SeatsCapUsage members={300} limit={300} />;
