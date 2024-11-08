import { TestBed } from '@suites/unit';
import { SolitaryUnitTestDependencyAdapter } from '../shared/dependency-adapter';

export class SolitaryUnitTestFactory {

	public static async create<T>(target: new (...args: any[]) => T): Promise<{ instance: T, dependenciesAdapter: SolitaryUnitTestDependencyAdapter }> {
		const { unit: instance, unitRef } = await TestBed.solitary(target).compile();

		return {
			instance,
			dependenciesAdapter: new SolitaryUnitTestDependencyAdapter(unitRef),
		};
	}

}
