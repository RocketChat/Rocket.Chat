import { Emitter } from '@rocket.chat/emitter';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, createContext, useContext, useEffect } from 'react';

import GenericModal from '../../components/GenericModal';
import { imperativeModal } from '../../lib/imperativeModal';
import ModalRegion from '../../views/modal/ModalRegion';
import ModalProvider from './ModalProvider';
import ModalProviderWithRegion from './ModalProviderWithRegion';
import '@testing-library/jest-dom/extend-expect';

type TestModalProps = { emitterEvent: string; modalFunc?: () => ReactNode; onClose?: () => void };

const TestContext = createContext({ title: 'default' });
const emitter = new Emitter();

const TestModal = ({ emitterEvent, modalFunc, onClose = () => undefined }: TestModalProps) => {
	const setModal = useSetModal();
	const { title } = useContext(TestContext);

	useEffect(() => {
		return emitter.on(emitterEvent, () => {
			setModal(modalFunc || <GenericModal title={title} onClose={onClose} />);
		});
	}, [emitterEvent, setModal, title, modalFunc, onClose]);

	return <></>;
};

const renderWithSuspense = (ui: ReactElement) =>
	render(ui, {
		wrapper: ({ children }) => <Suspense fallback={null}>{children}</Suspense>,
	});

describe('Modal Provider', () => {
	it('should render a modal', async () => {
		renderWithSuspense(
			<ModalProviderWithRegion>
				<TestModal emitterEvent='open' />
			</ModalProviderWithRegion>,
		);

		act(() => {
			emitter.emit('open');
		});

		expect(await screen.findByText('default')).toBeTruthy();
	});

	it('should render a modal that is passed as a function', async () => {
		renderWithSuspense(
			<ModalProviderWithRegion>
				<TestModal emitterEvent='open' modalFunc={() => <GenericModal title='function modal' onClose={() => undefined} />} />
			</ModalProviderWithRegion>,
		);

		act(() => {
			emitter.emit('open');
		});

		expect(await screen.findByText('function modal')).toBeTruthy();
	});

	it('should render a modal through imperative modal', async () => {
		renderWithSuspense(
			<ModalProvider>
				<ModalRegion />
			</ModalProvider>,
		);

		const { close } = imperativeModal.open({
			component: GenericModal,
			props: { title: 'imperativeModal' },
		});

		expect(await screen.findByText('imperativeModal')).toBeTruthy();

		close();

		expect(screen.queryByText('imperativeModal')).toBeFalsy();
	});

	it('should not render a modal if no corresponding region exists', () => {
		// ModalProviderWithRegion will always have a region identifier set
		// and imperativeModal will only render modals in the default region (e.g no region identifier)
		renderWithSuspense(<ModalProviderWithRegion />);

		imperativeModal.open({
			component: GenericModal,
			props: { title: 'imperativeModal' },
		});

		expect(screen.queryByText('imperativeModal')).toBeFalsy();
	});

	it('should render a modal in another region', async () => {
		render(
			<TestContext.Provider value={{ title: 'modal1' }}>
				<ModalProviderWithRegion>
					<TestModal emitterEvent='openModal1' />
				</ModalProviderWithRegion>
				<TestContext.Provider value={{ title: 'modal2' }}>
					<ModalProviderWithRegion>
						<TestModal emitterEvent='openModal2' />
					</ModalProviderWithRegion>
				</TestContext.Provider>
			</TestContext.Provider>,
		);

		emitter.emit('openModal1');
		expect(await screen.findByText('modal1')).toBeTruthy();
		emitter.emit('openModal2');
		expect(await screen.findByText('modal2')).toBeTruthy();
	});

	it('should call onClose function when  dismissed', async () => {
		const handleClose = jest.fn();

		renderWithSuspense(
			<ModalProviderWithRegion>
				<TestModal emitterEvent='open' onClose={handleClose} />
			</ModalProviderWithRegion>,
		);

		act(() => {
			emitter.emit('open');
		});

		expect(await screen.findByRole('heading', { name: 'default' })).toBeInTheDocument();

		expect(handleClose).not.toHaveBeenCalled();

		userEvent.keyboard('{Escape}');

		expect(screen.queryByText('default')).not.toBeInTheDocument();
		expect(handleClose).toHaveBeenCalled();
	});
});
