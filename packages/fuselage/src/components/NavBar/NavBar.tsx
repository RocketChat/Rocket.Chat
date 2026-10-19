import type { HTMLAttributes } from 'react';

export type NavBarProps = HTMLAttributes<HTMLElement>;

const NavBar = (props: NavBarProps) => <nav className='rcx-navbar' {...props} />;

export default NavBar;
