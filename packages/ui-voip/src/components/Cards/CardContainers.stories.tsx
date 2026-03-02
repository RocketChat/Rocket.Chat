import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentType } from 'react';

import CardListContainer from './CardListContainer';
import CardListSection from './CardListSection';
import PeerCard from './PeerCard';
// import GenericCard from './GenericCard';
// import PeerCard from './PeerCard';

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

type StoryComponentType = ComponentType<{
	getPeerCardProps: (index: number) => {
		displayName: string;
		avatarUrl: string;
		muted: boolean;
		held: boolean;
		sharing: boolean;
	};
}>;

export default {
	title: 'V2/Views/MediaCallRoomSection/CardContainers',
	component: CardListContainer,
	args: {
		getPeerCardProps: (index: number) => ({
			displayName: `John Doe ${index}`,
			avatarUrl,
			muted: index % 2 !== 0,
			held: index % 2 === 0,
			sharing: index % 2 !== 0,
		}),
	},
	decorators: [
		(Story) => (
			<Box width='700px' height='400px' border='1px solid' borderColor='stroke-light' overflow='hidden'>
				<CardListSection>
					<Story />
				</CardListSection>
			</Box>
		),
	],
} satisfies Meta<StoryComponentType>;

export const CardListContainerStory: StoryFn<StoryComponentType> = (args) => {
	return (
		<CardListContainer {...args}>
			<PeerCard {...args.getPeerCardProps(0)} />
			<PeerCard {...args.getPeerCardProps(1)} />
			<PeerCard {...args.getPeerCardProps(2)} />
			<PeerCard {...args.getPeerCardProps(3)} />
		</CardListContainer>
	);
};
