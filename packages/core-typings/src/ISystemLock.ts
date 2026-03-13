interface ISystemLockBase {
	_id: string;
	locked: boolean;
	lockKey?: string;
	lockedAt?: Date;
	buildAt?: string | Date;
	extraData?: Record<string, unknown>;
}

export interface ISystemLockMigration extends ISystemLockBase {
	_id: 'data_migrations';
	extraData?: { lastVersion?: string };
}

export type ISystemLock = ISystemLockBase | ISystemLockMigration;
