import type { ISetting } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import { useToastMessageDispatch, useAbsoluteUrl, useMethod, useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { memo, useEffect, useState } from 'react';

import CreateOAuthModal from './CreateOAuthModal';
import { strRight } from '../../../../../../lib/utils/stringUtils';
import GenericModal from '../../../../../components/GenericModal';
import { useEditableSettingsGroupSections } from '../../../EditableSettingsContext';
import SettingsGroupPage from '../../SettingsGroupPage';
import SettingsSection from '../../SettingsSection';

type OAuthGroupPageProps = ISetting & {
	onClickBack?: () => void;
};

function OAuthGroupPage({ _id, onClickBack, ...group }: OAuthGroupPageProps): ReactElement {
	const sections = useEditableSettingsGroupSections(_id);
	const solo = sections.length === 1;
	const t = useTranslation();

	const [settingSections, setSettingSections] = useState(sections);

	const sectionIsCustomOAuth = (sectionName: string): string | boolean => sectionName && /^Custom OAuth:\s.+/.test(sectionName);

	const getAbsoluteUrl = useAbsoluteUrl();

	const callbackURL = (sectionName: string): string => {
		const id = strRight(sectionName, 'Custom OAuth: ').toLowerCase();
		return getAbsoluteUrl(`_oauth/${id}`);
	};

	const dispatchToastMessage = useToastMessageDispatch();
	const refreshOAuthService = useMethod('refreshOAuthService');
	const addOAuthService = useMethod('addOAuthService');
	const removeOAuthService = useMethod('removeOAuthService');
	const setModal = useSetModal();

	const handleRefreshOAuthServicesButtonClick = async (): Promise<void> => {
		dispatchToastMessage({ type: 'info', message: t('Refreshing') });
		try {
			await refreshOAuthService();
			dispatchToastMessage({ type: 'success', message: t('Done') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleAddCustomOAuthButtonClick = (): void => {
		const onConfirm = async (text: string): Promise<void> => {
			try {
				await addOAuthService(text);
				dispatchToastMessage({ type: 'success', message: t('Custom_OAuth_has_been_added') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};
		setModal(<CreateOAuthModal onConfirm={onConfirm} onClose={(): void => setModal(null)} />);
	};

	useEffect(() => {
		setSettingSections(sections);
	}, [sections]);

	const removeCustomOauthFactory =
		(id: string): (() => void) =>
		(): void => {
			const handleConfirm = async (): Promise<void> => {
				try {
					await removeOAuthService(id);
					dispatchToastMessage({ type: 'success', message: t('Custom_OAuth_has_been_removed') });
					setSettingSections(settingSections.filter((section) => section !== `Custom OAuth: ${capitalize(id)}`));
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				} finally {
					setModal(null);
				}
			};

			setModal(
				<GenericModal
					onClose={() => setModal(null)}
					onCancel={() => setModal(null)}
					title={t('Are_you_sure')}
					variant='danger'
					confirmText={t('Yes_delete_it')}
					onConfirm={handleConfirm}
				/>,
			);
		};

	return (
		<SettingsGroupPage
			_id={_id}
			{...group}
			onClickBack={onClickBack}
			headerButtons={
				<>
					<Button onClick={handleRefreshOAuthServicesButtonClick}>{t('Refresh_oauth_services')}</Button>
					<Button onClick={handleAddCustomOAuthButtonClick}>{t('Add_custom_oauth')}</Button>
				</>
			}
		>
			{settingSections.map((sectionName) => {
				if (sectionIsCustomOAuth(sectionName)) {
					const id = strRight(sectionName, 'Custom OAuth: ').toLowerCase();

					const handleRemoveCustomOAuthButtonClick = removeCustomOauthFactory(id);

					return (
						<SettingsSection
							key={sectionName}
							groupId={_id}
							help={
								<span
									dangerouslySetInnerHTML={{
										__html: DOMPurify.sanitize(t('Custom_oauth_helper', callbackURL(sectionName))),
									}}
								/>
							}
							sectionName={sectionName}
							solo={solo}
						>
							<div className='submit'>
								<Button secondary danger onClick={handleRemoveCustomOAuthButtonClick}>
									{t('Remove_custom_oauth')}
								</Button>
							</div>
						</SettingsSection>
					);
				}

				return <SettingsSection key={sectionName} groupId={_id} sectionName={sectionName} solo={solo} />;
			})}
		</SettingsGroupPage>
	);
}

export default memo(OAuthGroupPage);
