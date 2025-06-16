export const isSetSinkIdAvailable = (): boolean => {
	const audio = new Audio();
	return !!audio.setSinkId;
};
