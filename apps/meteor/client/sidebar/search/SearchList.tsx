import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Sidebar, TextInput, Box, Icon } from '@rocket.chat/fuselage';
import { useEffectEvent, useDebouncedValue, useAutoFocus, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useUserPreference, useUserSubscriptions, useSetting, useTranslation, useMethod } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, MutableRefObject, SetStateAction, Dispatch, FormEventHandler, Ref, MouseEventHandler, FormEvent } from 'react';
import { forwardRef, useState, useMemo, useEffect, useRef, useId } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import tinykeys from 'tinykeys';

import Row from './Row';
import { VirtualizedScrollbars } from '../../components/CustomScrollbars';
import { getConfig } from '../../lib/utils/getConfig';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

const mobileCheck = function () {
	let check = false;
	(function (a: string) {
		if (
			/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
				a,
			) ||
			/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
				a.substr(0, 4),
			)
		)
			check = true;
	})(navigator.userAgent || navigator.vendor || window.opera || '');
	return check;
};

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		opera?: string;
	}
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Navigator {
		userAgentData?: {
			mobile: boolean;
		};
	}
}

const shortcut = ((): string => {
	if (navigator.userAgentData?.mobile || mobileCheck()) {
		return '';
	}
	if (window.navigator.platform.toLowerCase().includes('mac')) {
		return '(\u2318+K)';
	}
	return '(Ctrl+K)';
})();

const LIMIT = parseInt(String(getConfig('Sidebar_Search_Spotlight_LIMIT', 20)));

const options = {
	sort: {
		lm: -1,
		name: 1,
	},
	limit: LIMIT,
} as const;

const useSearchItems = (filterText: string): UseQueryResult<(ISubscription & IRoom)[] | undefined, Error> => {
	const [, mention, name] = useMemo(() => filterText.match(/(@|#)?(.*)/i) || [], [filterText]);
	const query = useMemo(() => {
		const filterRegex = new RegExp(escapeRegExp(name), 'i');

		return {
			$or: [{ name: filterRegex }, { fname: filterRegex }],
			...(mention && {
				t: mention === '@' ? 'd' : { $ne: 'd' },
			}),
		};
	}, [name, mention]);

	const localRooms = useUserSubscriptions(query, options);

	const usernamesFromClient = [...localRooms?.map(({ t, name }) => (t === 'd' ? name : null))].filter(Boolean) as string[];

	const searchForChannels = mention === '#';
	const searchForDMs = mention === '@';

	const type = useMemo(() => {
		if (searchForChannels) {
			return { users: false, rooms: true, includeFederatedRooms: true };
		}
		if (searchForDMs) {
			return { users: true, rooms: false };
		}
		return { users: true, rooms: true, includeFederatedRooms: true };
	}, [searchForChannels, searchForDMs]);

	const getSpotlight = useMethod('spotlight');

	return useQuery({
		queryKey: ['sidebar/search/spotlight', name, usernamesFromClient, type, localRooms.map(({ _id, name }) => _id + name)],

		queryFn: async () => {
			if (localRooms.length === LIMIT) {
				return localRooms;
			}

			const spotlight = await getSpotlight(name, usernamesFromClient, type);

			const filterUsersUnique = ({ _id }: { _id: string }, index: number, arr: { _id: string }[]): boolean =>
				index === arr.findIndex((user) => _id === user._id);

			const roomFilter = (room: { t: string; uids?: string[]; _id: string; name?: string }): boolean =>
				!localRooms.find(
					(item) =>
						(room.t === 'd' && room.uids && room.uids.length > 1 && room.uids?.includes(item._id)) ||
						[item.rid, item._id].includes(room._id),
				);
			const usersFilter = (user: { _id: string }): boolean =>
				!localRooms.find((room) => room.t === 'd' && room.uids && room.uids?.length === 2 && room.uids.includes(user._id));

			const userMap = (user: {
				_id: string;
				name: string;
				username: string;
				avatarETag?: string;
			}): {
				_id: string;
				t: string;
				name: string;
				fname: string;
				avatarETag?: string;
			} => ({
				_id: user._id,
				t: 'd',
				name: user.username,
				fname: user.name,
				avatarETag: user.avatarETag,
			});

			type resultsFromServerType = {
				_id: string;
				t: string;
				name: string;
				teamMain?: boolean;
				fname?: string;
				avatarETag?: string | undefined;
				uids?: string[] | undefined;
			}[];

			const resultsFromServer: resultsFromServerType = [];
			resultsFromServer.push(...spotlight.users.filter(filterUsersUnique).filter(usersFilter).map(userMap));
			resultsFromServer.push(...spotlight.rooms.filter(roomFilter));

			const exact = resultsFromServer?.filter((item) => [item.name, item.fname].includes(name));
			return Array.from(new Set([...exact, ...localRooms, ...resultsFromServer]));
		},

		staleTime: 60_000,
		placeholderData: (previousData) => previousData ?? localRooms,
	});
};

const useInput = (initial: string): { value: string; onChange: FormEventHandler; setValue: Dispatch<SetStateAction<string>> } => {
	const [value, setValue] = useState(initial);
	const onChange = useEffectEvent((e: FormEvent<HTMLInputElement>) => {
		setValue(e.currentTarget.value);
	});
	return { value, onChange, setValue };
};

const toggleSelectionState = (next: HTMLElement, current: HTMLElement | undefined, input: HTMLElement | undefined): void => {
	input?.setAttribute('aria-activedescendant', next.id);
	next.setAttribute('aria-selected', 'true');
	next.classList.add('rcx-sidebar-item--selected');
	if (current) {
		current.removeAttribute('aria-selected');
		current.classList.remove('rcx-sidebar-item--selected');
	}
};

/**
 * @type import('react').ForwardRefExoticComponent<{ onClose: unknown } & import('react').RefAttributes<HTMLElement>>
 */

type SearchListProps = {
	onClose: () => void;
};

const SearchList = forwardRef(function SearchList({ onClose }: SearchListProps, ref): ReactElement {
	const listId = useId();
	const t = useTranslation();
	const { setValue: setFilterValue, ...filter } = useInput('');

	const cursorRef = useRef<HTMLInputElement>(null);
	const autofocus: Ref<HTMLInputElement> = useMergedRefs(useAutoFocus<HTMLInputElement>(), cursorRef);

	const listRef = useRef<VirtuosoHandle>(null);
	const boxRef = useRef<HTMLDivElement>(null);

	const selectedElement: MutableRefObject<HTMLElement | null | undefined> = useRef(null);
	const itemIndexRef = useRef(0);

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const useRealName = useSetting('UI_Use_Real_Name');

	const sideBarItemTemplate = useTemplateByViewMode();
	const avatarTemplate = useAvatarTemplate();

	const extended = sidebarViewMode === 'extended';

	const filterText = useDebouncedValue(filter.value, 100);

	const placeholder = [t('Search'), shortcut].filter(Boolean).join(' ');

	const { data: items = [], isLoading } = useSearchItems(filterText);

	const itemData = useMemo(
		() => ({
			items,
			t,
			SideBarItemTemplate: sideBarItemTemplate,
			avatarTemplate,
			useRealName,
			extended,
			sidebarViewMode,
		}),
		[avatarTemplate, extended, items, useRealName, sideBarItemTemplate, sidebarViewMode, t],
	);

	const changeSelection = useEffectEvent((dir: 'up' | 'down') => {
		let nextSelectedElement = null;

		if (dir === 'up') {
			const potentialElement = selectedElement.current?.parentElement?.previousSibling as HTMLElement;
			if (potentialElement) {
				nextSelectedElement = potentialElement.querySelector('a');
			}
		} else {
			const potentialElement = selectedElement.current?.parentElement?.nextSibling as HTMLElement;
			if (potentialElement) {
				nextSelectedElement = potentialElement.querySelector('a');
			}
		}

		if (nextSelectedElement) {
			toggleSelectionState(nextSelectedElement, selectedElement.current || undefined, cursorRef?.current || undefined);
			return nextSelectedElement;
		}
		return selectedElement.current;
	});

	const resetCursor = useEffectEvent(() => {
		setTimeout(() => {
			itemIndexRef.current = 0;
			listRef.current?.scrollToIndex({ index: itemIndexRef.current });
			selectedElement.current = boxRef.current?.querySelector('a.rcx-sidebar-item');
			if (selectedElement.current) {
				toggleSelectionState(selectedElement.current, undefined, cursorRef?.current || undefined);
			}
		}, 0);
	});

	usePreventDefault(boxRef);

	useEffect(() => {
		resetCursor();
	});

	useEffect(() => {
		resetCursor();
	}, [filterText, resetCursor]);

	useEffect(() => {
		if (!cursorRef?.current) {
			return;
		}
		return tinykeys(cursorRef?.current, {
			Escape: (event) => {
				event.preventDefault();
				setFilterValue((value) => {
					if (!value) {
						onClose();
					}
					resetCursor();
					return '';
				});
			},
			Tab: onClose,
			ArrowUp: () => {
				const currentElement = changeSelection('up');
				itemIndexRef.current = Math.max(itemIndexRef.current - 1, 0);
				listRef.current?.scrollToIndex({ index: itemIndexRef.current });
				selectedElement.current = currentElement;
			},
			ArrowDown: () => {
				const currentElement = changeSelection('down');
				itemIndexRef.current = Math.min(itemIndexRef.current + 1, items.length + 1);
				listRef.current?.scrollToIndex({ index: itemIndexRef.current });
				selectedElement.current = currentElement;
			},
			Enter: (event) => {
				event.preventDefault();
				if (selectedElement.current && items.length > 0) {
					selectedElement.current.click();
				} else {
					onClose();
				}
			},
		});
	}, [cursorRef, changeSelection, items.length, onClose, resetCursor, setFilterValue]);

	const handleClick: MouseEventHandler<HTMLElement> = (e): void => {
		if (e.target instanceof Element && [e.target.tagName, e.target.parentElement?.tagName].includes('BUTTON')) {
			return;
		}
		return onClose();
	};

	return (
		<Box
			position='absolute'
			rcx-sidebar
			h='full'
			display='flex'
			flexDirection='column'
			zIndex={99}
			w='full'
			className={css`
				left: 0;
				top: 0;
			`}
			ref={ref}
			role='search'
		>
			<Sidebar.TopBar.Section {...({ flexShrink: 0 } as any)} is='form'>
				<Box mb='x12' w='full'>
					<TextInput
						aria-owns={listId}
						data-qa='sidebar-search-input'
						ref={autofocus}
						{...filter}
						placeholder={placeholder}
						role='searchbox'
						addon={<Icon name='cross' size='x20' onClick={onClose} />}
					/>
				</Box>
			</Sidebar.TopBar.Section>
			<Box
				ref={boxRef}
				role='listbox'
				id={listId}
				tabIndex={-1}
				flexShrink={1}
				h='full'
				w='full'
				data-qa='sidebar-search-result'
				aria-live='polite'
				aria-atomic='true'
				aria-busy={isLoading}
				onClick={handleClick}
			>
				<VirtualizedScrollbars>
					<Virtuoso
						style={{ height: '100%', width: '100%' }}
						totalCount={items.length}
						data={items}
						computeItemKey={(_, room) => room._id}
						itemContent={(_, data): ReactElement => <Row data={itemData} item={data} />}
						ref={listRef}
					/>
				</VirtualizedScrollbars>
			</Box>
		</Box>
	);
});

export default SearchList;
