import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { RadioDropDownGroup } from '../definitions/RadioDropDownDefinitions';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';

export type FilterStructure = {
  label: string;
  items: { id: string; label: string; checked: boolean }[];
};

type FiltersContextType = {
  filters: any;
  setFilters: Dispatch<SetStateAction<any>>;
  freePaidFilterStructure: any;
  setFreePaidFilterStructure: Dispatch<SetStateAction<any>>;
  statusFilterStructure: any;
  setStatusFilterStructure: Dispatch<SetStateAction<any>>;
  sortFilterStructure: RadioDropDownGroup;
  setSortFilterStructure: Dispatch<SetStateAction<RadioDropDownGroup>>;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>> & {
		flush: () => void;
		cancel: () => void;
	};
  requestedFilterItems: any;
  isFiltered: boolean;
  resetFilters: () => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

interface FiltersProviderProps {
  children: ReactNode;
}

const initialFilters = {
  freePaidFilterStructure: {
    label: 'Filter_By_Price',
    items: [
      { id: 'all', label: 'All_Prices', checked: true },
      { id: 'free', label: 'Free_Apps', checked: false },
      { id: 'paid', label: 'Paid_Apps', checked: false },
      { id: 'premium', label: 'Premium', checked: false },
    ],
  },
  statusFilterStructure: {
    label: 'Filter_By_Status',
    items: [
      { id: 'all', label: 'All_status', checked: true },
      { id: 'enabled', label: 'Enabled', checked: false },
      { id: 'disabled', label: 'Disabled', checked: false },
    ],
  },
  sortFilterStructure: {
    label: 'Sort_By',
    items: [
      { id: 'az', label: 'A-Z', checked: false },
      { id: 'za', label: 'Z-A', checked: false },
      { id: 'mru', label: 'Most_recent_updated', checked: true },
      { id: 'lru', label: 'Least_recent_updated', checked: false },
    ],
  },
};

export function FiltersProvider({ children }: FiltersProviderProps): JSX.Element {
  const t = useTranslation();

  const [filters, setFilters] = useState<any>({});
  const [text, setText] = useDebouncedState(filters?.text || '', 500);
  const [key, setKey] = useState(0); // Añade una clave de reinicio

  const [freePaidFilterStructure, setFreePaidFilterStructure] = useState({
		label: t('Filter_By_Price'),
		items: 
    // filters?.freePaidFilterStructure?.items || 
    initialFilters.freePaidFilterStructure.items,
	});

  const [statusFilterStructure, setStatusFilterStructure] = useState({
		label: t('Filter_By_Status'),
		items: 
    // filters?.statusFilterStructure?.items || 
    initialFilters.statusFilterStructure.items,
	});

  const [sortFilterStructure, setSortFilterStructure] = useState({
    label: t('Sort_By'),
		items: 
    // filters?.sortFilterStructure?.items || 
    initialFilters.sortFilterStructure.items,
	});

  const requestedFilterItems = [
		{ id: 'urf', label: t('Unread_Requested_First'), checked: false },
		{ id: 'url', label: t('Unread_Requested_Last'), checked: false },
	];

  const resetFilters = () => {
    console.log('filters before', filters)
    setFreePaidFilterStructure(initialFilters.freePaidFilterStructure);
    setStatusFilterStructure(initialFilters.statusFilterStructure);
    setSortFilterStructure(initialFilters.sortFilterStructure);
    setText('');
    setKey((prevKey) => prevKey + 1);
    console.log('filters after', filters)
  }

  const isFilteredByText = Boolean(text.length);
	const isFilteredByPrice = freePaidFilterStructure.items?.find((item: { checked: any; }) => item.checked)?.id !== 'all';
	const isFilteredByStatus = statusFilterStructure.items?.find((item: { checked: any; }) => item.checked)?.id !== 'all';
	const isFilteredBySort = sortFilterStructure.items?.find((item: { checked: any; }) => item.checked)?.id !== 'mru';
	const isFiltered = isFilteredByText || isFilteredByPrice || isFilteredByStatus || isFilteredBySort;

  return (
    <FiltersContext.Provider key={key} value={{
      filters,
      setFilters,
      freePaidFilterStructure,
      setFreePaidFilterStructure,
      statusFilterStructure,
      setStatusFilterStructure,
      sortFilterStructure,
      setSortFilterStructure,
      text,
      setText,
      requestedFilterItems,
      isFiltered,
      resetFilters,
    }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(): FiltersContextType {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}
