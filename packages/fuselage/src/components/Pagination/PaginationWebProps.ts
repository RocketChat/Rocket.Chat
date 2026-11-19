import type { PaginationContract } from './Pagination.contract';
import type { WebPressAlias, WebProps } from '../../types/WebAttributes';

export type PaginationWebProps = WebProps<PaginationContract, HTMLElement> & WebPressAlias<HTMLElement> & { title?: string };
