import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useEndpoint } from '@rocket.chat/ui-contexts';

type PharmacyFilterContextValue = {
    selectedPharmacyId: string | null;
    setSelectedPharmacyId: (id: string | null) => void;
    pharmacyContext: {
        memberUserIds: string[];
        roomIds: string[];
    } | null;
    loading: boolean;
};

const PharmacyFilterContext = createContext<PharmacyFilterContextValue>({
    selectedPharmacyId: null,
    setSelectedPharmacyId: () => { },
    pharmacyContext: null,
    loading: false,
});

export const usePharmacyFilter = () => useContext(PharmacyFilterContext);

export const PharmacyFilterProvider = ({ children }: { children: ReactNode }) => {
    const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
    const [pharmacyContext, setPharmacyContext] = useState<{ memberUserIds: string[]; roomIds: string[] } | null>(null);
    const [loading, setLoading] = useState(false);

    const getContext = useEndpoint('GET', '/v1/medsense/pharmacies.context');

    useEffect(() => {
        if (!selectedPharmacyId) {
            setPharmacyContext(null);
            return;
        }

        const fetchContext = async () => {
            setLoading(true);
            try {
                const result = await getContext({ pharmacyId: selectedPharmacyId });
                setPharmacyContext(result.context);
            } catch (error) {
                console.error("Failed to fetch pharmacy context", error);
                setPharmacyContext(null);
            } finally {
                setLoading(false);
            }
        };

        fetchContext();
    }, [selectedPharmacyId, getContext]);

    return (
        <PharmacyFilterContext.Provider value={{ selectedPharmacyId, setSelectedPharmacyId, pharmacyContext, loading }}>
            {children}
        </PharmacyFilterContext.Provider>
    );
};
