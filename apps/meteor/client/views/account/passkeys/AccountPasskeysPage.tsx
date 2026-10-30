import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { ContextualbarDialog, Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useTranslation } from 'react-i18next';

import PasskeyInfo from './PasskeyInfo';
import PasskeysTable from './PasskeysTable';
import { useAddPasskey } from './useAddPasskey';

const AccountPasskeysPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const context = useRouteParameter('context');
	const passkeyId = useRouteParameter('id');
	const addPasskey = useAddPasskey();

	const openPasskey = (id: string) => router.navigate({ name: 'passkeys', params: { context: 'info', id } });
	const closePasskey = () => router.navigate({ name: 'passkeys', params: {} });

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Passkeys')}>
					<ButtonGroup>
						<Button
							icon='plus'
							variant='primary'
							disabled={!browserSupportsWebAuthn()}
							loading={addPasskey.isPending}
							onClick={() => addPasskey.mutate()}
						>
							{t('Add_passkey')}
						</Button>
					</ButtonGroup>
				</PageHeader>
				<PageScrollableContentWithShadow>
					<PasskeysTable onOpen={openPasskey} />
				</PageScrollableContentWithShadow>
			</Page>
			{context === 'info' && passkeyId && (
				<ContextualbarDialog onClose={closePasskey}>
					<PasskeyInfo passkeyId={passkeyId} onClose={closePasskey} />
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default AccountPasskeysPage;
