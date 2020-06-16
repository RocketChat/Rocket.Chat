import { useLazyRef, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

import { PrivilegedSettingsContext } from '../contexts/PrivilegedSettingsContext';
import { useAtLeastOnePermission } from '../contexts/AuthorizationContext';
import { PrivateSettingsCachedCollection } from './PrivateSettingsCachedCollection';

function AuthorizedPrivilegedSettingsProvider({ cachedCollection, children }) {
	const [isLoading, setLoading] = useState(() => Tracker.nonreactive(() => !cachedCollection.ready.get()));

	useEffect(() => {
		let mounted = true;

		const initialize = async () => {
			if (!Tracker.nonreactive(() => cachedCollection.ready.get())) {
				await cachedCollection.init();
			}

			if (!mounted) {
				return;
			}

			setLoading(false);
		};

		initialize();

		return () => {
			mounted = false;
		};
	}, [cachedCollection]);

	const findSettings = useCallback(() => cachedCollection.collection.find({}, {
		sort: {
			section: 1,
			sorter: 1,
			i18nLabel: 1,
		},
	}).fetch(), [cachedCollection]);

	const getSettings = useMutableCallback(() =>
		Tracker.nonreactive(() => findSettings()));

	const subscribeToSettings = useMutableCallback((callback) => {
		const computation = Tracker.autorun(() => {
			callback(findSettings());
		});

		return () => {
			computation.stop();
		};
	});

	const settingsCollectionRef = useLazyRef(() => new Mongo.Collection(null));

	useEffect(() => {
		if (isLoading) {
			return;
		}

		const query = cachedCollection.collection.find();

		const syncCollectionsHandle = query.observe({
			added: (setting) => settingsCollectionRef.current.insert({ ...setting }),
			changed: (setting) => settingsCollectionRef.current.update(setting._id, { ...setting }),
			removed: (setting) => settingsCollectionRef.current.remove(setting._id),
		});

		return () => {
			syncCollectionsHandle.stop();
		};
	}, [isLoading, cachedCollection]);

	const findSettingsGroup = useMutableCallback((groupId) => {
		const group = settingsCollectionRef.current.findOne({ _id: groupId, type: 'group' });
		if (!group) {
			return null;
		}

		const editableSettings = settingsCollectionRef.current.find({
			group: groupId,
		}, {
			sort: {
				section: 1,
				sorter: 1,
				i18nLabel: 1,
			},
		}).fetch();

		return Object.assign(group, {
			editableSettings,
			sections: Array.from(new Set(editableSettings.map(({ section }) => section))),
			changed: editableSettings.some(({ changed }) => changed),
		});
	});

	const getSettingsGroup = useMutableCallback((groupId) =>
		Tracker.nonreactive(() => findSettingsGroup(groupId)));

	const subscribeToSettingsGroup = useMutableCallback((groupId, callback) => {
		const computation = Tracker.autorun(() => {
			callback(findSettingsGroup(groupId));
		});

		return () => {
			computation.stop();
		};
	});

	const findSettingsSection = useMutableCallback((groupId, sectionName) => {
		const editableSettings = settingsCollectionRef.current.find({
			group: groupId,
			...sectionName
				? { section: sectionName }
				: {
					$or: [
						{ section: { $exists: false } },
						{ section: null },
					],
				},
		}, {
			sort: {
				sorter: 1,
				i18nLabel: 1,
			},
		}).fetch();

		return {
			name: sectionName,
			editableSettings,
			settings: editableSettings.map(({ _id }) => _id),
			changed: editableSettings.some(({ changed }) => changed),
			canReset: editableSettings.some(({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue)),
		};
	});

	const getSettingsSection = useMutableCallback((groupId, sectionName) =>
		Tracker.nonreactive(() => findSettingsSection(groupId, sectionName)));

	const subscribeToSettingsSection = useMutableCallback((groupId, sectionName, callback) => {
		const computation = Tracker.autorun(() => {
			callback(findSettingsSection(groupId, sectionName));
		});

		return () => {
			computation.stop();
		};
	});

	const findSetting = useCallback((_id) => ({ ...cachedCollection.collection.findOne(_id) }), [cachedCollection]);

	const getSetting = useCallback((_id) =>
		Tracker.nonreactive(() => findSetting(_id)), [findSetting]);

	const subscribeToSetting = useCallback((_id, callback) => {
		const computation = Tracker.autorun(() => {
			callback(findSetting(_id));
		});

		return () => {
			computation.stop();
		};
	}, [findSetting]);

	const findEditableSetting = (_id) => {
		const editableSetting = settingsCollectionRef.current.findOne(_id);

		if (editableSetting.blocked) {
			return { ...editableSetting, disabled: true };
		}

		if (!editableSetting.enableQuery) {
			return { ...editableSetting, disabled: false };
		}

		const queries = [].concat(typeof editableSetting.enableQuery === 'string'
			? JSON.parse(editableSetting.enableQuery)
			: editableSetting.enableQuery);
		return {
			...editableSetting,
			disabled: !queries.every((query) => settingsCollectionRef.current.find(query).count() > 0),
		};
	};

	const getEditableSetting = useMutableCallback((_id) =>
		Tracker.nonreactive(() => findEditableSetting(_id)));

	const subscribeToEditableSetting = useMutableCallback((_id, cb) => {
		const computation = Tracker.autorun(() => {
			cb(findEditableSetting(_id));
		});

		return () => {
			computation.stop();
		};
	});

	const patch = useMutableCallback((changes) => {
		changes.forEach(({ _id, ...data }) => {
			settingsCollectionRef.current.update(_id, { $set: data });
		});
		Tracker.flush();
	});

	const contextValue = useMemo(() => ({
		authorized: true,
		isLoading,
		getSettings,
		subscribeToSettings,
		getSettingsGroup,
		subscribeToSettingsGroup,
		getSettingsSection,
		subscribeToSettingsSection,
		getSetting,
		subscribeToSetting,
		getEditableSetting,
		subscribeToEditableSetting,
		patch,
	}), [
		isLoading,
		getSettings,
		subscribeToSettings,
		getSettingsGroup,
		subscribeToSettingsGroup,
		getSettingsSection,
		subscribeToSettingsSection,
		getSetting,
		subscribeToSetting,
		getEditableSetting,
		subscribeToEditableSetting,
		patch,
	]);

	return <PrivilegedSettingsContext.Provider children={children} value={contextValue} />;
}

function PrivilegedSettingsProvider({ children }) {
	const hasPermission = useAtLeastOnePermission([
		'view-privileged-setting',
		'edit-privileged-setting',
		'manage-selected-settings',
	]);

	if (!hasPermission) {
		return children;
	}

	return <AuthorizedPrivilegedSettingsProvider
		cachedCollection={PrivateSettingsCachedCollection.get()}
		children={children}
	/>;
}

export default PrivilegedSettingsProvider;
