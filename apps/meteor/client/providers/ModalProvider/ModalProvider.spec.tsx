import { useSetModal } from '@rocket.chat/ui-contexts';
import { act, render, screen } from '@testing-library/react';
import type { ForwardedRef, ReactElement } from 'react';
import { Suspense, createContext, createRef, forwardRef, useContext, useImperativeHandle } from 'react';

import ModalProvider from './ModalProvider';
import ModalProviderWithRegion from './ModalProviderWithRegion';
import GenericModal from '../../components/GenericModal';
import { imperativeModal } from '../../lib/imperativeModal';
import ModalRegion from '../../views/modal/ModalRegion';

const renderWithSuspense = (ui: ReactElement) =>
	render(ui, {
		wrapper: ({ children }) => <Suspense fallback={null}>{children}</Suspense>,
	});

describe('via useSetModal', () => {
	const ModalTitleContext = createContext('default');

	type ModalOpenerAPI = { open: () => void };

	const ModalOpener = forwardRef((_: unknown, ref: ForwardedRef<ModalOpenerAPI>) => {
		const setModal = useSetModal();
		const title = useContext(ModalTitleContext);
		useImperativeHandle(ref, () => ({
			open: () => {
				setModal(<GenericModal open title={title} />);
			},
		}));

		return null;
	});

	it('should render a modal', async () => {
		const modalOpenerRef = createRef<ModalOpenerAPI>();

		renderWithSuspense(
			<ModalProviderWithRegion>
				<ModalOpener ref={modalOpenerRef} />
			</ModalProviderWithRegion>,
		);

		act(() => {
			modalOpenerRef.current?.open();
		});

		expect(await screen.findByRole('dialog', { name: 'default' })).toBeInTheDocument();
	});

	it('should render a modal that consumes a context', async () => {
		const modalOpenerRef = createRef<ModalOpenerAPI>();

		renderWithSuspense(
			<ModalTitleContext.Provider value='title from context'>
				<ModalProviderWithRegion>
					<ModalOpener ref={modalOpenerRef} />
				</ModalProviderWithRegion>
			</ModalTitleContext.Provider>,
		);
		act(() => {
			modalOpenerRef.current?.open();
		});

		expect(await screen.findByRole('dialog', { name: 'title from context' })).toBeInTheDocument();
	});

	it('should render a modal in another region', async () => {
		const modalOpener1Ref = createRef<ModalOpenerAPI>();
		const modalOpener2Ref = createRef<ModalOpenerAPI>();

		renderWithSuspense(
			<ModalTitleContext.Provider value='modal1'>
				<ModalProviderWithRegion>
					<ModalOpener ref={modalOpener1Ref} />
				</ModalProviderWithRegion>
				<ModalTitleContext.Provider value='modal2'>
					<ModalProviderWithRegion>
						<ModalOpener ref={modalOpener2Ref} />
					</ModalProviderWithRegion>
				</ModalTitleContext.Provider>
			</ModalTitleContext.Provider>,
		);

		act(() => {
			modalOpener1Ref.current?.open();
		});

		expect(await screen.findByRole('dialog', { name: 'modal1' })).toBeInTheDocument();

		act(() => {
			modalOpener2Ref.current?.open();
		});

		expect(await screen.findByRole('dialog', { name: 'modal2' })).toBeInTheDocument();
	});
});

describe('via imperativeModal', () => {
	it('should render a modal through imperative modal', async () => {
		renderWithSuspense(
			<ModalProvider>
				<ModalRegion />
			</ModalProvider>,
		);

		act(() => {
			imperativeModal.open({
				component: GenericModal,
				props: { title: 'imperativeModal', open: true },
			});
		});

		expect(await screen.findByRole('dialog', { name: 'imperativeModal' })).toBeInTheDocument();

		act(() => {
			imperativeModal.close();
		});

		expect(screen.queryByText('imperativeModal')).not.toBeInTheDocument();
	});

	it('should not render a modal if no corresponding region exists', async () => {
		// ModalProviderWithRegion will always have a region identifier set
		// and imperativeModal will only render modals in the default region (e.g no region identifier)

		renderWithSuspense(<ModalProviderWithRegion />);

		act(() => {
			imperativeModal.open({
				component: GenericModal,
				props: { title: 'imperativeModal', open: true },
			});
		});

		expect(screen.queryByRole('dialog', { name: 'imperativeModal' })).not.toBeInTheDocument();
	});
});
