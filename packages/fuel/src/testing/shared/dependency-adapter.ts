import { UnitReference } from '@suites/unit';

export class SolitaryUnitTestDependencyAdapter {

	constructor(private unitRef: UnitReference) {
	}

	public get<T>(dependencyName: string): jest.Mocked<T> {
		return this.unitRef.get(dependencyName) as jest.Mocked<T>;
	}
}