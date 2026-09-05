declare module 'meteor/reload' {
	export const Reload: {
		_onMigrate: (name: string, func: () => [boolean, any]) => void;
		_migrationData: (name: string) => any;
		_migrate: (migrationData: any, options?: { immediateMigration?: boolean }) => void;
	};
}
