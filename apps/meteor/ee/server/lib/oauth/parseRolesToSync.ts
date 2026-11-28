export function parseRolesToSync(rolesToSync: string | undefined): string[] {
	return rolesToSync?.split(',').map((role) => role.trim()).filter(Boolean) ?? [];
}
