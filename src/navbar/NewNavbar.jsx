import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { firestoreConnect } from 'react-redux-firebase';
import { compose } from 'redux';
import TopNavbar from './TopNavbar';
import SideNavbar from './SideNavbar';
import { signOut } from '../auth/actions';
import * as selectors from './selectors';
import { leaveMidgameRequest, editDisplayName } from '../game/actions';

const NewNavbar = props => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const closeSidebar = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);
    const openSidebar = useCallback(() => setSidebarOpen(true), [setSidebarOpen]);
    const toggleSidebar = useCallback(() => setSidebarOpen(!sidebarOpen),
        [sidebarOpen, setSidebarOpen]);

    const redirect = useCallback(redirectLocation => {
        setSidebarOpen(false);
        props.history.push(redirectLocation);
    }, [props.history]);

    return (
        <>
            <TopNavbar
                auth={props.auth}
                currentGame={props.currentGame}
                currentGameId={props.currentGameId}
                editDisplayName={props.editDisplayName}
                isEditingDisplayName={props.isEditingDisplayName}
                leaveMidgameRequest={props.leaveMidgameRequest}
                openNavbar={openSidebar}
                closeNavbar={closeSidebar}
                redirect={redirect}
                signOut={props.signOut}
                toggleNavbar={toggleSidebar}
            />
            <SideNavbar
                currentPath={props.history.location.pathname}
                isOpen={sidebarOpen}
                isSignedIn={Boolean(props.auth.uid)}
                openNavbar={openSidebar}
                closeNavbar={closeSidebar}
                redirect={redirect}
                toggleNavbar={toggleSidebar}
                userId={props.auth.uid}
                maxGameWeek={props.maxGameWeek}
                userPermissions={props.userPermissions}
            />
        </>
    );
};

NewNavbar.propTypes = {
    auth: PropTypes.shape({
        uid: PropTypes.string,
        emailVerified: PropTypes.bool,
        photoURL: PropTypes.string
    }),
    currentGame: PropTypes.shape({}),
    currentGameId: PropTypes.string,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        location: PropTypes.shape({
            pathname: PropTypes.string
        })
    }).isRequired,
    editDisplayName: PropTypes.func.isRequired,
    isEditingDisplayName: PropTypes.bool,
    leaveMidgameRequest: PropTypes.func.isRequired,
    maxGameWeek: PropTypes.number,
    signOut: PropTypes.func.isRequired,
    userPermissions: PropTypes.arrayOf(PropTypes.string)
};

NewNavbar.defaultProps = {
    auth: {},
    currentGame: {},
    currentGameId: '',
    isEditingDisplayName: false,
    maxGameWeek: null,
    userPermissions: []
};

const mapStateToProps = state => ({
    auth: state.firebase.auth,
    currentGame: selectors.getCurrentGame(state),
    currentGameId: selectors.getGameId(state),
    isEditingDisplayName: state.game.isEditingDisplayName,
    maxGameWeek: state.overview.maxGameWeek,
    profile: state.firebase.profile,
    pathname: state.router.location.pathname,
    userPermissions: state.auth.userPermissions
});

const mapDispatchToProps = {
    leaveMidgameRequest,
    signOut,
    editDisplayName
};

export default withRouter(compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect(() => [
        {
            collection: 'games'
        }
    ])
)(NewNavbar));

export { NewNavbar as NewNavbarUnconnected };
