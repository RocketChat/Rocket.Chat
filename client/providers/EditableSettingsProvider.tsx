import { useLazyRef, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import React, { useEffect, useMemo, FunctionComponent, useCallback } from 'react';

import { SettingId } from '../../definition/ISetting';
import { EditableSettingsContext, IEditableSetting, EditableSettingsContextValue } from '../contexts/EditableSettingsContext';
import { useSettings, SettingsContextQuery } from '../contexts/SettingsContext';
import { useReactiveSubscriptionFactory } from '../hooks/useReactiveSubscriptionFactory';

const defaultQuery: SettingsContextQuery = {};

type EditableSettingsProviderProps = {
	readonly query: SettingsContextQuery;
};

const EditableSettingsProvider: FunctionComponent<EditableSettingsProviderProps> = ({
	children,
	query = defaultQuery,
}) => {
	const settingsCollectionRef = useLazyRef(() => new Mongo.Collection<any>(null));
	const persistedSettings = useSettings(query);

	useEffect(() => {
		if (!settingsCollectionRef.current) {
			return;
		}

		settingsCollectionRef.current.remove({ _id: { $nin: persistedSettings.map(({ _id }) => _id) } });
		for (const setting of persistedSettings) {
			settingsCollectionRef.current.upsert(setting._id, { ...setting });
		}
	}, [persistedSettings, settingsCollectionRef]);

	const queryEditableSetting = useReactiveSubscriptionFactory(
		useCallback(
			(_id: SettingId): IEditableSetting | undefined => {
				if (!settingsCollectionRef.current) {
					return;
				}

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
					disabled: !queries.every((query) => (settingsCollectionRef.current?.find(query)?.count() ?? 0) > 0),
				};
			},
			[settingsCollectionRef],
		),
	);

	const queryEditableSettings = useReactiveSubscriptionFactory(
		useCallback(
			(query = {}) => settingsCollectionRef.current?.find({
				...('_id' in query) && { _id: { $in: query._id } },
				...('group' in query) && { group: query.group },
				...('section' in query) && (
					query.section
						? { section: query.section }
						: {
							$or: [
								{ section: { $exists: false } },
								{ section: null },
							],
						}
				),
				...('changed' in query) && { changed: query.changed },
			}, {
				sort: {
					section: 1,
					sorter: 1,
					i18nLabel: 1,
				},
			}).fetch() ?? [],
			[settingsCollectionRef],
		),
	);

	const findSettingsGroup = useMutableCallback((groupId) => {
		const group = settingsCollectionRef.current?.findOne({ _id: groupId, type: 'group' });
		if (!group) {
			return null;
		}

		const editableSettings = settingsCollectionRef.current?.find({
			group: groupId,
		}, {
			sort: {
				section: 1,
				sorter: 1,
				i18nLabel: 1,
			},
		}).fetch() ?? [];

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

		return (): void => {
			computation.stop();
		};
	});

	const findSettingsSection = useMutableCallback((groupId, sectionName) => {
		const editableSettings = settingsCollectionRef.current?.find({
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
		}).fetch() ?? [];

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

		return (): void => {
			computation.stop();
		};
	});

	const dispatch = useMutableCallback((changes: Partial<IEditableSetting>[]): void => {
		for (const { _id, ...data } of changes) {
			if (!_id) {
				continue;
			}

			settingsCollectionRef.current?.update(_id, { $set: data });
		}
		Tracker.flush();
	});

	const contextValue = useMemo<EditableSettingsContextValue>(() => ({
		queryEditableSetting,
		queryEditableSettings,
		getSettingsGroup,
		subscribeToSettingsGroup,
		getSettingsSection,
		subscribeToSettingsSection,
		dispatch,
	}), [
		queryEditableSetting,
		queryEditableSettings,
		getSettingsGroup,
		subscribeToSettingsGroup,
		getSettingsSection,
		subscribeToSettingsSection,
		dispatch,
	]);

	return <EditableSettingsContext.Provider children={children} value={contextValue} />;
};

export default EditableSettingsProvider;
