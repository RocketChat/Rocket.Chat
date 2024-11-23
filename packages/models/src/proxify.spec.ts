import { proxify, registerModel } from './proxify';

type MockedModel = {
	method: () => MockedModel;
};

describe('non lazy proxify', () => {
	it('should keep this inside functions', () => {
		const collectionMocked = proxify('collection') as MockedModel;
		const collection = {
			method() {
				return this;
			},
		};
		registerModel<any>('collection', collection);

		expect(collectionMocked.method()).toBe(collection);
	});
	it('should throw an error if the model is not found', () => {
		const collectionMocked = proxify('collection-not-found') as MockedModel;
		expect(() => collectionMocked.method()).toThrowError('Model collection-not-found not found');
	});

	it('should return a proxified property', () => {
		const collectionMocked = proxify('collection-prop') as {
			prop: string;
		};
		const collection = {
			prop: 'value',
		};
		registerModel<any>('collection-prop', collection);
		expect(collectionMocked.prop).toBe('value');
	});

	it('should throw an error if trying to set a property from the proxified object', () => {
		const collectionMocked = proxify('collection-prop') as {
			prop: string;
		};
		const collection = {
			prop: 'value',
		};
		registerModel<any>('collection-prop', collection);
		expect(() => {
			collectionMocked.prop = 'new value';
		}).toThrowError('Models accessed via proxify are read-only, use the model instance directly to modify it.');
	});
});

describe('lazy proxify', () => {
	it('should keep this inside functions', () => {
		const collectionMocked = proxify('collection-lazy') as MockedModel;
		const collection = {
			method() {
				return this;
			},
		};

		registerModel<any>('collection-lazy', () => collection);

		expect(collectionMocked.method()).toBe(collection);
	});

	it('should throw an error if the model is not found', () => {
		const collectionMocked = proxify('collection-not-found') as MockedModel;
		expect(() => collectionMocked.method()).toThrowError('Model collection-not-found not found');
	});

	it('should return a proxified property', () => {
		const collectionMocked = proxify('collection-prop') as {
			prop: string;
		};
		const collection = {
			prop: 'value',
		};
		registerModel<any>('collection-prop', () => collection);
		expect(collectionMocked.prop).toBe('value');
	});

	it('should throw an error if trying to set a property from the proxified object', () => {
		const collectionMocked = proxify('collection-prop') as {
			prop: string;
		};
		const collection = {
			prop: 'value',
		};
		registerModel<any>('collection-prop', () => collection);
		expect(() => {
			collectionMocked.prop = 'new value';
		}).toThrowError('Models accessed via proxify are read-only, use the model instance directly to modify it.');
	});
});
