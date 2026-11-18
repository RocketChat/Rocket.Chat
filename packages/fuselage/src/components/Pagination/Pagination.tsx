import type { Dispatch, HTMLAttributes, SetStateAction } from 'react';
import { useId, useMemo } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { Chevron } from '../Chevron';

export type ItemsPerPage = 25 | 50 | 100;

export type PaginationProps = {
	/** Total number of items across all pages. */
	count: number;
	/** Zero-based index of the first item on the current page, not the page number. */
	current?: number;
	/** Draws a line along the top, to separate the pagination from the content above it. */
	divider?: boolean;
	itemsPerPage?: ItemsPerPage;
	/** Text before the items-per-page choices, such as a translated "Items per page:". */
	itemsPerPageLabel?: (context: { count: number; current: number; itemsPerPage: ItemsPerPage }) => string;
	/** Text before the page links, such as a translated "Showing results 1 - 25 of 500". */
	showingResultsLabel?: (context: { count: number; current: number; itemsPerPage: ItemsPerPage }) => string;
	/** Called with the new `current` when the user moves to another page. */
	onSetCurrent?: Dispatch<SetStateAction<number>>;
	onSetItemsPerPage?: Dispatch<SetStateAction<ItemsPerPage>>;
} & HTMLAttributes<HTMLElement>;

const defaultItemsPerPageLabel = () => 'Items per page:';

const defaultShowingResultsLabel = ({ count, current, itemsPerPage }: { count: number; current: number; itemsPerPage: ItemsPerPage }) =>
	`Showing results ${current + 1} - ${Math.min(current + itemsPerPage, count)} of ${count}`;

const itemsPerPageOptions = [25, 50, 100] as const;

/**
 * Splits a long set of results, usually a table's, into pages, and lets the user move between pages and pick how many
 * items each one shows.
 */
const Pagination = ({
	count,
	current = 0,
	itemsPerPage = 25,
	itemsPerPageLabel = defaultItemsPerPageLabel,
	showingResultsLabel = defaultShowingResultsLabel,
	onSetItemsPerPage,
	onSetCurrent,
	divider,
	className,
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
		<nav
			className={cx('rcx-box rcx-box--full rcx-pagination', divider && 'rcx-pagination--divider', className)}
			aria-label='Pagination Navigation'
			{...props}
		>
			{hasItemsPerPageSelection && (
				<div className='rcx-pagination__left'>
					<span className='rcx-pagination__label' id={itemsPerPageLabelId}>
						{itemsPerPageLabel(renderingContext)}
					</span>
					<ol className='rcx-box rcx-box--full rcx-pagination__list' aria-labelledby={itemsPerPageLabelId}>
						{itemsPerPageOptions.map((itemsPerPageOption) => (
							<li key={itemsPerPageOption} className='rcx-pagination__list-item'>
								<button
									className='rcx-box rcx-box--full rcx-pagination__link'
									tabIndex={itemsPerPage === itemsPerPageOption ? -1 : 0}
									disabled={itemsPerPage === itemsPerPageOption}
									aria-label={`Show ${itemsPerPageOption} items per page`}
									onClick={handleSetItemsPerPageLinkClick(itemsPerPageOption)}
								>
									{itemsPerPageOption}
								</button>
							</li>
						))}
					</ol>
				</div>
			)}
			<div className='rcx-pagination__right'>
				<span className='rcx-pagination__label' id={paginationResultLabelId}>
					{showingResultsLabel(renderingContext)}
				</span>
				<ol className='rcx-box rcx-box--full rcx-pagination__list' aria-labelledby={paginationResultLabelId}>
					<li className='rcx-pagination__list-item'>
						<button
							className='rcx-box rcx-box--full rcx-pagination__back'
							disabled={currentPage === 0}
							aria-label='Previous page'
							onClick={handleSetPageLinkClick(currentPage - 1)}
						>
							<Chevron left size='x16' />
						</button>
					</li>
					{displayedPages.map((page, i) => (
						<li key={i} className='rcx-pagination__list-item'>
							{page === '⋯' ? (
								'⋯'
							) : (
								<button
									className='rcx-box rcx-box--full rcx-pagination__link'
									disabled={currentPage === page}
									aria-label={`Page ${Number(page) + 1}`}
									onClick={handleSetPageLinkClick(Number(page))}
								>
									{Number(page) + 1}
								</button>
							)}
						</li>
					))}
					<li className='rcx-pagination__list-item'>
						<button
							className='rcx-box rcx-box--full rcx-pagination__forward'
							disabled={currentPage === pages - 1}
							aria-label='Next page'
							onClick={handleSetPageLinkClick(currentPage + 1)}
						>
							<Chevron right size='x16' />
						</button>
					</li>
				</ol>
			</div>
		</nav>
	);
};

export default Pagination;
