import { createContext, useMemo, useContext } from 'react';

export const TranslationContext = createContext({
	language: null,
	translate: (key) => key,
	doKeyExists: () => true,
});

export const useTranslation = () => {
	const { translate, doKeyExists } = useContext(TranslationContext);

	return useMemo(() => {
		const t = translate.bind(null);
		t.has = doKeyExists.bind(null);
		return t;
	}, [translate, doKeyExists]);
};
