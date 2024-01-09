import { Button, ButtonGroup, Icon, Field, FieldGroup, FieldLabel, FieldRow, TextInput, Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Page, PageHeader, PageScrollableContent } from '../../components/Page';
import { useSingleFileInput } from '../../hooks/useSingleFileInput';
import { useInstallApp } from './hooks/useInstallApp';

const PLACEHOLDER_URL = 'https://rocket.chat/apps/package.zip';

const AppInstallPage = () => {
	const t = useTranslation();
	const router = useRouter();

	const queryUrl = useSearchParameter('url');

	const { control, setValue, watch } = useForm<{ file: File; url: string }>({ defaultValues: { url: queryUrl || '' } });
	const { file, url } = watch();
	const { install, isInstalling } = useInstallApp(file, url);

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

	const urlField = useUniqueId();
	const fileField = useUniqueId();

	return (
		<Page flexDirection='column'>
			<PageHeader title={t('App_Installation')} />
			<PageScrollableContent>
				<FieldGroup display='flex' flexDirection='column' alignSelf='center' maxWidth='x600' w='full'>
					<Field>
						<Callout type='warning' title={t('App_Installation_Deprecation')} />
						<FieldLabel htmlFor={urlField}>{t('App_Url_to_Install_From')}</FieldLabel>
						<FieldRow>
							<Controller
								name='url'
								control={control}
								render={({ field }) => (
									<TextInput id={urlField} placeholder={PLACEHOLDER_URL} addon={<Icon name='permalink' size='x20' />} {...field} />
								)}
							/>
						</FieldRow>
					</Field>
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
							<Button disabled={!url || !file?.name} loading={isInstalling} onClick={install}>
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
