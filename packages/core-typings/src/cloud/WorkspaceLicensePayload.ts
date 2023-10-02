/* eslint-disable @typescript-eslint/naming-convention */

export interface WorkspaceLicensePayload {
	version: number;
	address: string;
	license: string;
	updatedAt: Date;
	modules: string;
	expireAt: Date;
}
