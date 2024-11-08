import type { Faker } from '@faker-js/faker';
import { faker } from '@faker-js/faker';
import _ from 'lodash';

export abstract class BaseDataBuilder<T> {
	protected abstract entity: T;

	protected faker: Faker;

	protected constructor() {
		this.faker = faker;
	}

	public build(): T {
		return this.entity;
	}

	public copy(): this {
		return _.cloneDeep(this);
	}
}
