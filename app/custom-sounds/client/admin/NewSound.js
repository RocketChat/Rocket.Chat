// import React, { useMemo, useState } from 'react';
// import { Field, TextInput, Box, InputBox, Margins, Button } from '@rocket.chat/fuselage';

// import { useTranslation } from '../../../../client/contexts/TranslationContext';
// import { useEndpointData } from '../../../../client/hooks/useEndpointData';
// import { useEndpointAction } from '../../../../client/admin/usersAndRooms/hooks';
// import { useRoute } from '../../../../client/contexts/RouterContext';
// import { Page } from '../../../../client/components/basic/Page';

// export function AddUser({ roles, ...props }) {
// 	console.log('NEWSOUND');

// 	const t = useTranslation();

// 	const [newData, setNewData] = useState({});

// 	const router = useRoute('custom-sounds');

// 	const goToUser = (id) => router.push({
// 		context: 'info',
// 		id,
// 	});

// 	const saveQuery = useMemo(() => ({
// 		...Object.fromEntries(Object.entries(newData).filter(([, value]) => value !== null)),
// 	}), [JSON.stringify(newData)]);

// 	const saveAction = useEndpointAction('POST', 'users.create', saveQuery, t('User_created_successfully'));

// 	const handleSave = async () => {
// 		if (Object.keys(newData).length) {
// 			const result = await saveAction();
// 			if (result.success) {
// 				goToUser(result.user._id);
// 			}
// 		}
// 	};

// 	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

// 	const {
// 		name = '',
// 		file,
// 	} = newData;


// 	console.log(file);


// 	return <Page.ContentScrolable pb='x24' mi='neg-x24' is='form' { ...props }>
// 		<Margins blockEnd='x16'>
// 			<Field>
// 				<Field.Label>{t('Name')}</Field.Label>
// 				<Field.Row>
// 					<TextInput flexGrow={1} value={name} onChange={handleChange('name')}/>
// 				</Field.Row>
// 			</Field>

// 			<Field>
// 				<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>{t('Importer_Source_File')}</Field.Label>
// 				<Field.Row>
// 					<InputBox type='file' id={fileSourceInputId} onChange={handleImportFileChange} />
// 				</Field.Row>
// 				{files?.length > 0 && <Field.Row>
// 					{files.map((file, i) => <Chip key={i} onClick={handleFileUploadChipClick(file)}>{file.name}</Chip>)}
// 				</Field.Row>}
// 			</Field>

// 			<Field>
// 				<Field.Row>
// 					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
// 						<Margins inlineEnd='x4'>
// 							<Button flexGrow={1} onClick={() => setNewData({})}>{t('Cancel')}</Button>
// 							<Button mie='none' flexGrow={1} onClick={handleSave}>{t('Save')}</Button>
// 						</Margins>
// 					</Box>
// 				</Field.Row>
// 			</Field>
// 		</Margins>
// 	</Page.ContentScrolable>;
// }
