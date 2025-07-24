import { Box, Button, ButtonGroup, Divider, IconButton } from '@rocket.chat/fuselage';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PeerInfo, type PeerInfoProps } from '../components';
import PeerAutocomplete from '../components/PeerAutocomplete';
import type { PeerAutocompleteOptions } from '../components/PeerAutocomplete';
import { Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent } from '../components/Widget';

const useSelectedPeer = (data: PeerAutocompleteOptions[], value?: string): PeerInfoProps | undefined => {
	const existingPeer = data.find((peer) => peer.value === value);

	if (!value) {
		return undefined;
	}

	// TODO: Consume from context and loading state
	if (existingPeer) {
		return {
			name: existingPeer.label,
			avatarUrl: existingPeer.avatarUrl || '',
			identifier: existingPeer.identifier || '',
		};
	}

	return {
		number: value,
	};
};
const avatarUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z`;

const myData: any[] = Array.from({ length: 100 }, (_, i) => ({ value: `user-${i}`, label: `User ${i}`, identifier: `000${i}`, avatarUrl }));

const usePeerAutocompleteOptions = (filter: string) => {
	const data = useMemo(() => {
		const options = myData.filter((item) => item.label.toLowerCase().includes(filter.toLowerCase()));
		return options;
	}, [filter]);

	// TODO: Consume from context and loading state
	return {
		data,
	};
};

const NewCall = () => {
	const { t } = useTranslation();

	const [filter, setFilter] = useState('');
	const [selected, setSelected] = useState<string | undefined>();
	const { data } = usePeerAutocompleteOptions(filter);

	const peerInfo = useSelectedPeer(data, selected);
	console.log(peerInfo);

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={t('New_Call')}>
				<IconButton name='close' icon='cross' small />
			</WidgetHeader>
			<WidgetContent>
				<PeerAutocomplete data={data} onChangeValue={(v) => setSelected(v)} onChangeFilter={setFilter} />
				{peerInfo && (
					<>
						<Divider />
						<Box mbe={8}>
							<PeerInfo {...peerInfo} />
						</Box>
					</>
				)}
			</WidgetContent>
			<WidgetFooter>
				<ButtonGroup stretch>
					<IconButton medium name='dialpad' icon='dialpad' flexGrow={0} secondary />
					<IconButton medium name='customize' icon='customize' flexGrow={0} secondary />
					<Button medium name='phone' icon='phone' success flexGrow={1}>
						{t('Call')}
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default NewCall;
