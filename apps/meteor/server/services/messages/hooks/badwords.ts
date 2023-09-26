export async function configureBadWords(badWordsList?: string, goodWordsList?: string) {
	const { default: Filter } = await import('bad-words');

	const options = {
		list:
			badWordsList
				?.split(',')
				.map((word) => word.trim())
				.filter(Boolean) || [],
		// library definition does not allow optional definition
		exclude: undefined,
		splitRegex: undefined,
		placeHolder: undefined,
		regex: undefined,
		replaceRegex: undefined,
		emptyList: undefined,
	};

	const badWords = new Filter(options);

	if (goodWordsList?.length) {
		badWords.removeWords(...goodWordsList.split(',').map((word) => word.trim()));
	}

	return badWords;
}
