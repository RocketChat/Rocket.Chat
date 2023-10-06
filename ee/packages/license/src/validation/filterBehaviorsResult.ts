import type { BehaviorWithContext, LicenseBehavior } from '../definition/LicenseBehavior';

export const filterBehaviorsResult = (result: BehaviorWithContext[], expectedBehaviors: LicenseBehavior[]) =>
	result.filter(({ behavior }) => expectedBehaviors.includes(behavior));
