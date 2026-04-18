export const getMessageBoxStorageKey = (roomId: string, tmid?: string): string => {
	return `messagebox_${roomId}${tmid ? `-${tmid}` : ''}`;
};
