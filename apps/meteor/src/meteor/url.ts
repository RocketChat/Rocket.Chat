import { Package } from './package-registry.ts';

const { URL } = globalThis;

export { URL };

Package.url = {
	URL,
};
