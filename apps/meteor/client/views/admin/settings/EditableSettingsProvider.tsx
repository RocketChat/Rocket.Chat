import { SettingId, GroupId, ISetting, TabId } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSettings, SettingsContextQuery } from '@rocket.chat/ui-contexts';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import type { FilterOperators } from 'mongodb';
import React, { useEffect, useMemo, FunctionComponent, useRef, MutableRefObject } from 'react';

import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { createReactiveSubscriptionFactory } from '../../../providers/createReactiveSubscriptionFactory';
import { EditableSettingsContext, EditableSetting, EditableSettingsContextValue } from '../EditableSettingsContext';

const defaultQuery: SettingsContextQuery = {};

type EditableSettingsProviderProps = {
	readonly query?: SettingsContextQuery;
};

const EditableSettingsProvider: FunctionComponent<EditableSettingsProviderProps> = ({ children, query = defaultQuery }) => {
	const settingsCollectionRef = useRef<Mongo.Collection<EditableSetting>>(null) as MutableRefObject<Mongo.Collection<EditableSetting>>;
	const persistedSettings = useSettings(query);

	const getSettingsCollection = useMutableCallback(() => {
		if (!settingsCollectionRef.current) {
			settingsCollectionRef.current = new Mongo.Collection<any>(null);
		}

		return settingsCollectionRef.current;
	}) as () => Mongo.Collection<EditableSetting>;

	useEffect(() => {
		const settingsCollection = getSettingsCollection();

		settingsCollection.remove({ _id: { $nin: persistedSettings.map(({ _id }) => _id) } });
		for (const { _id, ...fields } of persistedSettings) {
			settingsCollection.upsert(_id, { $set: { ...fields }, $unset: { changed: true } });
		}
	}, [getSettingsCollection, persistedSettings]);

	const queryEditableSetting = useMemo(() => {
		const validateSettingQueries = (
			query: undefined | string | FilterOperators<ISetting> | FilterOperators<ISetting>[],
			settingsCollection: Mongo.Collection<EditableSetting>,
		): boolean => {
			if (!query) {
				return true;
			}

			const queries = [].concat(typeof query === 'string' ? JSON.parse(query) : query);
			return queries.every((query) => settingsCollection.find(query).count() > 0);
		};

		return createReactiveSubscriptionFactory((_id: SettingId): EditableSetting | undefined => {
			const settingsCollection = getSettingsCollection();
			const editableSetting = settingsCollection.findOne(_id);

			if (!editableSetting) {
				return undefined;
			}

			return {
				...editableSetting,
				disabled: editableSetting.blocked || !validateSettingQueries(editableSetting.enableQuery, settingsCollection),
				invisible: !validateSettingQueries(editableSetting.displayQuery, settingsCollection),
			};
		});
	}, [getSettingsCollection]);

	const queryEditableSettings = useMemo(
		() =>
			createReactiveSubscriptionFactory((query = {}) =>
				getSettingsCollection()
					.find(
						{
							...('_id' in query && { _id: { $in: query._id } }),
							...('group' in query && { group: query.group }),
							...('changed' in query && { changed: query.changed }),
							$and: [
								{
									...('section' in query &&
										(query.section
											? { section: query.section }
											: {
													$or: [{ section: { $exists: false } }, { section: '' }],
											  })),
								},
								{
									...('tab' in query &&
										(query.tab
											? { tab: query.tab }
											: {
													$or: [{ tab: { $exists: false } }, { tab: '' }],
											  })),
								},
							],
						},
						{
							sort: {
								section: 1,
								sorter: 1,
								i18nLabel: 1,
							},
						},
					)
					.fetch(),
			),
		[getSettingsCollection],
	);

	const queryGroupSections = useMemo(
		() =>
			createReactiveSubscriptionFactory((_id: GroupId, tab?: TabId) =>
				Array.from(
					new Set(
						getSettingsCollection()
							.find(
								{
									group: _id,
									...(tab !== undefined
										? { tab }
										: {
												$or: [{ tab: { $exists: false } }, { tab: '' }],
										  }),
								},
								{
									fields: {
										section: 1,
									},
									sort: {
										sorter: 1,
										section: 1,
										i18nLabel: 1,
									},
								},
							)
							.fetch()
							.map(({ section }) => section || ''),
					),
				),
			),
		[getSettingsCollection],
	);

	const queryGroupTabs = useMemo(
		() =>
			createReactiveSubscriptionFactory((_id: GroupId) =>
				Array.from(
					new Set(
						getSettingsCollection()
							.find(
								{
									group: _id,
								},
								{
									fields: {
										tab: 1,
									},
									sort: {
										sorter: 1,
										tab: 1,
										i18nLabel: 1,
									},
								},
							)
							.fetch()
							.map(({ tab }) => tab || ''),
					),
				),
			),
		[getSettingsCollection],
	);

	const dispatch = useMutableCallback((changes: Partial<EditableSetting>[]): void => {
		for (const { _id, ...data } of changes) {
			if (!_id) {
				continue;
			}

			getSettingsCollection().update(_id, { $set: data });
		}
		Tracker.flush();
	});

	const isEnterprise = useIsEnterprise();

	const contextValue = useMemo<EditableSettingsContextValue>(
		() => ({
			queryEditableSetting,
			queryEditableSettings,
			queryGroupSections,
			queryGroupTabs,
			dispatch,
			isEnterprise,
		}),
		[queryEditableSetting, queryEditableSettings, queryGroupSections, queryGroupTabs, dispatch, isEnterprise],
	);

	return <EditableSettingsContext.Provider children={children} value={contextValue} />;
};

export default EditableSettingsProvider;
