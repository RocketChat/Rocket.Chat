import '@rocket.chat/icons/dist/rocketchat.css';
import { createRoot } from 'react-dom/client';

import '../src/index.css';
import { Button, IconButton } from '../src/components/Button';
import { ButtonSegmentContext } from '../src/components/Button/ButtonSegmentContext';

// Tamagui's zero transform mistakes any member-expression element (`<Context.Provider>`) for a `<ThemeUpdate>`
const SegmentProvider = ButtonSegmentContext.Provider;

const App = () => (
	<div className='spike-grid'>
		<Button id='b-default'>Default</Button>
		<Button id='b-primary' variant='primary'>
			Primary
		</Button>
		<Button id='b-secondary' variant='secondary'>
			Secondary
		</Button>
		<Button id='b-danger' variant='danger'>
			Danger
		</Button>
		<Button id='b-success' variant='success'>
			Success
		</Button>
		<Button id='b-warning' variant='warning'>
			Warning
		</Button>
		<Button id='b-small' size='small'>
			Small
		</Button>
		<Button id='b-large' size='large'>
			Large
		</Button>
		<Button id='b-square' square icon='plus' />
		<Button id='b-disabled' disabled>
			Disabled
		</Button>
		<Button id='b-primary-disabled' variant='primary' disabled>
			Primary disabled
		</Button>
		<Button id='b-loading' loading>
			Loading
		</Button>
		<Button id='b-icon' icon='plus'>
			Icon
		</Button>
		<IconButton id='ib-default' icon='plus' aria-label='plus' />
		<IconButton id='ib-primary' variant='primary' icon='plus' aria-label='plus' />
		<IconButton id='ib-danger' variant='danger' icon='trash' aria-label='trash' />
		<IconButton id='ib-small' size='small' icon='plus' aria-label='plus' />
		<IconButton id='ib-pressed' pressed icon='plus' aria-label='plus' />
		<IconButton id='ib-disabled' disabled icon='plus' aria-label='plus' />
		<Button id='b-medium' size='medium'>
			Medium
		</Button>
		<Button id='b-compact' compact>
			C
		</Button>
		<Button id='b-small-square' size='small' square icon='plus' />
		<Button id='b-secondary-danger' variant='secondary-danger'>
			Secondary danger
		</Button>
		<Button id='b-link' is='a' href='#x' external>
			Link
		</Button>
		<Button id='b-attrs' title='t' aria-pressed='true' data-x='1' className='custom' tabIndex={-1}>
			Attrs
		</Button>
		<IconButton id='ib-mini' size='mini' icon='plus' aria-label='plus' />
		<IconButton id='ib-info-pressed' variant='info' pressed icon='plus' aria-label='plus' />
		<IconButton id='ib-glyph' color='danger' icon='plus' aria-label='plus' />
		<IconButton id='ib-badge' badge={<span>3</span>} icon='bell' aria-label='bell' />
		<IconButton id='ib-badge-bottom' badge={<span>3</span>} badgePosition='bottom-end' icon='bell' aria-label='bell' />
		<IconButton id='ib-link' is='a' href='#x' external icon='plus' aria-label='plus' />
		<SegmentProvider value={{ position: 'first', variant: 'primary' }}>
			<Button id='seg-first' variant='primary'>
				First
			</Button>
		</SegmentProvider>
		<SegmentProvider value={{ position: 'last', variant: 'primary', ghost: true }}>
			<IconButton id='seg-last-ghost' icon='chevron-down' aria-label='more' />
		</SegmentProvider>
		<SegmentProvider value={{ position: 'middle', variant: 'danger', ghost: true }}>
			<Button id='seg-middle-ghost-disabled' disabled>
				Middle
			</Button>
		</SegmentProvider>
		<SegmentProvider value={{ position: 'only', variant: 'secondary' }}>
			<IconButton id='seg-only-badge' badge={<span>1</span>} color='default' icon='bell' aria-label='bell' />
		</SegmentProvider>
	</div>
);

createRoot(document.getElementById('root')!).render(<App />);
