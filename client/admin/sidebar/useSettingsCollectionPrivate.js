import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { PrivateSettingsCachedCollection } from '../PrivateSettingsCachedCollection';
import { useTranslation } from '../../contexts/TranslationContext';
import { settings } from '../../../app/settings';


export const useSettingsGroupsFiltered = (filterText) => {
	const t = useTranslation();
	const [collection, setCollection] = useState(settings.collectionPrivate);

	const filter = useDebouncedValue(filterText, 400);

	useEffect(() => {
		(async () => {
			if (!settings.cachedCollectionPrivate) {
				settings.cachedCollectionPrivate = new PrivateSettingsCachedCollection();
				settings.collectionPrivate = settings.cachedCollectionPrivate.collection;
				await settings.cachedCollectionPrivate.init();
			}
			setCollection(settings.collectionPrivate);
		})();
	}, []);

	const groups = useMemo(() => {
		if (!settings.cachedCollectionPrivate) { return []; }
		const query = {
			type: 'group',
		};

		const groups = [];
		if (filter) {
			const filterRegex = new RegExp(filter, 'i');
			const records = collection.find().fetch();
			records.forEach(function(record) {
				if (filterRegex.test(t(record.i18nLabel || record._id))) {
					groups.push(record.group || record._id);
				}
			});
			// groups = _.unique(groups);
			if (groups.length > 0) {
				query._id = {
					$in: groups,
				};
			}
		}

		if (filter && groups.length === 0) {
			return [];
		}

		return collection.find(query)
			.fetch()
			.map((item) => ({ ...item, name: t(item.i18nLabel || item._id) }))
			.sort(({ name: a }, { name: b }) => (a.toLowerCase() >= b.toLowerCase() ? 1 : -1))
			.map(({ _id, name }) => ({
				name,
				pathSection: 'admin',
				pathGroup: _id,
			}));
	}, [filter, settings.cachedCollectionPrivate]);

	return groups;
};
