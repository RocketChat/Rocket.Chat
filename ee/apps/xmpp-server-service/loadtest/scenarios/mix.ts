import type { Scenario } from './types';

/** Spreads sends across scenarios in proportion to their weights. */
export function mixScenario(weighted: { scenario: Scenario; weight: number }[]): Scenario {
	const totalWeight = weighted.reduce((sum, { weight }) => sum + weight, 0);
	const pick = (): Scenario => {
		let threshold = Math.random() * totalWeight;
		for (const { scenario, weight } of weighted) {
			threshold -= weight;
			if (threshold < 0) {
				return scenario;
			}
		}
		return weighted[weighted.length - 1].scenario;
	};
	const scenarios = weighted.map(({ scenario }) => scenario);

	return {
		name: `mix(${weighted.map(({ scenario, weight }) => `${scenario.name}=${weight}`).join(',')})`,
		eventKeys: [...new Set(scenarios.flatMap(({ eventKeys }) => eventKeys))],
		get persistedSends() {
			return scenarios.reduce((sum, { persistedSends }) => sum + persistedSends, 0);
		},
		async warmup() {
			for (const scenario of scenarios) {
				await scenario.warmup();
			}
		},
		send: () => pick().send(),
		takeStepExtras() {
			const extras: Record<string, number | undefined> = {};
			for (const scenario of scenarios) {
				Object.assign(extras, scenario.takeStepExtras?.());
			}
			return extras;
		},
		async teardown() {
			for (const scenario of scenarios) {
				await scenario.teardown?.();
			}
		},
	};
}
