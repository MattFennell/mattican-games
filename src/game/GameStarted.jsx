import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { firestoreConnect } from 'react-redux-firebase';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import defaultStyles from './GameStarted.module.scss';
import * as selectors from './selectors';
import Fade from '../common/Fade/Fade';
import * as helpers from './helpers';
import * as constants from '../constants';
import CurrentGameStatus from './CurrentGameStatus';
import { nominatePlayerForQuest, confirmNominationsRequest } from './actions';
import StyledButton from '../common/StyledButton/StyledButton';

const GameStarted = props => {
    const [viewingRole, setViewingRole] = useState(false);
    const toggleViewRoles = useCallback(() => {
        setViewingRole(!viewingRole);
    }, [viewingRole, setViewingRole]);

    const [viewingBoard, setViewingBoard] = useState(false);
    const toggleViewingBoard = useCallback(() => {
        setViewingBoard(!viewingBoard);
    }, [viewingBoard, setViewingBoard]);

    const submitNominations = useCallback(() => {
        props.confirmNominationsRequest(props.currentGameId, props.currentGame.questNominations);
        // eslint-disable-next-line
    }, [props.currentGame])


    const generateSecretInfo = role => {
        if (role === constants.avalonRoles.Merlin.name) {
            return props.currentGame.playerRoles
                .filter(r => !constants.avalonRoles[r.role].isGood)
                .filter(r => r.role !== constants.avalonRoles.Mordred.name)
                .map(r => (
                    <div>{`${helpers.mapUserIdToName(props.users, r.player)} is bad`}</div>
                ));
        }
        if (role === constants.avalonRoles.RegularGood.name
            || role === constants.avalonRoles.Oberon.name) {
            return <div>Afraid you know nothing</div>;
        }

        if (role === constants.avalonRoles.RegularBad.name
            || role === constants.avalonRoles.Mordred.name
            || role === constants.avalonRoles.Morgana.name) {
            return props.currentGame.playerRoles.filter(r => !constants.avalonRoles[r.role].isGood)
                .filter(r => r.role !== constants.avalonRoles.Oberon.name)
                .filter(r => r.role !== role)
                .map(r => (
                    <div>{`${helpers.mapUserIdToName(props.users, r.player)} is bad with you`}</div>
                ));
        }
        if (role === constants.avalonRoles.Percival.name) {
            if (props.currentGame.roles.includes(constants.avalonRoles.Merlin.name)
            && props.currentGame.roles.includes(constants.avalonRoles.Morgana.name)) {
                const potentialPairs = props.currentGame.playerRoles
                    .filter(r => r.role === constants.avalonRoles.Merlin.name
                || r.role === constants.avalonRoles.Morgana.name);

                const names = `${helpers.mapUserIdToName(props.users, potentialPairs[0].player)} / ${helpers.mapUserIdToName(props.users, potentialPairs[1].player)}`;

                return <div>{`${names} are Merlin / Morgana`}</div>;
            }
            return props.currentGame.playerRoles
                .filter(r => r.role === constants.avalonRoles.Merlin.name)
                .map(r => <div>{`${helpers.mapUserIdToName(props.users, r.player)} is Merlin`}</div>);
        }
        return null;
    };

    const nominatePlayer = useCallback(player => {
        if (props.currentGame.status === constants.gameStatuses.Nominating) {
            if (props.currentGame.leader === props.auth.uid) {
                const playerAlreadyOnMission = props.currentGame.questNominations.includes(player);
                props.nominatePlayerForQuest(props.currentGameId, player, !playerAlreadyOnMission);
            }
        }
        // eslint-disable-next-line
    }, [props.currentGame, props.auth.uid]);

    const generateResultIcon = result => {
        if (result === 1) {
            return <div className={props.styles.successResult}><FiberManualRecordIcon fontSize="small" /></div>;
        }
        if (result === -1) {
            return <div className={props.styles.failResult}><FiberManualRecordIcon fontSize="small" /></div>;
        }
        return <div><FiberManualRecordIcon fontSize="small" /></div>;
    };

    return (
        <div className={props.styles.gameStartedWrapper}>

            {props.currentGame.status === constants.gameStatuses.Finished
                ? <div className={props.styles.gameFinished}>Game finished </div> : (
                    <div className={props.styles.roundHeader}>
                        {`Round: ${props.currentGame.round}`}
                    </div>
                )}


            <div className={props.styles.viewSecretInfoWrapper}>
                <Fade
                    checked={viewingRole}
                    label="View secret info"
                    includeCheckbox
                    onChange={toggleViewRoles}
                >
                    <div className={classNames({
                        [props.styles.viewingRole]: true,
                        [props.styles.isGood]: helpers.isRoleGood(props.myRole),
                        [props.styles.isBad]: !helpers.isRoleGood(props.myRole)
                    })}
                    >
                        {`Role: ${props.myRole}`}
                    </div>
                    {generateSecretInfo(props.myRole)}
                </Fade>
            </div>

            {props.currentGame.status !== constants.gameStatuses.Finished && (
                <div className={props.styles.currentLeaderWrapper}>
                    {`The current leader is ${helpers.mapUserIdToName(props.users, props.currentGame.leader)}`}
                </div>
            )}


            <div className={props.styles.viewingBoardWrapper}>
                <Fade
                    checked={viewingBoard}
                    label="View board"
                    includeCheckbox
                    onChange={toggleViewingBoard}
                >
                    <div className={props.styles.avalonBoard}>
                        {generateResultIcon(props.currentGame.questResult[0])}
                        {generateResultIcon(props.currentGame.questResult[1])}
                        {generateResultIcon(props.currentGame.questResult[2])}
                        {generateResultIcon(props.currentGame.questResult[3])}
                        {generateResultIcon(props.currentGame.questResult[4])}
                    </div>
                </Fade>
            </div>
            <CurrentGameStatus />

            <div className={props.styles.playerOrder}>
                {props.currentGame.currentPlayers.map((player, index) => (
                    <div
                        className={classNames({
                            [props.styles.playerWrapper]: true,
                            [props.styles.isOnQuest]: props.currentGame
                                .questNominations.includes(player)
                                || props.currentGame.playersOnQuest.includes(player)
                        })}
                        role="button"
                        tabIndex={0}
                        onClick={() => nominatePlayer(player)}
                    >
                        <div className={props.styles.playerNumber}>{`#${index + 1}`}</div>
                        <div className={classNames({
                            [props.styles.playerName]: true,
                            [props.styles.activePlayer]: player === props.currentGame.leader
                        })}
                        >
                            {helpers.mapUserIdToName(props.users, player)}
                            {props.auth.uid === player && ' (you)'}
                        </div>
                        {props.currentGame.status === constants.gameStatuses.Voting
                        && (
                            <div className={classNames({
                                [props.styles.votingStage]: true,
                                [props.styles.haveVoted]: props.currentGame
                                    .votesFor.includes(player)
                                || props.currentGame
                                    .votesAgainst.includes(player),
                                [props.styles.notVoted]: !props.currentGame
                                    .votesFor.includes(player)
                            && !props.currentGame
                                .votesAgainst.includes(player)
                            })}
                            >
                                <FiberManualRecordIcon fontSize="small" />
                            </div>
                        )}

                        {props.currentGame.status === constants.gameStatuses.Questing
                        && props.currentGame.playersOnQuest.includes(player) && (
                            <div className={classNames({
                                [props.styles.questingStage]: true,
                                [props.styles.haveVoted]: props.currentGame
                                    .questSuccesses.includes(player)
                                || props.currentGame
                                    .questFails.includes(player),
                                [props.styles.notVoted]: !props.currentGame
                                    .questSuccesses.includes(player)
                            && !props.currentGame
                                .questFails.includes(player)
                            })}
                            >
                                <FiberManualRecordIcon fontSize="small" />
                            </div>
                        )}

                    </div>
                ))}
            </div>

            {(props.currentGame.status === constants.gameStatuses.Nominating
            || props.currentGame.status === constants.gameStatuses.Voting) && (
                <div className={props.styles.consecutiveRejections}>
                    {`Consecutive rejections: ${props.currentGame.consecutiveRejections}`}
                    {props.currentGame.consecutiveRejections === 4
                    && (
                        <div className={props.styles.noVoting}>
                        No voting will occur this round
                        </div>
                    )}
                </div>
            )}

            {props.currentGame.leader === props.auth.uid
            && props.currentGame.status === constants.gameStatuses.Nominating
            && (
                <div className={props.styles.confirmNominationWrapper}>
                    <StyledButton
                        text="Confirm Nominations"
                        onClick={submitNominations}
                        disabled={props.currentGame.questNominations.length
                            < constants.avalonRounds[props
                                .currentGame.numberOfPlayers][props.currentGame.round]}
                    />
                </div>
            ) }


        </div>
    );
};

GameStarted.defaultProps = {
    auth: {
        uid: ''
    },
    currentGame: {
        currentPlayers: [],
        consecutiveRejections: 0,
        host: '',
        leader: '',
        mode: '',
        numberOfPlayers: 0,
        roles: [],
        round: 0,
        playersOnQuest: [],
        playersReady: [],
        playerRoles: [],
        status: '',
        questNominations: [],
        questSuccesses: [],
        questFails: [],
        votesAgainst: [],
        votesFor: [],
        questResult: []
    },
    currentGameId: '',
    myRole: '',
    styles: defaultStyles,
    users: {}
};

GameStarted.propTypes = {

    auth: PropTypes.shape({
        uid: PropTypes.string
    }),
    confirmNominationsRequest: PropTypes.func.isRequired,
    currentGame: PropTypes.shape({
        consecutiveRejections: PropTypes.number,
        currentPlayers: PropTypes.arrayOf(PropTypes.string),
        host: PropTypes.string,
        leader: PropTypes.string,
        mode: PropTypes.string,
        numberOfPlayers: PropTypes.number,
        roles: PropTypes.arrayOf(PropTypes.string),
        round: PropTypes.number,
        playersOnQuest: PropTypes.arrayOf(PropTypes.string),
        playersReady: PropTypes.arrayOf(PropTypes.string),
        votesAgainst: PropTypes.arrayOf(PropTypes.string),
        votesFor: PropTypes.arrayOf(PropTypes.string),
        playerRoles: PropTypes.arrayOf(PropTypes.shape({
            player: PropTypes.string,
            role: PropTypes.string
        })),
        questFails: PropTypes.arrayOf(PropTypes.string),
        questNominations: PropTypes.arrayOf(PropTypes.string),
        questSuccesses: PropTypes.arrayOf(PropTypes.string),
        questResult: PropTypes.arrayOf(PropTypes.string),
        status: PropTypes.string
    }),
    nominatePlayerForQuest: PropTypes.func.isRequired,
    currentGameId: PropTypes.string,
    myRole: PropTypes.string,
    styles: PropTypes.objectOf(PropTypes.string),
    users: PropTypes.shape({})
};

const mapDispatchToProps = {
    confirmNominationsRequest,
    nominatePlayerForQuest
};

const mapStateToProps = (state, props) => ({
    auth: state.firebase.auth,
    currentGame: selectors.getCurrentGame(state, props),
    currentGameId: selectors.getGameId(props),
    myRole: selectors.getMyRole(state, props),
    users: state.firestore.data.users
});

export default withRouter(compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect(() => [
        {
            collection: 'games'
        },
        {
            collection: 'users'
        }
    ]),
)(GameStarted));

export { GameStarted as GameStartedUnconnected };
