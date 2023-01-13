import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { Link } from '@rocket.chat/layout';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

function AppInstallationModal({ currentEnabledApps, enabledAppsLimit }: { currentEnabledApps: number; enabledAppsLimit: number }) {
	const t = useTranslation();

	const appLimitStatus: string =
		// eslint-disable-next-line no-nested-ternary
		currentEnabledApps < enabledAppsLimit ? 'regular' : currentEnabledApps === enabledAppsLimit ? 'reached' : 'exceeded';

	const modalCreator = (appLimitStatus: string) => {
		switch (appLimitStatus) {
			case 'regular':
				return {
					// TODO: fix translation and button clicks
					modalTitle: `${currentEnabledApps} of ${enabledAppsLimit} private apps enabled`,
					modalContent: `${'Workspaces on Community Edition can have up to 3 private apps enabled.\nUpgrade to Enterprise to enable unlimited apps.'}`,
					buttonContent: (
						<Button
							primary
							onClick={() => {
								console.log('click');
							}}
						>
							{t('Next')}
						</Button>
					),
				};

			case 'reached':
				return {
					// TODO: fix translation
					modalTitle: `${t('Private app limit reached')}`,
					modalContent: (
						<>
							<Box fontWeight='p2b'>
								{`${currentEnabledApps} of ${enabledAppsLimit} apps currently enabled.`}
								<Box mb='x16'>{`\nWorkspaces on Community Edition can have up to ${enabledAppsLimit} private apps enabled.`}</Box>
							</Box>

							<Box mb='x16'>
								<Box fontWeight='p2b' mi='x2'>
									{t('This app will be disabled by default.')}
								</Box>
								{t('Disable another app or upgrade to Enterprise to enable this app.')}
							</Box>
						</>
					),
					buttonContent: (
						<Button
							secondary
							onClick={() => {
								console.log('click');
							}}
						>
							{t('Upload anyway')}
						</Button>
					),
				};

			default:
				return {
					modalTitle: `${t('App limit exceeded')}`,
					modalContent: (
						<>
							<Box fontWeight='p2b'>{`${currentEnabledApps} of ${enabledAppsLimit} apps currently enabled.`}</Box>
							{t('Community edition app limit has been exceeded.')}
							<Box mb='x16'>{`Workspaces on Community Edition can have up to ${enabledAppsLimit} private apps enabled.`}</Box>
							<Box mb='x16'>
								<Box fontWeight='p2b' mi='x2'>
									{t('This app will be disabled by default.')}
								</Box>
								{`This app will be disabled by default. You will need to disable at least ${
									currentEnabledApps - enabledAppsLimit
								} other apps or upgrade to Enterprise to enable the
								this app.`}
							</Box>
						</>
					),
					buttonContent: (
						<Button
							secondary
							onClick={() => {
								console.log('click');
							}}
						>
							{t('Upload anyway')}
						</Button>
					),
				};
		}
	};

	return (
		<>
			<Modal>
				<Modal.Header>
					<Modal.HeaderText>
						<Modal.Title>{modalCreator(appLimitStatus).modalTitle}</Modal.Title>
					</Modal.HeaderText>
					<Modal.Close />
				</Modal.Header>

				<Modal.Content>{modalCreator(appLimitStatus).modalContent}</Modal.Content>

				<Modal.Footer justifyContent='space-between'>
					<Modal.FooterAnnotation>
						<Link href='#' color='font-on-info'>
							{t('Learn_more')}
						</Link>
					</Modal.FooterAnnotation>
					<Modal.FooterControllers>
						<Button>{t('Enable unlimited apps')}</Button>
						{modalCreator(appLimitStatus).buttonContent}
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		</>
	);
}

export default AppInstallationModal;
