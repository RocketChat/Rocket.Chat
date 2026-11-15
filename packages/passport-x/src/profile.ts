export type Profile = {
	id: string;
	username: string;
	displayName: string;
	emails?: { value: string }[];
	photos: { value: string }[];
	provider?: string;
	_raw?: string;
	_json?: Record<string, unknown>;
	_accessLevel?: string;
};

export function parse(json: string | Record<string, unknown>): Profile {
	const data: Record<string, unknown> = typeof json === 'string' ? JSON.parse(json) : json;

	const profile: Profile = {
		id: data.id_str ? String(data.id_str) : String(data.id),
		username: data.screen_name as string,
		displayName: data.name as string,
		photos: [{ value: data.profile_image_url_https as string }],
	};

	if (data.email) {
		profile.emails = [{ value: data.email as string }];
	}

	return profile;
}
