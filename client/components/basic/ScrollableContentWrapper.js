import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar/src/simplebar.css';

const ScrollableContentWrapper = ({ children, ...props }) => <SimpleBar style={{ maxHeight: '100%' }} {...props}> {children} </SimpleBar>;

export default ScrollableContentWrapper;
