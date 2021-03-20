import { ISetting } from '../../../../../../definition/ISetting';

export type AppearanceEndpoint = {
	GET: (params: Record<string, never>) => {
		success: boolean;
		appearance: ISetting[];
	};
};
