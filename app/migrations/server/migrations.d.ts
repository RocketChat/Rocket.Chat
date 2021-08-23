declare const Migrations: {
	add(migration: {
		version: number;
		up: () => void;
		down?: () => void;
	}): void;
};
