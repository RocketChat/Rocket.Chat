const locks = new Map<string, Promise<any>>();

export interface LockOptions {
	timeout?: number;
	keyPath?: string;
}

export function Lock(options?: LockOptions) {
	return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			// Generate lock key based on options or default
			let lockKey = `${target.constructor.name}:${propertyKey}`;
			
			if (options?.keyPath && args[0]) {
				// Extract nested property value for lock key
				const keyParts = options.keyPath.split('.');
				let value = args[0];
				for (const part of keyParts) {
					value = value?.[part];
				}
				if (value) {
					lockKey += `:${value}`;
				}
			}
			
			// Wait for any existing lock to be released
			const existingLock = locks.get(lockKey);
			if (existingLock) {
				// If timeout is specified, race against timeout
				if (options?.timeout) {
					const timeoutPromise = new Promise((_, reject) => {
						setTimeout(() => reject(new Error(`Lock timeout after ${options.timeout}ms`)), options.timeout);
					});
					try {
						await Promise.race([existingLock, timeoutPromise]);
					} catch (error) {
						// Lock timed out, continue anyway
						console.warn(`Lock timeout for ${lockKey}:`, error);
					}
				} else {
					await existingLock;
				}
			}

			// Create a new lock
			let releaseLock: () => void;
			const lockPromise = new Promise<void>((resolve) => {
				releaseLock = resolve;
			});
			
			locks.set(lockKey, lockPromise);

			try {
				// Execute the original method
				const result = await originalMethod.apply(this, args);
				return result;
			} finally {
				// Release the lock
				locks.delete(lockKey);
				releaseLock!();
			}
		};

		return descriptor;
	};
}