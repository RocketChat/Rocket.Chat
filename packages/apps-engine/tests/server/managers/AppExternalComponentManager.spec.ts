import { Expect, SetupFixture, Test } from 'alsatian';

import type { IExternalComponent } from '../../../src/definition/externalComponent/IExternalComponent';
import { ExternalComponentLocation } from '../../../src/definition/externalComponent/IExternalComponent';
import { AppExternalComponentManager } from '../../../src/server/managers';

export class AppExternalComponentManagerTestFixture {
    private mockExternalComponent1: IExternalComponent;

    private mockExternalComponent2: IExternalComponent;

    private mockExternalComponent3: IExternalComponent;

    private mockAppExternalComponentManager: AppExternalComponentManager;

    public register(aecm: AppExternalComponentManager, externalComponent: IExternalComponent): void {
        const { appId } = externalComponent;

        aecm.addExternalComponent(appId, externalComponent);
        aecm.registerExternalComponents(appId);
    }

    @SetupFixture
    public setupFixture() {
        this.mockExternalComponent1 = {
            appId: '1eb382c0-3679-44a6-8af0-18802e342fb1',
            name: 'TestExternalComponent1',
            description: 'TestExternalComponent1',
            url: '',
            icon: '',
            location: ExternalComponentLocation.CONTEXTUAL_BAR,
        } as IExternalComponent;
        this.mockExternalComponent2 = {
            appId: '125a944b-9747-4e6e-b029-6e9b26bb3481',
            name: 'TestExternalComponent2',
            description: 'TestExternalComponent2',
            url: '',
            icon: '',
            location: ExternalComponentLocation.CONTEXTUAL_BAR,
        } as IExternalComponent;
        this.mockExternalComponent3 = {
            ...this.mockExternalComponent2,
            appId: this.mockExternalComponent1.appId,
            name: this.mockExternalComponent2.name,
            description: 'TestExternalComponent3',
        } as IExternalComponent;
        this.mockAppExternalComponentManager = new AppExternalComponentManager();
        this.mockAppExternalComponentManager.addExternalComponent(this.mockExternalComponent1.appId, this.mockExternalComponent1);
    }

    @Test()
    public basicAppExternalComponentManager() {
        const aecm = new AppExternalComponentManager();

        Expect((aecm as any).registeredExternalComponents.size).toBe(0);
        Expect((aecm as any).appTouchedExternalComponents.size).toBe(0);
    }

    @Test()
    public verifyGetRegisteredExternalComponents() {
        const aecm = new AppExternalComponentManager();
        const component = this.mockExternalComponent1;

        Expect(aecm.getRegisteredExternalComponents().size).toBe(0);

        this.register(aecm, component);
        Expect(aecm.getRegisteredExternalComponents().size).toBe(1);
    }

    @Test()
    public verifyGetAppTouchedExternalComponents() {
        const aecm = new AppExternalComponentManager();
        const component = this.mockExternalComponent1;

        Expect(aecm.getAppTouchedExternalComponents().size).toBe(0);

        aecm.addExternalComponent(component.appId, component);
        Expect(aecm.getAppTouchedExternalComponents().size).toBe(1);
    }

    @Test()
    public verifyGetExternalComponents() {
        const aecm = new AppExternalComponentManager();
        const component = this.mockExternalComponent1;

        Expect(aecm.getExternalComponents(component.appId)).toBe(null);
        aecm.addExternalComponent(component.appId, component);
        Expect(aecm.getExternalComponents(component.appId).size).toBe(1);
    }

    @Test()
    public verifyGetProvidedComponents() {
        const aecm = new AppExternalComponentManager();
        const component1 = this.mockExternalComponent1;
        const component2 = this.mockExternalComponent2;

        Expect(Array.isArray(aecm.getProvidedComponents())).toBe(true);
        this.register(aecm, component1);
        this.register(aecm, component2);
        Expect(aecm.getProvidedComponents().length).toBe(2);
    }

    @Test()
    public verifyAddExternalComponent() {
        const aecm1 = new AppExternalComponentManager();
        const component1 = this.mockExternalComponent1;
        const component3 = this.mockExternalComponent3;

        aecm1.addExternalComponent(component1.appId, component1);
        Expect(aecm1.getAppTouchedExternalComponents().size).toBe(1);
        Expect(aecm1.getExternalComponents(component1.appId).size).toBe(1);

        aecm1.addExternalComponent(component1.appId, component3);
        Expect(aecm1.getExternalComponents(component1.appId).size).toBe(2);
    }

    @Test()
    public verifyRegisterExternalComponents() {
        const aecm = new AppExternalComponentManager();
        const component = this.mockExternalComponent1;

        Expect(aecm.getRegisteredExternalComponents().size).toBe(0);
        this.register(aecm, component);
        Expect(aecm.getRegisteredExternalComponents().size).toBe(1);
    }

    @Test()
    public verifyUnregisterExternalComponents() {
        const aecm = new AppExternalComponentManager();
        const component = this.mockExternalComponent1;

        this.register(aecm, component);
        Expect(aecm.getAppTouchedExternalComponents().size).toBe(1);
        Expect(aecm.getRegisteredExternalComponents().size).toBe(1);

        aecm.unregisterExternalComponents(component.appId);
        Expect(aecm.getAppTouchedExternalComponents().size).toBe(1);
        Expect(aecm.getRegisteredExternalComponents().size).toBe(0);
    }

    @Test()
    public verifyPurgeExternalComponents() {
        const aecm = new AppExternalComponentManager();
        const component = this.mockExternalComponent1;

        this.register(aecm, component);
        Expect(aecm.getAppTouchedExternalComponents().size).toBe(1);
        Expect(aecm.getRegisteredExternalComponents().size).toBe(1);

        aecm.purgeExternalComponents(component.appId);
        Expect(aecm.getAppTouchedExternalComponents().size).toBe(0);
        Expect(aecm.getRegisteredExternalComponents().size).toBe(0);
    }
}
