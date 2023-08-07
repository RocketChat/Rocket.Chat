export type StatusData = {
	data: {
		open: number;
		queued: number;
		onHold: number;
		closed: number;
	};
	success: boolean;
};

export const MOCK_STATUS_DATA: StatusData = {
	data: {
		open: 37.5,
		queued: 25,
		onHold: 25,
		closed: 12.5,
	},
	success: true,
};

export const MOCK_DEPARTMENTS_DATA = {
	data: Array.from({ length: 50 }, (_, i) => ({
		label: String(i),
		value: Math.max(i * 10, 5),
	})),
	success: true,
};
