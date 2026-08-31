export const mediaCallQueryKeys = {
	all: ['mediaCall'] as const,
	peerAutocomplete: (filter: string) => [...mediaCallQueryKeys.all, 'peerAutocomplete', filter] as const,
};
