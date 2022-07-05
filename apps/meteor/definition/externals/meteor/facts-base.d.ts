declare module 'meteor/facts-base' {
	namespace Facts {
		function incrementServerFact(pkg: 'pkg' | 'fact', fact: string | number, increment: number): void;
	}
}
