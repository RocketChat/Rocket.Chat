export type IControl = {
	_id: string;
	version: number;
	locked: boolean;
	hash?: string;
	buildAt?: string | Date;
	lockedAt?: string | Date;
};
