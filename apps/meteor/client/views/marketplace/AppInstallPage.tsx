import { Box, Button, ButtonGroup, Field, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { PageScrollableContent, Page, PageHeader } from '@rocket.chat/ui-client';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useInstallApp } from './hooks/useInstallApp';
import { useSingleFileInput } from '../../hooks/useSingleFileInput';

const AppInstallPage = () => {
	const t = useTranslation();
	const router = useRouter();

	const { control, setValue, watch } = useForm<{ file: File }>();
	const { file } = watch();
	const { install, isInstalling } = useInstallApp(file);

	const [handleUploadButtonClick] = useSingleFileInput((value) => setValue('file', value), 'app');

	const handleCancel = useCallback(() => {
		router.navigate({
			name: 'marketplace',
			params: {
				context: 'private',
				page: 'list',
			},
		});
	}, [router]);

	const fileField = useId();

	return (
		<Page flexDirection='column'>
			<PageHeader title={t('App_Installation')} />
			<PageScrollableContent>
				<Box maxWidth='x600' width='full' alignSelf='center'>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={fileField}>{t('App_Url_to_Install_From_File')}</FieldLabel>
							<FieldRow>
								<Controller
									name='file'
									control={control}
									render={({ field }) => (
										<TextInput
											id={fileField}
											readOnly
											{...field}
											value={field.value?.name || ''}
											endAddonFlush
											endAddon={
												<Button icon='upload' small primary onClick={handleUploadButtonClick}>
													{t('Browse_Files')}
												</Button>
											}
										/>
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<ButtonGroup>
								<Button disabled={!file?.name} loading={isInstalling} onClick={install}>
									{t('Install')}
								</Button>
								<Button onClick={handleCancel}>{t('Cancel')}</Button>
							</ButtonGroup>
						</Field>
					</FieldGroup>
				</Box>
			</PageScrollableContent>
		</Page>
	);
};

export default AppInstallPage;
