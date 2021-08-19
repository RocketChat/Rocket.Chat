import React, { ReactElement } from 'react';

import MemberCapUsage from './MemberCapUsage';

export default {
	title: 'admin/users/MemberCapUsage',
	component: MemberCapUsage,
};

export const _default = (): ReactElement => <MemberCapUsage members={150} limit={300} />;
export const CloseToLimit = (): ReactElement => <MemberCapUsage members={270} limit={300} />;
export const ReachedLimit = (): ReactElement => <MemberCapUsage members={300} limit={300} />;
