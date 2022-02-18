export const sortAppsByAlphabeticalOrInverseOrder = (firstWord: string, secondWord: string): number =>
	firstWord.toLowerCase().localeCompare(secondWord.toLowerCase());
