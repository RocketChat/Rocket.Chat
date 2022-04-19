import React, { ReactElement, useMemo } from 'react';
import { Flex } from '@rocket.chat/fuselage';

import BlazeTemplate from '../BlazeTemplate';
import AuthenticationCheck from './AuthenticationCheck';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';
import BlogView from '../../blog/BlogView';

type MainLayoutProps = {
	center?: string;
} & Record<string, unknown>;

const MainLayout = ({ center }: MainLayoutProps): ReactElement => {
	useCustomScript();

	return (
		<Preload>
			<AuthenticationCheck>
				{useMemo(
					() =>
						center ? (
							<>
								{/* <Flex.Container wrap='wrap' direction='row' justifyContent='start'>{blogData.map((blog, index) => (<Flex.Item key={index}><BlogView title={blog.title} body={blog.body} /></Flex.Item>))}</Flex.Container> */}
								<BlazeTemplate template={center} />
							</>
						) : null,
					[center],
				)}
			</AuthenticationCheck>
		</Preload>
	);
};

export default MainLayout;
