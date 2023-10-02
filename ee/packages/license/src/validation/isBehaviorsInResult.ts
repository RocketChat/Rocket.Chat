import type { BehaviorWithContext, LicenseBehavior } from '../definition/LicenseBehavior';

export const isBehaviorsInResult = (result: BehaviorWithContext[], expectedBehaviors: LicenseBehavior[]) =>
	result.some(({ behavior }) => expectedBehaviors.includes(behavior));
