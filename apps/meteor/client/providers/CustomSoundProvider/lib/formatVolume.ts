export const formatVolume = (volume: number) => {
	const clamped = Math.max(0, Math.min(volume, 100));
	return Number((clamped / 100).toPrecision(2));
};
