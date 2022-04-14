import React from 'react'
import { Modal, Button, ButtonGroup, Box, Margins } from '@rocket.chat/fuselage';

// import * as nft1 from '@/public/images/blog_images/nft_blog_1.jpg'


type Props = {
    title: string,
    body: string
}

const BlogView = ({ title, body }: Props) => {
    return (
        <Margins block='15px'>
            <Modal height='400px' width='400px'>
                {/* <img src={nft1} alt='nft blog image' /> */}
                <Box height='160px' width='full' bg='primary-500-50'></Box>
                <Modal.Header>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Content>{body}</Modal.Content>
                <Modal.Footer>
                    <ButtonGroup align='end'>
                        <Button primary>Read More</Button>
                    </ButtonGroup>
                </Modal.Footer>
            </Modal>
        </Margins>

    )
}

export default BlogView