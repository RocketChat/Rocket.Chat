import { Meteor } from 'meteor/meteor';
//Not sure if this will work
export const loginWithToken = (token: string) => {
    if (typeof token === 'string') {
        Meteor.loginWithToken(token, (error) => {
            if (error) {
                console.error('Login failed:', error);
                throw new Error('Login failed. Please try again.');
            }
            console.log('Login successful');
        });
    } else {
        throw new Error('Invalid token provided for login');
    }
}