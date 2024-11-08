import { TestBed, UnitReference } from '@suites/unit';
import { getMetadataArgsStorage } from 'routing-controllers';
import { ExternalHttpController, createExpressServer, IocAdapter, useContainer } from '../../externals';
import { Container } from '../../internals';
import { SolitaryUnitTestDependencyAdapter } from '../shared/dependency-adapter';
import express from 'express';

const resetGlobalMiddlewares = (): void => { getMetadataArgsStorage().middlewares = [] };
const registerClassDependenciesOnContainer = (container: Container, unitRef: UnitReference): void => {
	(unitRef as any).mocksContainer.identifierToDependency.forEach((dep: any) => {
		const dependency = dep[0];
		if (!dependency) {
			throw new Error('Could not mock the dependencies');
		}
		container.bind(dependency.identifier).toConstantValue(unitRef.get(dependency.identifier as string));
	});
}
export class ExternalHttpUnitTestFactory {

	public static async create<T extends ExternalHttpController>(target: new (...args: any[]) => T, { validateInput, transformInput }: { validateInput: boolean; transformInput: boolean }): Promise<{ app: express.Express, instance: T, dependenciesAdapter: SolitaryUnitTestDependencyAdapter }> {
		const { unit: instance, unitRef } = await TestBed.solitary(target).compile();

		const container = new Container({ skipBaseClassChecks: true });

		resetGlobalMiddlewares();
		registerClassDependenciesOnContainer(container, unitRef);

		useContainer(new class implements IocAdapter {
			get<T>(someClass: any): T {
				return container.resolve<T>(someClass);
			}
		});
		
		return {
			app: createExpressServer({
				controllers: [target],
				middlewares: [],
				classTransformer: transformInput,
				validation: validateInput,
			}),
			instance,
			dependenciesAdapter: new SolitaryUnitTestDependencyAdapter(unitRef),
		}
	}

}