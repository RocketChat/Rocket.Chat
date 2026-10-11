import SeatsCapUsage from './SeatsCapUsage';

export default {
	component: SeatsCapUsage,
};

export const Example = () => <SeatsCapUsage members={150} limit={300} />;
export const CloseToLimit = () => <SeatsCapUsage members={270} limit={300} />;
export const ReachedLimit = () => <SeatsCapUsage members={300} limit={300} />;
