// import React, { FC, useState, useMemo, useEffect } from 'react';
// import { Avatar, Sidebar, ActionButton } from '@rocket.chat/fuselage';

// import { CallContext } from '../contexts/CallContext';

// const avatar = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z';

// const VARIATIONS = {
// 	success: { primary: true, success: true },
// 	danger: { primary: true, danger: true },
// 	normal: { },
// };


// export const CallProvider: FC = ({ children }) => {
// 	const [calls, setCalls] = useState([]);

// 	const value = useMemo(() => ({
// 		calls,
// 	}), [calls]);

// 	useEffect(() => {
// 		// do whatever you want here...
// 		setCalls([{
// 			id: 'call1',
// 			name: 'Guilherme Gazzo',
// 			icon: 'lock',
// 			avatar,
// 			actions: [
// 				{
// 					icon: 'phone',
// 					label: 'Call',
// 					callback: () => alert('Call'),
// 					variation: 'normal',
// 				},
// 				{
// 					icon: 'phone',
// 					label: 'Call',
// 					callback: () => alert('Call'),
// 					variation: 'success',
// 				},
// 				{
// 					icon: 'circle-cross',
// 					label: 'End Call',
// 					callback: () => alert('End Call'),
// 					variation: 'danger',
// 				},
// 			],
// 		},
// 		{
// 			id: 'call2',
// 			name: 'Guilherme Gazzo 2',
// 			icon: 'lock',
// 			avatar,
// 			actions: [
// 				{
// 					icon: 'phone',
// 					label: 'Call',
// 					callback: () => alert('Call'),
// 					variation: 'normal',
// 				},
// 				{
// 					icon: 'phone',
// 					label: 'Call',
// 					callback: () => alert('Call'),
// 					variation: 'success',
// 				},
// 				{
// 					icon: 'circle-cross',
// 					label: 'End Call',
// 					callback: () => alert('End Call'),
// 					variation: 'danger',
// 				},
// 			],
// 			render: (call): FC => <Sidebar.Item clickable data-call-id={call.id} key={call.id}>
// 				<Sidebar.Item.Avatar>
// 					<Avatar size='x28' url={call.avatar}/>
// 				</Sidebar.Item.Avatar>
// 				<Sidebar.Item.Content>
// 					{ call.icon && <Sidebar.Item.Icon name={call.icon}/> }
// 					<Sidebar.Item.Title>{call.name}</Sidebar.Item.Title>
// 				</Sidebar.Item.Content>
// 				{call.actions && <Sidebar.Item.Container>
// 					<Sidebar.Item.Actions>
// 						{call.actions.map((action, index) =>
// 							<ActionButton {...VARIATIONS[action.variation]}
// 								key={index}
// 								disabled={action.disabled}
// 								onClick={action.callback}
// 								title={action.label}
// 								icon={action.icon}/>)}
// 					</Sidebar.Item.Actions>
// 				</Sidebar.Item.Container>}
// 			</Sidebar.Item>,
// 		},
// 		]);
// 	}, []);

// 	return <CallContext.Provider
// 		children={children}
// 		value={value}
// 	/>;
// };
