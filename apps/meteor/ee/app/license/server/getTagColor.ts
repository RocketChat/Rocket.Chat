export function getTagColor(tag: string): string {
	switch (tag) {
		case 'bronze':
			return '#BD5A0B';
		case 'silver':
			return '#9EA2A8';
		case 'gold':
			return '#F3BE08';
		default:
			return '#4411DD';
	}
}
