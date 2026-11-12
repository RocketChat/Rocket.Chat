const GENERATED_BY = 'by scripts/generate-frame-values.mts from @rocket.chat/fuselage-tokens, do not edit';

/** The comments that fence a generated section; a file with several sections names each one. */
export const markers = (css: boolean | undefined, section: string | undefined) => {
	const name = section ? ` ${section}` : '';
	return css
		? [`/* generated${name} ${GENERATED_BY} */`, `/* end of generated${name} */`]
		: [`// generated${name} ${GENERATED_BY}`, `// end of generated${name}`];
};
