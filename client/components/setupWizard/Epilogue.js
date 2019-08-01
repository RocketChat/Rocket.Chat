import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useSetting } from '../../hooks/useSetting';
import { Button } from '../basic/Button';
import { settings } from '../../../app/settings/lib/settings';

const Container = (props) => <section className='setup-wizard-final' {...props} />;

const Header = (props) => <header className='setup-wizard-info__header setup-wizard-final__header' {...props} />;

const HeaderLogo = (props) => <img className='setup-wizard-info__header-logo' src='images/logo/logo.svg' {...props} />;

const Content = (props) => <main className='setup-wizard-final__box' {...props} />;

const Subtitle = (props) => <span className='setup-wizard-forms__header-step' {...props} />;

const Title = (props) => <h1 className='setup-wizard-info__content-title setup-wizard-final__box-title' {...props} />;

const LinkLabel = (props) => <span className='setup-wizard-final__link-text' {...props} />;

const Link = (props) => <span className='setup-wizard-final__link' {...props} />;

const setSetting = (_id, value) => new Promise((resolve, reject) => settings.set(_id, value, (error) => {
	if (error) {
		reject(error);
		return;
	}

	resolve();
}));

export function Epilogue() {
	const t = useTranslation();
	const siteUrl = useSetting('Site_Url');

	const handleClick = () => {
		setSetting('Show_Setup_Wizard', 'completed');
	};

	return <Container>
		<Header>
			<HeaderLogo />
		</Header>

		<Content>
			<Subtitle>{t('Launched_successfully')}</Subtitle>
			<Title>{t('Your_workspace_is_ready')}</Title>
			<LinkLabel>{t('Your_server_link')}</LinkLabel>
			<Link>{siteUrl}</Link>
			<Button primary onClick={handleClick}>
				{t('Go_to_your_workspace')}
			</Button>
		</Content>
	</Container>;
}
