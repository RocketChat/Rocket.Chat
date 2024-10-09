export function getCronAdvancedTimerFromPrecisionSetting(precision: '0' | '1' | '2' | '3'): string {
	switch (precision) {
		case '0':
			return '*/30 * * * *'; // 30 minutes
		case '1':
			return '0 * * * *'; // hour
		case '2':
			return '0 */6 * * *'; // 6 hours
		case '3':
			return '0 0 * * *'; // day
	}
}
