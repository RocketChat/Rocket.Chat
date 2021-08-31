export declare const Migrations: {
	add(migration: {
		version: number;
		name?: string;
		up: () => void;
		down?: () => void;
	}): void;
};
