const prefix = 'rocketchat_';
export function getCollectionName(name: string): string {
	return `${prefix}${name}`;
}
