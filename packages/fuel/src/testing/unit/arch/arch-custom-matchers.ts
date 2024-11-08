// @ts-nocheck
import 'tsarch/dist/jest';
import { filesOfProject } from 'tsarch';
import { files } from 'ts-arch-unit';

const KEBAB_CASE_REGEX = /^([a-z](?![\d])|[\d](?![a-z]))+(-?([a-z](?![\d])|[\d](?![a-z])))*(.spec|.definition|.module)?.ts$|^$/;
const MAIN_FOLDERS = ['domain', 'infrastructure', 'api', 'services'];

const ensureTSConfigPath = (path?: string): { message: () => string, pass: boolean } | undefined => {
	if (!path) {
		return { pass: false, message: () => 'You must provide the tsConfig path' };
	}
}

export function extendJestWithArchMatchers(): void {
	expect.extend({
		async toHaveSharedLayerComplianceAsync({ tsConfigRootPath }: { tsConfigRootPath: string }): Promise<{ pass: boolean; message?: () => string }> {
			ensureTSConfigPath(tsConfigRootPath);
			try {
				for await (const folder of MAIN_FOLDERS) {
					const rule = filesOfProject(tsConfigRootPath).inFolder('*/shared/*').shouldNot().dependOnFiles().inFolder(`*/${folder}/*`);

					await expect(rule).toPassAsync();
				}
				return { pass: true }
			} catch (e) {
				return { pass: false, message: (): string => `"shared" folder must not depend on anything from ${MAIN_FOLDERS.join(', ')} ${e}` }
			}
		},
		async toHaveDomainLayerComplianceAsync({ tsConfigRootPath }: { tsConfigRootPath: string }): Promise<{ pass: boolean; message?: () => string }> {
			ensureTSConfigPath(tsConfigRootPath);
			try {
				for await (const folder of MAIN_FOLDERS.filter((f) => f !== 'domain')) {
					const rule = filesOfProject(tsConfigRootPath).inFolder('*/domain/*').shouldNot().dependOnFiles().inFolder(`*/${folder}/*`);

					await expect(rule).toPassAsync();
				}
				return { pass: true }
			} catch (e) {
				return { pass: false, message: (): string => `"domain" folder must not depend on anything from ${MAIN_FOLDERS.filter((f) => f !== 'domain').join(', ')} ${e}` }
			}
		},
		async toHaveServicesLayerComplianceAsync({ tsConfigRootPath }: { tsConfigRootPath: string }): Promise<{ pass: boolean; message?: () => string }> {
			ensureTSConfigPath(tsConfigRootPath);
			try {
				const rule = filesOfProject(tsConfigRootPath).inFolder('*/services/*').shouldNot().dependOnFiles().inFolder(`*/api/*`);

				await expect(rule).toPassAsync();
				return { pass: true }
			} catch (e) {
				return { pass: false, message: (): string => `"services" folder must not depend on anything from the "api" layer ${e}` }
			}
		},
		async toHaveInfrastructureLayerComplianceAsync({ tsConfigRootPath }: { tsConfigRootPath: string }): Promise<{ pass: boolean; message?: () => string }> {
			ensureTSConfigPath(tsConfigRootPath);
			try {
				for await (const folder of MAIN_FOLDERS.filter((f) => f === 'api')) {
					const rule = filesOfProject(tsConfigRootPath).inFolder('*/infrastructure/*').shouldNot().dependOnFiles().inFolder(`*/${folder}/*`);

					await expect(rule).toPassAsync();
				}
				return { pass: true }
			} catch (e) {
				return { pass: false, message: (): string => `"infrastructure" folder must not depend on anything from ${MAIN_FOLDERS.filter((f) => f === 'api' || f === 'services').join(', ')} ${e}` }
			}
		},
		async toNotHaveAnyCyclesComplianceAsync({ tsConfigRootPath }: { tsConfigRootPath: string }): Promise<{ pass: boolean; message?: () => string }> {
			ensureTSConfigPath(tsConfigRootPath);
			try {
				const rule = filesOfProject(tsConfigRootPath).inFolder('src/*').should().beFreeOfCycles();

				await expect(rule).toPassAsync();
				return { pass: true }
			} catch (e) {
				return { pass: false, message: (): string => `Server code must not have any cycle ${e}` }
			}
		},
		async toHaveFilenamesComplianceAsync({ tsConfigRootPath }: { tsConfigRootPath: string }): Promise<{ pass: boolean; message?: () => string }> {
			ensureTSConfigPath(tsConfigRootPath);
			try {
				files().should().haveMatchingName(KEBAB_CASE_REGEX);
				return { pass: true }
			} catch (e) {
				return { pass: false, message: (): string => `Server filenames must follow the kebab-case ${e}` }
			}
		},
		/*
		TODO: ensure modules depend between them through infrastructure/external-modules-integration ONLY
		TODO: ensure file that export module classes are suffixed with *.module.ts
		*/
	} as any);
}
