import type { ContainerContract } from '../../types/Container.contract';

export type NavBarContract = ContainerContract & {
	/** Narrows the inline padding, for a bar that sits in a narrow column. */
	compact?: boolean;
};

export type NavBarSectionContract = ContainerContract;
