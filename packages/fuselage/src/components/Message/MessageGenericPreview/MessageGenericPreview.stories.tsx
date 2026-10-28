import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { Avatar } from '../../Avatar';
import { Box } from '../../Box';
import Message from '../Message';
import MessageBlock from '../MessageBlock';
import MessageBody from '../MessageBody';
import MessageContainer from '../MessageContainer';
import MessageHeader from '../MessageHeader';
import MessageLeftContainer from '../MessageLeftContainer';
import MessageName from '../MessageName';
import MessageNameContainer from '../MessageNameContainer';
import MessageRole from '../MessageRole';
import MessageTimestamp from '../MessageTimestamp';
import MessageUsername from '../MessageUsername';
import MessageGenericPreview from './MessageGenericPreview';
import MessageGenericPreviewContent from './MessageGenericPreviewContent';
import MessageGenericPreviewCoverImage from './MessageGenericPreviewCoverImage';
import MessageGenericPreviewDescription from './MessageGenericPreviewDescription';
import MessageGenericPreviewIcon from './MessageGenericPreviewIcon';
import MessageGenericPreviewImage from './MessageGenericPreviewImage';
import MessageGenericPreviewThumb from './MessageGenericPreviewThumb';
import MessageGenericPreviewTitle from './MessageGenericPreviewTitle';

export default {
	title: 'Message/MessageGenericPreview',
	component: MessageGenericPreview,
	decorators: [
		(storyFn: () => ReactNode) => (
			<Box>
				<Message>
					<MessageLeftContainer>
						<Avatar
							url='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC
                4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMj
                IyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAA
                AAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAg
                MREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6L
                xqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVr
                jbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRk
                eX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef
                6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkB
                SuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlP
                UH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z'
							size='x36'
						/>
					</MessageLeftContainer>
					<MessageContainer>
						<MessageHeader>
							<MessageNameContainer>
								<MessageName>Haylie George</MessageName> <MessageUsername>@haylie.george</MessageUsername>
							</MessageNameContainer>
							<MessageRole>Admin</MessageRole>
							<MessageRole>User</MessageRole>
							<MessageRole>Owner</MessageRole>
							<MessageTimestamp>12:00 PM</MessageTimestamp>
						</MessageHeader>
						<MessageBody>
							<MessageBlock> {storyFn()}</MessageBlock>
						</MessageBody>
					</MessageContainer>
				</Message>
			</Box>
		),
	],
	argTypes: {
		children: {
			control: false,
			description:
				'Preview content, composed from MessageGenericPreview subcomponents (cover image, content, title, description, thumbnail, icon).',
			table: { category: 'Content' },
		},
		style: {
			control: false,
			description: 'Inline CSS styles applied to the root element.',
			table: { category: 'Style' },
		},
	},
} satisfies Meta<typeof MessageGenericPreview>;

type Story = StoryObj<typeof MessageGenericPreview>;

const imgUrl =
	'data:image/png;base64,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';

export const Default: Story = {
	render: () => (
		<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
			<MessageGenericPreviewCoverImage height={192} width={368} url={imgUrl} />
			<MessageGenericPreviewContent>
				<MessageGenericPreviewTitle title='Title'>Title</MessageGenericPreviewTitle>
				<MessageGenericPreviewDescription clamp>
					From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything
					at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve
					packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience o...
				</MessageGenericPreviewDescription>
			</MessageGenericPreviewContent>
		</MessageGenericPreview>
	),
};

export const ImagePreview: Story = {
	render: () => (
		<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
			<MessageGenericPreviewImage url={imgUrl} />
		</MessageGenericPreview>
	),
};

export const LinkPreview: Story = {
	render: () => (
		<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
			<MessageGenericPreviewCoverImage height={192} width={368} url={imgUrl} />
			<MessageGenericPreviewContent>
				<MessageGenericPreviewTitle externalUrl='https://rocket.chat'>Title</MessageGenericPreviewTitle>
				<MessageGenericPreviewDescription>
					From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything
					at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve
					packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience o...
				</MessageGenericPreviewDescription>
			</MessageGenericPreviewContent>
		</MessageGenericPreview>
	),
};

export const NoPreview: Story = {
	render: () => (
		<MessageGenericPreview>
			<MessageGenericPreviewContent>
				<MessageGenericPreviewTitle>Title</MessageGenericPreviewTitle>
				<MessageGenericPreviewDescription>
					From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything
					at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve
					packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience o...
				</MessageGenericPreviewDescription>
			</MessageGenericPreviewContent>
		</MessageGenericPreview>
	),
};

export const NoPreviewTitleLink: Story = {
	render: () => (
		<MessageGenericPreview>
			<MessageGenericPreviewContent>
				<MessageGenericPreviewTitle externalUrl='https://rocket.chat'>Title</MessageGenericPreviewTitle>
				<MessageGenericPreviewDescription>
					From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything
					at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve
					packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience o...
				</MessageGenericPreviewDescription>
			</MessageGenericPreviewContent>
		</MessageGenericPreview>
	),
};

export const Thumb: Story = {
	render: () => (
		<MessageGenericPreview>
			<MessageGenericPreviewContent
				thumb={
					<MessageGenericPreviewThumb>
						<MessageGenericPreviewCoverImage height={192} width={368} url={imgUrl} />
					</MessageGenericPreviewThumb>
				}
			>
				<MessageGenericPreviewTitle externalUrl='https://rocket.chat'>Title</MessageGenericPreviewTitle>
				<MessageGenericPreviewDescription>
					From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything
					at Google runs in containers. We’ve packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve
					packaged this experience From Gmail to YouTube, everything at Google runs in containers. We’ve packaged this experience o...
				</MessageGenericPreviewDescription>
			</MessageGenericPreviewContent>
		</MessageGenericPreview>
	),
};

export const FileAttachment: Story = {
	render: () => (
		<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
			<MessageGenericPreviewContent thumb={<MessageGenericPreviewIcon name='attachment-file' type='PDF' />}>
				<MessageGenericPreviewTitle externalUrl='https://rocket.chat'>
					Flexbox In a Nutshell - Cheat Sheet - Lorem ipsum dolor sit amet consectetur
				</MessageGenericPreviewTitle>
				<MessageGenericPreviewDescription>9 MB - PDF</MessageGenericPreviewDescription>
			</MessageGenericPreviewContent>
		</MessageGenericPreview>
	),
};
