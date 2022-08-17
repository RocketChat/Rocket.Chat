import { useRoute, useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type CMSPageProps = {
	page: 'Layout_Terms_of_Service' | 'Layout_Privacy_Policy' | 'Layout_Legal_Notice';
};

const CMSPage = ({ page }: CMSPageProps): ReactElement => {
	const homeRoute = useRoute('/');
	const pageContent = useSetting(page) as string;

	const handlePageCloseClick = (): void => {
		homeRoute.push();
	};

	return (
		<main id='rocket-chat'>
			<div className='main-content cms-page'>
				<div className='container cms-page content-background-color'>
					<div className='cms-page-close' onClick={handlePageCloseClick}>
						<button className='rc-button rc-button--nude'>
							<i className='icon-cancel'></i>
						</button>
					</div>
					<div className='cms-page__content' dangerouslySetInnerHTML={{ __html: pageContent }} />
				</div>
			</div>
		</main>
	);
};

export default CMSPage;
