/**
 * Port of meteor/facts-base: in-memory counters keyed by package/fact,
 * readable for metrics collection.
 */
const factsByPackage = new Map<string, Map<string, number>>();

export const Facts = {
	incrementServerFact(pkg: string, fact: string, increment = 1): void {
		let facts = factsByPackage.get(pkg);
		if (!facts) {
			facts = new Map();
			factsByPackage.set(pkg, facts);
		}
		facts.set(fact, (facts.get(fact) ?? 0) + increment);
	},

	_factsByPackage(): Record<string, Record<string, number>> {
		return Object.fromEntries([...factsByPackage.entries()].map(([pkg, facts]) => [pkg, Object.fromEntries(facts)]));
	},
};
