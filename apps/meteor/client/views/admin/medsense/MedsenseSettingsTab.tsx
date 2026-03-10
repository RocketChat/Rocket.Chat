import type { ISetting, ISettingColor } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, FieldGroup, Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { useEndpoint, useSettingsDispatch, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import { useEditableSettings } from '../EditableSettingsContext';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';
import Setting from '../settings/Setting/Setting';

const EXCLUDED_RENDERED_SETTING_IDS = new Set([
	'Medsense_CCDD_NTP_Source_File',
	'Medsense_CCDD_NTP_Imported_Version',
	'Medsense_CCDD_NTP_Last_Imported_At',
	'Medsense_Intervention_Types',
]);

const isColorSetting = (setting: ISetting): setting is ISettingColor => setting.type === 'color';
type InterventionTypeRow = { value: string; label: string };

const MedsenseSettingsTabContent = () => {
	const t = useTranslation();
	const dispatchSettings = useSettingsDispatch();
	const dispatchToast = useToastMessageDispatch();
	const importDrugCatalog = useEndpoint('POST', '/v1/medsense/drug-catalog.import');
	const getImportStatus = useEndpoint('GET', '/v1/medsense/drug-catalog.import-status');
	const getInterventionTypes = useEndpoint('GET', '/v1/medsense/intervention-types.list');
	const [importLoading, setImportLoading] = useState(false);
	const [selectedDrugFile, setSelectedDrugFile] = useState<File | null>(null);
	const [interventionTypes, setInterventionTypes] = useState<InterventionTypeRow[]>([]);
	const [savedInterventionTypesJson, setSavedInterventionTypesJson] = useState('[]');

	const editableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: 'Medsense',
			}),
			[],
		),
	);
	const { data: importStatus, refetch: refetchImportStatus, isLoading: importStatusLoading } = useQuery({
		queryKey: ['medsense', 'drug-catalog-import-status'],
		queryFn: async () => getImportStatus(),
	});
	const { data: interventionTypesData } = useQuery({
		queryKey: ['medsense', 'intervention-types'],
		queryFn: async () => getInterventionTypes(),
	});

	const renderedSettingIds = useMemo(() => {
		return editableSettings
			.map(({ _id }) => _id)
			.filter((settingId) => !EXCLUDED_RENDERED_SETTING_IDS.has(settingId));
	}, [editableSettings]);

	const changedSettings = editableSettings.filter(({ changed }) => changed);
	const interventionTypesJson = useMemo(
		() => JSON.stringify(interventionTypes.filter((item) => item.value.trim() && item.label.trim())),
		[interventionTypes],
	);
	const interventionTypesChanged = interventionTypesJson !== savedInterventionTypesJson;
	const sectionChanged = changedSettings.length > 0 || interventionTypesChanged;

	useEffect(() => {
		const rows = Array.isArray(interventionTypesData?.interventionTypes) ? interventionTypesData.interventionTypes : [];
		const normalized = rows.map((item: any) => ({
			value: String(item?.value || ''),
			label: String(item?.label || ''),
		}));
		setInterventionTypes(normalized);
		setSavedInterventionTypesJson(JSON.stringify(normalized.filter((item: InterventionTypeRow) => item.value.trim() && item.label.trim())));
	}, [interventionTypesData]);

	const handleSave = async () => {
		if (!sectionChanged) {
			return;
		}

		try {
			const updates = changedSettings.map((setting) => {
					if (isColorSetting(setting)) {
						return {
							_id: setting._id,
							value: setting.value,
							editor: setting.editor,
						};
					}

					return {
						_id: setting._id,
						value: setting.value,
					};
				});

			if (interventionTypesChanged) {
				updates.push({
					_id: 'Medsense_Intervention_Types',
					value: interventionTypesJson,
				});
			}

			await dispatchSettings(updates);
			setSavedInterventionTypesJson(interventionTypesJson);
			dispatchToast({ type: 'success', message: t('Settings_updated') });
		} catch (error: any) {
			dispatchToast({ type: 'error', message: error?.message || String(error) });
		}
	};

	const updateInterventionType = (index: number, field: keyof InterventionTypeRow, value: string) => {
		setInterventionTypes((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item));
	};

	const addInterventionType = () => setInterventionTypes((current) => [...current, { value: '', label: '' }]);
	const removeInterventionType = (index: number) => setInterventionTypes((current) => current.filter((_, currentIndex) => currentIndex !== index));

	const handleImport = async () => {
		if (!selectedDrugFile) {
			return;
		}

		setImportLoading(true);
		try {
			const result = await importDrugCatalog({
				force: false,
				fileName: selectedDrugFile.name,
				fileContent: await selectedDrugFile.text(),
			});
			dispatchToast({
				type: 'success',
				message: result?.imported === false ? 'Drug catalog already up to date' : 'Drug catalog imported successfully',
			});
			setSelectedDrugFile(null);
			await refetchImportStatus();
		} catch (error: any) {
			dispatchToast({ type: 'error', message: error?.message || String(error) });
		} finally {
			setImportLoading(false);
		}
	};

	return (
		<Box p='x24' display='flex' flexDirection='column' maxWidth='x580' w='full'>
			<Box mbe='x20' display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap'>
				<Box fontScale='p2' color='hint'>
					Medsense settings are managed here only.
				</Box>
				<ButtonGroup>
					<Button primary disabled={!sectionChanged} onClick={handleSave}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Box>

			<FieldGroup>
				{renderedSettingIds.map((settingId) => (
					<Setting key={settingId} settingId={settingId} sectionChanged={sectionChanged} />
				))}
			</FieldGroup>

			<Box mbs='x24' p='x16' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
				<Box fontScale='p2' mbe='x12'>
					Intervention Types
				</Box>
				<Box fontScale='c1' color='hint' mbe='x12'>
					This list is the source of truth for intervention categories used by request management and documentation templates.
				</Box>
				<FieldGroup>
					{interventionTypes.map((item, index) => (
						<Box key={`${item.value}-${index}`} display='flex' alignItems='end' flexWrap='wrap' mbe='x12'>
							<Box flexGrow={1} mie='x12'>
								<Field>
									<FieldLabel>Label</FieldLabel>
									<FieldRow>
										<TextInput value={item.label} onChange={(event: any) => updateInterventionType(index, 'label', event.currentTarget.value)} />
									</FieldRow>
								</Field>
							</Box>
							<Box flexGrow={1} mie='x12'>
								<Field>
									<FieldLabel>Value</FieldLabel>
									<FieldRow>
										<TextInput value={item.value} onChange={(event: any) => updateInterventionType(index, 'value', event.currentTarget.value)} />
									</FieldRow>
								</Field>
							</Box>
							<Button danger small onClick={() => removeInterventionType(index)}>
								Remove
							</Button>
						</Box>
					))}
				</FieldGroup>
				<Button small onClick={addInterventionType}>
					Add Intervention Type
				</Button>
			</Box>

			<Box mbs='x24' p='x16' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
				<Box fontScale='p2' mbe='x12'>
					Drug Catalog Import
				</Box>
				<Box fontScale='c1' color='hint' mbe='x12'>
					Choose the downloaded CCDD NTP JSON file from your machine, then import it manually.
				</Box>
				<Box fontScale='c1' mbe='x4'>
					Last imported version: {importStatusLoading ? 'Loading...' : importStatus?.importedVersion || 'Never'}
				</Box>
				<Box fontScale='c1' mbe='x4'>
					Last imported at: {importStatusLoading ? 'Loading...' : importStatus?.lastImportedAt || 'Never'}
				</Box>
				<Box fontScale='c1' mbe='x12'>
					Active drug rows: {importStatusLoading ? 'Loading...' : importStatus?.activeCount ?? 0}
				</Box>
				{importStatus?.error && (
					<Box fontScale='c1' color='danger' mbe='x12'>
						{importStatus.error}
					</Box>
				)}
				<Box mbe='x12'>
					<Box
						is='input'
						type='file'
						accept='.json,application/json'
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
							const file = event.currentTarget.files?.[0] || null;
							setSelectedDrugFile(file);
						}}
					/>
				</Box>
				<Box fontScale='c1' color='hint' mbe='x12'>
					Selected file: {selectedDrugFile?.name || 'None'}
				</Box>
				<Button onClick={handleImport} loading={importLoading} disabled={sectionChanged || !selectedDrugFile}>
					Import Drug Catalog
				</Button>
			</Box>
		</Box>
	);
};

export const MedsenseSettingsTab = () => (
	<EditableSettingsProvider>
		<MedsenseSettingsTabContent />
	</EditableSettingsProvider>
);
