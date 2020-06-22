import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import React, { useEffect, useMemo, FunctionComponent, useCallback, useRef, MutableRefObject } from 'react';

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
	const settingsCollectionRef = useRef<Mongo.Collection<IEditableSetting>>(null) as MutableRefObject<Mongo.Collection<IEditableSetting>>;
	const persistedSettings = useSettings(query);

	const getSettingsCollection = useMutableCallback(() => {
		if (!settingsCollectionRef.current) {
			settingsCollectionRef.current = new Mongo.Collection<any>(null);
		}

		return settingsCollectionRef.current;
	}) as () => Mongo.Collection<IEditableSetting>;

	useEffect(() => {
		const settingsCollection = getSettingsCollection();

		settingsCollection.remove({ _id: { $nin: persistedSettings.map(({ _id }) => _id) } });
		for (const { _id, ...fields } of persistedSettings) {
			settingsCollection.upsert(_id, { $set: { ...fields } });
		}
	}, [getSettingsCollection, persistedSettings]);

	const queryEditableSetting = useReactiveSubscriptionFactory(
		useCallback(
			(_id: SettingId): IEditableSetting | undefined => {
				const settingsCollection = getSettingsCollection();

				const editableSetting = settingsCollection.findOne(_id);

				if (!editableSetting) {
					return undefined;
				}

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
					disabled: !queries.every((query) => settingsCollection.find(query).count() > 0),
				};
			},
			[getSettingsCollection],
		),
	);

	const queryEditableSettings = useReactiveSubscriptionFactory(
		useCallback(
			(query = {}) => getSettingsCollection().find({
				...('_id' in query) && { _id: { $in: query._id } },
				...('group' in query) && { group: query.group },
				...('section' in query) && (
					query.section
						? { section: query.section }
						: {
							$or: [
								{ section: { $exists: false } },
								{ section: '' },
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
			}).fetch(),
			[getSettingsCollection],
		),
	);

	const queryGroupSections = useReactiveSubscriptionFactory(
		useCallback(
			(_id: GroupId) => Array.from(new Set(
				getSettingsCollection().find({
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
				}).fetch().map(({ section }) => section || ''),
			)),
			[getSettingsCollection],
		),
	);

	const dispatch = useMutableCallback((changes: Partial<IEditableSetting>[]): void => {
		for (const { _id, ...data } of changes) {
			if (!_id) {
				continue;
			}

			getSettingsCollection().update(_id, { $set: data });
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
