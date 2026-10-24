/** Every service but `settings` itself depends on these. */
const DEFAULT_DEPENDENCIES = ['settings', 'license'];

export function withDefaultDependencies(name: string, serviceDependencies: string[]): string[] {
	return [...serviceDependencies, ...(name === 'settings' ? [] : DEFAULT_DEPENDENCIES)].filter((dependency) => dependency !== name);
}
