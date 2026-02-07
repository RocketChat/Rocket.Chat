import { hasOwn } from './utils/hasOwn';

interface IPackageRegistry {
	_define(name: string, pkg: any, ...args: any[]): any;
	[name: string]: any;
}

class PackageRegistry implements IPackageRegistry {
	_promiseInfoMap: Record<string, { promise: Promise<any>; resolve: (pkg: any) => void }>;

	constructor() {
		this._promiseInfoMap = Object.create(null);
	}

	_define(name: string, pkg: any, ...args: any[]): any {
		pkg = pkg || {};

		const argc = args.length;
		for (let i = 0; i < argc; ++i) {
			const arg = args[i];
			for (const s in arg) {
				if (!(s in pkg)) {
					pkg[s] = arg[s];
				}
			}
		}

		this.set(name, pkg);

		const info = this._promiseInfoMap[name];
		if (info) {
			info.resolve(pkg);
		}

		return pkg;
	}

	_has(name: string): boolean {
		return hasOwn(this, name);
	}

	get(name: string) {
		const pkg = Reflect.get(this, name);
		if (!pkg) {
			throw new Error(`Package ${name} not installed`);
		}
		return pkg;
	}

	set(name: string, value: any) {
		Object.defineProperty(this, name, {
			value,
			writable: false,
			configurable: false,
			enumerable: true,
		});
	}

	_promise(name: string): Promise<any> {
		const info = this._promiseInfoMap[name];
		if (!info) {
			let resolve: (pkg: any) => void = () => {
				// do nothing
			};
			const promise = new Promise((res, rej) => {
				resolve = res;
				if (this._has(name)) {
					res(this.get(name));
				} else if (!this._has(name)) {
					rej(new Error(`Package ${name} not installed`));
				}
			});
			this._promiseInfoMap[name] = { promise, resolve };
			return promise;
		}

		return info.promise;
	}
}

const get: ProxyHandler<IPackageRegistry>['get'] = (target, prop, receiver) => {
	if (typeof prop === 'string' && target._has(prop)) {
		return target.get(prop);
	}
	return Reflect.get(target, prop, receiver);
};

const set: ProxyHandler<IPackageRegistry>['set'] = (target, prop, value, receiver) => {
	if (typeof prop === 'string') {
		target.set(prop, value);
		return true;
	}
	return Reflect.set(target, prop, value, receiver);
};

export const Package: IPackageRegistry = new Proxy(new PackageRegistry(), {
	get,
	set,
});

Object.defineProperty(globalThis, 'Package', {
	value: Package,
	writable: false,
	configurable: false,
	enumerable: true,
});
