import { Box, Table, Tag } from '@rocket.chat/fuselage';
import React, { FC, useState, memo, KeyboardEvent, MouseEvent } from 'react';

import AppAvatar from '../../../components/avatar/AppAvatar';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import AppMenu from './AppMenu';
import AppStatus from './AppStatus';
import { App } from './types';

type AppRowProps = App & {
	medium: boolean;
	large: boolean;
};

const AppRow: FC<AppRowProps> = ({ medium, ...props }) => {
	const {
		author: { name: authorName },
		name,
		id,
		description,
		categories,
		iconFileData,
		marketplaceVersion,
		iconFileContent,
		installed,
	} = props;
	const t = useTranslation();

	const [isFocused, setFocused] = useState(false);
	const [isHovered, setHovered] = useState(false);
	const isStatusVisible = isFocused || isHovered;

	const appsRoute = useRoute('admin-apps');

	const handleClick = (): void => {
		appsRoute.push({
			context: 'details',
			version: marketplaceVersion,
			id,
		});
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLOrSVGElement>): void => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	};

	const preventClickPropagation = (e: MouseEvent<HTMLOrSVGElement>): void => {
		e.stopPropagation();
	};

	return (
		<Table.Row
			key={id}
			role='link'
			action
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onFocus={(): void => setFocused(true)}
			onBlur={(): void => setFocused(false)}
			onMouseEnter={(): void => setHovered(true)}
			onMouseLeave={(): void => setHovered(false)}
		>
			<Table.Cell withTruncatedText display='flex' flexDirection='row'>
				<AppAvatar size='x40' mie='x8' alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData} />
				<Box display='flex' flexDirection='column' alignSelf='flex-start'>
					<Box color='default' fontScale='p2m'>
						{name}
					</Box>
					<Box color='default' fontScale='p2m'>{`${t('By')} ${authorName}`}</Box>
				</Box>
			</Table.Cell>
			{medium && (
				<Table.Cell>
					<Box display='flex' flexDirection='column'>
						<Box color='default' withTruncatedText>
							{description}
						</Box>
						{categories && (
							<Box color='hint' display='flex' flex-direction='row' withTruncatedText>
								{categories.map((current) => (
									<Box mie='x4' key={current}>
										<Tag disabled>{current}</Tag>
									</Box>
								))}
							</Box>
						)}
					</Box>
				</Table.Cell>
			)}
			<Table.Cell withTruncatedText>
				<Box display='flex' flexDirection='row' alignItems='center' marginInline='neg-x8' onClick={preventClickPropagation}>
					<AppStatus app={props} showStatus={isStatusVisible} marginInline='x8' />
					{installed && <AppMenu app={props} invisible={!isStatusVisible} marginInline='x8' />}
				</Box>
			</Table.Cell>
		</Table.Row>
	);
};

export default memo(AppRow);
