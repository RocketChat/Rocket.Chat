import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { Tracker } from 'meteor/tracker';
import { useEffect, useState } from 'react';

const createTranslator = () => (key, ...replaces) => Tracker.nonreactive(() => {
	if (typeof replaces[0] === 'object') {
		return TAPi18n.__(key, ...replaces);
	}

	return TAPi18n.__(key, {
		postProcess: 'sprintf',
		sprintf: replaces,
	});
});

const translatorSetters = new Set();

Meteor.startup(() => {
	Tracker.autorun((computation) => {
		TAPi18n.getLanguage();
		if (!computation.firstRun) {
			translatorSetters.forEach((updateTranslation) => updateTranslation(createTranslator));
		}
	});
});

export const useTranslation = () => {
	const [translator, updateTranslator] = useState(createTranslator);
	translatorSetters.add(updateTranslator);

	useEffect(() => () => {
		translatorSetters.delete(updateTranslator);
	}, []);

	return translator;
};
