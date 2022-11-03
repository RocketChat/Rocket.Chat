declare module 'meteor/konecty:multiple-instances-status' {
	namespace InstanceStatus {
		function id(): string;

		function registerInstance(name: string, instance: Record<string, unknown>): void;
	}
}
