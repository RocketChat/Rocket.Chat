import { useMemo, useState, useEffect } from 'react';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { settings } from '../../../app/settings';
import { useTranslation } from '../../contexts/TranslationContext';
import { PrivateSettingsCachedCollection } from '../PrivateSettingsCachedCollection';

export const useSettingsGroupsFiltered = (textFilter) => {
	const t = useTranslation();

	const [collection, setCollection] = useState(settings.collectionPrivate);

	const [loading, setLoading] = useState(true);

	const filter = useDebouncedValue(textFilter, 400);

	useEffect(() => {
		(async function getCollection() {
			if (!settings.cachedCollectionPrivate) {
				settings.cachedCollectionPrivate = new PrivateSettingsCachedCollection();
				settings.collectionPrivate = settings.cachedCollectionPrivate.collection;
				await settings.cachedCollectionPrivate.init();
			}
			setCollection(settings.collectionPrivate);
			setLoading(false);
		}());
	}, []);

	return useMemo(() => {
		if (loading) { return [[], loading]; }

		const query = {
			type: 'group',
		};

		const groups = [];
		if (filter) {
			const filterRegex = new RegExp(filter, 'i');
			const records = collection.find().fetch();
			records.forEach(function(record) {
				if (filterRegex.test(t(record.i18nLabel || record._id))) {
					!groups.includes(record.group || record._id) && groups.push(record.group || record._id);
				}
			});

			if (groups.length > 0) {
				query._id = {
					$in: groups,
				};
			}
		}

		if (filter && groups.length === 0) {
			return [[], loading];
		}

		const result = collection.find(query)
			.fetch()
			.map((item) => ({ name: t(item.i18nLabel || item._id), href: 'admin', pathGroup: item._id }))
			.sort(({ name: a }, { name: b }) => (a.toLowerCase() >= b.toLowerCase() ? 1 : -1));

		return [result, loading];
	}, [filter, collection, loading]);
};
