import { styled, Text, View, type GetProps } from '@tamagui/web';
import type { Dispatch, HTMLAttributes, SetStateAction } from 'react';
import { useId, useMemo } from 'react';

import { textIconColors } from '../../Theme';
import { renderAs } from '../../helpers/renderAs';
import { fontFamily, fontScale, spacing } from '../../styleTokens';
import { Chevron } from '../Chevron';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const c1 = fontScale('c1')!;

const c1Style = {
	fontSize: c1.fontSize,
	fontWeight: String(c1.fontWeight) as '400',
	lineHeight: c1.lineHeight,
	letterSpacing: c1.letterSpacing,
};

/** What `rcx-box rcx-box--full` used to give the nav, lists and buttons. */
const boxStyle = {
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	margin: 0,
	padding: 0,
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
} as const;

/** What a plain element keeps that Tamagui's base styles would change. */
const plainStyle = {
	boxSizing: 'content-box',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
} as const;

const PaginationFrame = styled(View, {
	render: 'nav',
	...boxStyle,
	flexDirection: 'column-reverse',
	flexWrap: 'nowrap',
	alignItems: 'center',
	paddingBlock: spacing('x12'),
	paddingInline: spacing('x24'),

	variants: {
		divider: {
			true: {
				position: 'relative',
			},
		},
	} as const,
});

const PaginationLeft = styled(View, {
	...plainStyle,
	flexDirection: 'row',
	flexWrap: 'nowrap',
	alignItems: 'center',
	justifyContent: 'center',
	marginInlineStart: 0,
});

const PaginationRight = styled(View, {
	...plainStyle,
	flexDirection: 'column',
	flexWrap: 'nowrap',
	alignItems: 'center',
	marginInlineStart: 0,
});

const PaginationLabel = styled(Text, {
	render: 'span',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	boxSizing: 'content-box',
	...c1Style,
	color: String(textIconColors['font-annotation']),
});

const PaginationList = styled(View, {
	render: 'ol',
	...boxStyle,
	flexDirection: 'row',
	flexWrap: 'nowrap',
	alignItems: 'center',
	marginInline: spacing('x4'),
});

const PaginationListItem = styled(Text, {
	render: 'li',
	...plainStyle,
	display: 'flex',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	...c1Style,
	marginInline: spacing('x2'),
	padding: spacing('x4'),
	color: String(textIconColors['font-secondary-info']),
});

const PaginationButton = styled(Text, {
	render: 'button',
	...boxStyle,
	display: 'inline-flex',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	...c1Style,
	cursor: 'pointer',
	color: String(textIconColors['font-info']),
	backgroundColor: 'transparent',

	variants: {
		arrow: {
			true: {
				color: String(textIconColors['font-secondary-info']),
			},
		},
	} as const,
});

type PaginationButtonProps = Omit<GetProps<typeof PaginationButton>, 'disabled'> & { disabled?: boolean };

// Given to the frame, `disabled` would also add an `aria-disabled` attribute the button never had
const PaginationButtonElement = ({ disabled, ...props }: PaginationButtonProps) => (
	<PaginationButton {...props} render={renderAs('button', { disabled })} />
);

export type ItemsPerPage = 25 | 50 | 100;

export type PaginationProps = {
	count: number;
	current?: number;
	divider?: boolean;
	itemsPerPage?: ItemsPerPage;
	itemsPerPageLabel?: (context: { count: number; current: number; itemsPerPage: ItemsPerPage }) => string;
	showingResultsLabel?: (context: { count: number; current: number; itemsPerPage: ItemsPerPage }) => string;
	onSetCurrent?: Dispatch<SetStateAction<number>>;
	onSetItemsPerPage?: Dispatch<SetStateAction<ItemsPerPage>>;
} & HTMLAttributes<HTMLElement>;

const defaultItemsPerPageLabel = () => 'Items per page:';

const defaultShowingResultsLabel = ({ count, current, itemsPerPage }: { count: number; current: number; itemsPerPage: ItemsPerPage }) =>
	`Showing results ${current + 1} - ${Math.min(current + itemsPerPage, count)} of ${count}`;

const itemsPerPageOptions = [25, 50, 100] as const;

const Pagination = ({
	count,
	current = 0,
	itemsPerPage = 25,
	itemsPerPageLabel = defaultItemsPerPageLabel,
	showingResultsLabel = defaultShowingResultsLabel,
	onSetItemsPerPage,
	onSetCurrent,
	divider,
	...props
}: PaginationProps) => {
	const paginationResultLabelId = useId();
	const itemsPerPageLabelId = useId();

	const hasItemsPerPageSelection = itemsPerPageOptions.length > 1;
	const currentPage = Math.floor(current / itemsPerPage);
	const pages = Math.ceil(count / itemsPerPage);
	const displayedPages = useMemo(() => {
		if (pages <= 7) {
			// 0 1 2 3 4 5 6
			return Array.from({ length: pages }, (_, i) => i);
		}

		if (currentPage < 5) {
			// 0 1 2 3 4 ... N
			return [0, 1, 2, 3, 4, '⋯', pages - 1];
		}

		if (currentPage > pages - 5) {
			// 0 ... N-4 N-3 N-2 N-1 N
			return [0, '⋯', pages - 5, pages - 4, pages - 3, pages - 2, pages - 1];
		}

		// 0 ... x-1 x x-2 ... N
		return [0, '⋯', currentPage - 1, currentPage, currentPage + 1, '⋯', pages - 1];
	}, [pages, currentPage]);

	const renderingContext = { count, pages, current, currentPage, itemsPerPage };

	const handleSetItemsPerPageLinkClick = (itemsPerPageOption: ItemsPerPage) => () => {
		onSetItemsPerPage?.(itemsPerPageOption);
	};

	const handleSetPageLinkClick = (page: number) => () => {
		onSetCurrent?.(page * itemsPerPage);
	};

	return (
		<PaginationFrame
			divider={divider}
			className={['rcx-pagination', divider && 'rcx-pagination--divider'].filter(Boolean).join(' ')}
			aria-label='Pagination Navigation'
			{...(props as GetProps<typeof PaginationFrame>)}
		>
			{hasItemsPerPageSelection && (
				<PaginationLeft className='rcx-pagination__left'>
					<PaginationLabel className='rcx-pagination__label' id={itemsPerPageLabelId}>
						{itemsPerPageLabel(renderingContext)}
					</PaginationLabel>
					<PaginationList className='rcx-pagination__list' aria-labelledby={itemsPerPageLabelId}>
						{itemsPerPageOptions.map((itemsPerPageOption) => (
							<PaginationListItem key={itemsPerPageOption} className='rcx-pagination__list-item'>
								<PaginationButtonElement
									className='rcx-pagination__link'
									tabIndex={itemsPerPage === itemsPerPageOption ? -1 : 0}
									disabled={itemsPerPage === itemsPerPageOption}
									aria-label={`Show ${itemsPerPageOption} items per page`}
									onClick={handleSetItemsPerPageLinkClick(itemsPerPageOption)}
								>
									{itemsPerPageOption}
								</PaginationButtonElement>
							</PaginationListItem>
						))}
					</PaginationList>
				</PaginationLeft>
			)}
			<PaginationRight className='rcx-pagination__right'>
				<PaginationLabel className='rcx-pagination__label' id={paginationResultLabelId}>
					{showingResultsLabel(renderingContext)}
				</PaginationLabel>
				<PaginationList className='rcx-pagination__list' aria-labelledby={paginationResultLabelId}>
					<PaginationListItem className='rcx-pagination__list-item'>
						<PaginationButtonElement
							arrow
							className='rcx-pagination__back'
							disabled={currentPage === 0}
							aria-label='Previous page'
							onClick={handleSetPageLinkClick(currentPage - 1)}
						>
							<Chevron left size='x16' />
						</PaginationButtonElement>
					</PaginationListItem>
					{displayedPages.map((page, i) => (
						<PaginationListItem key={i} className='rcx-pagination__list-item'>
							{page === '⋯' ? (
								'⋯'
							) : (
								<PaginationButtonElement
									className='rcx-pagination__link'
									disabled={currentPage === page}
									aria-label={`Page ${Number(page) + 1}`}
									onClick={handleSetPageLinkClick(Number(page))}
								>
									{Number(page) + 1}
								</PaginationButtonElement>
							)}
						</PaginationListItem>
					))}
					<PaginationListItem className='rcx-pagination__list-item'>
						<PaginationButtonElement
							arrow
							className='rcx-pagination__forward'
							disabled={currentPage === pages - 1}
							aria-label='Next page'
							onClick={handleSetPageLinkClick(currentPage + 1)}
						>
							<Chevron right size='x16' />
						</PaginationButtonElement>
					</PaginationListItem>
				</PaginationList>
			</PaginationRight>
		</PaginationFrame>
	);
};

export default withFuselageProvider(Pagination);
