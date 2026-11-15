import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import CardList from './CardList';
import CardListSection from './CardListSection';
import { PeerCard } from './PeerCard';
import { StreamCard } from './StreamCard';

const avatarUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC
              4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMj
              IyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAA
              AAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAg
              MREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6L
              xqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVr
              jbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRk
              eX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef
              6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkB
              SuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlP
              UH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z`;

export default {
	component: CardList,
	decorators: [
		(Story) => (
			<Box width={700} height={400} border='1px solid' borderColor='stroke-light' overflow='hidden'>
				<CardListSection>
					<Story />
				</CardListSection>
			</Box>
		),
	],
} satisfies Meta<typeof CardList>;

export const CardListStory: StoryObj<typeof CardList> = {
	render: (args) => (
		<CardList {...args}>
			<PeerCard displayName='John Doe 0' avatarUrl={avatarUrl} muted={false} held={true} />
			<PeerCard displayName='John Doe 1' avatarUrl={avatarUrl} muted={true} held={false} />
			<PeerCard displayName='John Doe 2' avatarUrl={avatarUrl} muted={true} held={true} />
			<PeerCard displayName='John Doe 3' avatarUrl={avatarUrl} muted={false} held={false} />
		</CardList>
	),
};

export const StreamCardListStory: StoryObj<typeof CardList> = {
	render: (args) => (
		<CardList {...args}>
			<StreamCard own focused autoHeight onClickFocusStream={() => undefined} onClickStopSharing={() => undefined}>
				<Box width='100%' height='100%' minHeight={120}>
					test
				</Box>
			</StreamCard>
			<StreamCard onClickFocusStream={() => undefined} onClickStopSharing={() => undefined}>
				<Box width='100%' height='100%' minHeight={120}>
					test
				</Box>
			</StreamCard>
			<StreamCard own onClickFocusStream={() => undefined} onClickStopSharing={() => undefined}>
				<Box width='100%' height='100%' minHeight={120}>
					test
				</Box>
			</StreamCard>
			<StreamCard onClickFocusStream={() => undefined} onClickStopSharing={() => undefined}>
				<Box width='100%' height='100%' minHeight={120}>
					test
				</Box>
			</StreamCard>
		</CardList>
	),
};
