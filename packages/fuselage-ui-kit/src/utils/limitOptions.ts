/** Once `max` entries are selected, offers only those, so nothing else can be picked. */
export const limitOptions = <TOption extends { value: string }>(
	options: TOption[] | undefined,
	value: string[] | undefined,
	max: number | undefined,
) => {
	if (max === undefined || (value?.length ?? 0) < max) {
		return options;
	}

	return options?.filter((option) => value?.includes(option.value));
};
