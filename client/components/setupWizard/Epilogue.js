import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useSetting } from '../../hooks/useSetting';
import { Button } from '../basic/Button';
import { setSetting } from './functions';
import './Epilogue.css';

const Container = (props) => <section className='SetupWizard__Epilogue' {...props} />;

const Header = (props) => <header className='SetupWizard__Epilogue-header' {...props} />;

const HeaderLogo = (props) => <img className='SetupWizard__Epilogue-headerLogo' src='images/logo/logo.svg' {...props} />;

const Content = (props) => <main className='SetupWizard__Epilogue-content' {...props} />;

const Subtitle = (props) => <span className='SetupWizard__Epilogue-runningHead' {...props} />;

const Title = (props) => <h1 className='SetupWizard__Epilogue-title' {...props} />;

const LinkLabel = (props) => <span className='SetupWizard__Epilogue-linkLabel' {...props} />;

const Link = (props) => <span className='SetupWizard__Epilogue-link' {...props} />;

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
