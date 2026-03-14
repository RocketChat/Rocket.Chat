import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IExternalComponent } from '../../../../src/definition/externalComponent/IExternalComponent';
import { ExternalComponentLocation } from '../../../../src/definition/externalComponent/IExternalComponent';
import { AppExternalComponentManager } from '../../../../src/server/managers';

describe('AppExternalComponentManager', () => {
	const mockExternalComponent1: IExternalComponent = {
		appId: '1eb382c0-3679-44a6-8af0-18802e342fb1',
		name: 'TestExternalComponent1',
		description: 'TestExternalComponent1',
		url: '',
		icon: '',
		location: ExternalComponentLocation.CONTEXTUAL_BAR,
	};

	const mockExternalComponent2: IExternalComponent = {
		appId: '125a944b-9747-4e6e-b029-6e9b26bb3481',
		name: 'TestExternalComponent2',
		description: 'TestExternalComponent2',
		url: '',
		icon: '',
		location: ExternalComponentLocation.CONTEXTUAL_BAR,
	};

	const mockExternalComponent3: IExternalComponent = {
		...mockExternalComponent2,
		appId: mockExternalComponent1.appId,
		name: mockExternalComponent2.name,
		description: 'TestExternalComponent3',
	};

	function register(aecm: AppExternalComponentManager, externalComponent: IExternalComponent): void {
		const { appId } = externalComponent;
		aecm.addExternalComponent(appId, externalComponent);
		aecm.registerExternalComponents(appId);
	}

	it('basicAppExternalComponentManager', () => {
		const aecm = new AppExternalComponentManager();

		assert.strictEqual((aecm as any).registeredExternalComponents.size, 0);
		assert.strictEqual((aecm as any).appTouchedExternalComponents.size, 0);
	});

	it('verifyGetRegisteredExternalComponents', () => {
		const aecm = new AppExternalComponentManager();
		const component = mockExternalComponent1;

		assert.strictEqual(aecm.getRegisteredExternalComponents().size, 0);

		register(aecm, component);
		assert.strictEqual(aecm.getRegisteredExternalComponents().size, 1);
	});

	it('verifyGetAppTouchedExternalComponents', () => {
		const aecm = new AppExternalComponentManager();
		const component = mockExternalComponent1;

		assert.strictEqual(aecm.getAppTouchedExternalComponents().size, 0);

		aecm.addExternalComponent(component.appId, component);
		assert.strictEqual(aecm.getAppTouchedExternalComponents().size, 1);
	});

	it('verifyGetExternalComponents', () => {
		const aecm = new AppExternalComponentManager();
		const component = mockExternalComponent1;

		assert.strictEqual(aecm.getExternalComponents(component.appId), null);
		aecm.addExternalComponent(component.appId, component);
		assert.strictEqual(aecm.getExternalComponents(component.appId).size, 1);
	});

	it('verifyGetProvidedComponents', () => {
		const aecm = new AppExternalComponentManager();
		const component1 = mockExternalComponent1;
		const component2 = mockExternalComponent2;

		assert.strictEqual(Array.isArray(aecm.getProvidedComponents()), true);
		register(aecm, component1);
		register(aecm, component2);
		assert.strictEqual(aecm.getProvidedComponents().length, 2);
	});

	it('verifyAddExternalComponent', () => {
		const aecm1 = new AppExternalComponentManager();
		const component1 = mockExternalComponent1;
		const component3 = mockExternalComponent3;

		aecm1.addExternalComponent(component1.appId, component1);
		assert.strictEqual(aecm1.getAppTouchedExternalComponents().size, 1);
		assert.strictEqual(aecm1.getExternalComponents(component1.appId).size, 1);

		aecm1.addExternalComponent(component1.appId, component3);
		assert.strictEqual(aecm1.getExternalComponents(component1.appId).size, 2);
	});

	it('verifyRegisterExternalComponents', () => {
		const aecm = new AppExternalComponentManager();
		const component = mockExternalComponent1;

		assert.strictEqual(aecm.getRegisteredExternalComponents().size, 0);
		register(aecm, component);
		assert.strictEqual(aecm.getRegisteredExternalComponents().size, 1);
	});

	it('verifyUnregisterExternalComponents', () => {
		const aecm = new AppExternalComponentManager();
		const component = mockExternalComponent1;

		register(aecm, component);
		assert.strictEqual(aecm.getAppTouchedExternalComponents().size, 1);
		assert.strictEqual(aecm.getRegisteredExternalComponents().size, 1);

		aecm.unregisterExternalComponents(component.appId);
		assert.strictEqual(aecm.getAppTouchedExternalComponents().size, 1);
		assert.strictEqual(aecm.getRegisteredExternalComponents().size, 0);
	});

	it('verifyPurgeExternalComponents', () => {
		const aecm = new AppExternalComponentManager();
		const component = mockExternalComponent1;

		register(aecm, component);
		assert.strictEqual(aecm.getAppTouchedExternalComponents().size, 1);
		assert.strictEqual(aecm.getRegisteredExternalComponents().size, 1);

		aecm.purgeExternalComponents(component.appId);
		assert.strictEqual(aecm.getAppTouchedExternalComponents().size, 0);
		assert.strictEqual(aecm.getRegisteredExternalComponents().size, 0);
	});
});
