declare module 'meteor/reload' {
	export const Reload: {
		_onMigrate: (name: string, func: () => [boolean, any]) => void;
		_migrate: (migrationData: any, options?: { immediateMigration?: boolean }) => void;
	};
}
