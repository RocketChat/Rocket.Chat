import { useLazyRef, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import React, { useEffect, useMemo, FunctionComponent, useCallback } from 'react';

import { SettingId, GroupId } from '../../definition/ISetting';
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

	const queryGroupSections = useReactiveSubscriptionFactory(
		useCallback(
			(_id: GroupId) => Array.from(new Set(
				(settingsCollectionRef.current?.find({
					group: _id,
				}, {
					fields: {
						section: 1,
					},
					sort: {
						section: 1,
						sorter: 1,
						i18nLabel: 1,
					},
				}).fetch() ?? []).map(({ section }) => section),
			)),
			[settingsCollectionRef],
		),
	);

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
		queryGroupSections,
		dispatch,
	}), [
		queryEditableSetting,
		queryEditableSettings,
		queryGroupSections,
		dispatch,
	]);

	return <EditableSettingsContext.Provider children={children} value={contextValue} />;
};

export default EditableSettingsProvider;
