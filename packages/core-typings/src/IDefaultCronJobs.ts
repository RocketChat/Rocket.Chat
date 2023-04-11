export interface IDefaultCronJobs {
	add<T extends Record<string, any>>(
		name: string,
		schedule: string,
		callback: (data: T) => void | Promise<void>,
		params?: T,
	): Promise<void>;
	remove(name: string): Promise<void>;
	has(name: string): Promise<boolean>;
}
