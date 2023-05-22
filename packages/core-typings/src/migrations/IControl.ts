export type IControl = {
	_id: string;
	version: number;
	locked: boolean;
	buildAt?: string | Date;
	lockedAt?: string | Date;
};
