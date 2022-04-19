import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import { useLayout } from '../../contexts/LayoutContext';


const BlogPostSection = (props: typeof Box): ReactElement => {
    const { sidebar } = useLayout();

    const handleRoute = useMutableCallback(() => {
        sidebar.toggle();
    });

    // The className is a paliative while we make TopBar.ToolBox optional on fuselage
    return (
        <div onClick={handleRoute}>
            <Sidebar.TopBar.ToolBox className='omnichannel-sidebar' {...props}>
                <Sidebar.TopBar.Title>Blog Post</Sidebar.TopBar.Title>
                <Sidebar.TopBar.Action icon='chevron-left' />
            </Sidebar.TopBar.ToolBox>
        </div>

    );
};

export default BlogPostSection