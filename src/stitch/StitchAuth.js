import React, {
	useState,
	useContext,
	createContext,
	useMemo,
	useCallback,
} from 'react';
import PropTypes from 'prop-types';
import {
	hasLoggedInUser,
	loginAnonymous,
	logoutCurrentUser,
	getCurrentUser,
} from './authentication';

// Create a React Context that lets us expose and access auth state
// without passing props through many levels of the component tree
const StitchAuthContext = createContext();

// Create a React Hook that lets us get data from our auth context
export function useStitchAuth() {
	const context = useContext(StitchAuthContext);
	if (!context) {
		throw new Error(`useStitchAuth must be used within a StitchAuthProvider`);
	}
	return context;
}

// Create a component that controls auth state and exposes it via
// the React Context we created.
export function StitchAuthProvider(props) {
	const [authState, setAuthState] = useState({
		isLoggedIn: hasLoggedInUser(),
		currentUser: getCurrentUser(),
	});

	// Authentication Actions
	const handleAnonymousLogin = useCallback(async () => {
		const { isLoggedIn } = authState;
		if (!isLoggedIn) {
			try {
				const loggedInUser = await loginAnonymous();
				return setAuthState({
					...authState,
					isLoggedIn: true,
					currentUser: loggedInUser,
				});
			} catch (err) {
				console.error(err);
			}
		}
	}, [authState]);

	const handleLogout = useCallback(async () => {
		const { isLoggedIn } = authState;
		if (isLoggedIn) {
			await logoutCurrentUser();
			setAuthState({
				...authState,
				isLoggedIn: false,
				currentUser: null,
			});
		} else {
			console.log(`can't handleLogout when no user is logged in`);
		}
	}, [authState]);

	// We useMemo to improve performance by eliminating some re-renders
	const authInfo = useMemo(() => {
		const { isLoggedIn, currentUser } = authState;
		const value = {
			isLoggedIn,
			currentUser,
			actions: { handleAnonymousLogin, handleLogout },
		};
		return value;
	}, [authState, handleAnonymousLogin, handleLogout]);

	return (
		<StitchAuthContext.Provider value={authInfo}>
			{props.children}
		</StitchAuthContext.Provider>
	);
}
StitchAuthProvider.propTypes = {
	children: PropTypes.element,
};
