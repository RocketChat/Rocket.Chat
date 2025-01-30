import { Button, ButtonGroup, Field, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useInstallApp } from './hooks/useInstallApp';
import { Page, PageHeader, PageScrollableContent } from '../../components/Page';
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
				<FieldGroup display='flex' flexDirection='column' alignSelf='center' maxWidth='x600' w='full'>
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
										addon={
											<Button icon='upload' small primary onClick={handleUploadButtonClick} mb='neg-x4' mie='neg-x8'>
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
			</PageScrollableContent>
		</Page>
	);
};

export default AppInstallPage;
