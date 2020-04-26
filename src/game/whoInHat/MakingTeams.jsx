import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import defaultStyles from './MakingTeams.module.scss';
import * as helpers from '../helpers';
import StyledButton from '../../common/StyledButton/StyledButton';
import TextInput from '../../common/TextInput/TextInput';
import SuccessModal from '../../common/modal/SuccessModal';
import TeamsAndScore from './TeamsAndScore';

const playerExistsInTeam = (game, playerId) => game.teams
    .some(team => team.members.includes(playerId));

const findPlayersNotInTeam = game => game.currentPlayers
    .filter(playerId => !playerExistsInTeam(game, playerId));

const MakingTeams = props => {
    const [addingTeam, setAddingTeam] = useState(false);
    const [teamName, setTeamName] = useState('');

    const [addingWord, setAddingWord] = useState(false);
    const [word, setWord] = useState('');

    const closeAddingWord = useCallback(() => {
        setAddingWord(false);
        setWord('');
    }, [setAddingWord, setWord]);

    const closeAddingTeams = useCallback(() => {
        setAddingTeam(false);
        setTeamName('');
    }, [setAddingTeam, setTeamName]);

    const confirmAddNewTeam = useCallback(() => {
        props.addTeamRequest(props.currentGameId, teamName);
        setAddingTeam(false);
        setTeamName('');
        // eslint-disable-next-line
    }, [teamName, props.currentGameId, setAddingTeam, setTeamName, props.addTeamRequest]);

    const confirmAddWord = useCallback(() => {
        props.addWordRequest(props.currentGameId, word);
        setAddingWord(false);
        setWord('');
        // eslint-disable-next-line
    }, [word, props.currentGameId, setAddingWord, setWord, props.addWordRequest]);

    const joinTeam = useCallback(teamNameToJoin => {
        props.joinTeamRequest(props.currentGameId, teamNameToJoin);
        // eslint-disable-next-line
    }, [props.joinTeamRequest])

    return (
        <div className={props.styles.makingTeamsWrapper}>
            <div className={props.styles.makingTeamsHeader}>Teams are currently being selected</div>
            <div className={props.styles.createTeamWrapper}>
                <div>
                    <StyledButton
                        onClick={() => setAddingTeam(true)}
                        text="Add team"
                    />
                </div>
                {props.currentGame.isCustomNames && (
                    <div>
                        <StyledButton
                            onClick={() => setAddingWord(true)}
                            text="Add word"
                        />
                    </div>
                ) }
            </div>
            {props.currentGame.isCustomNames && (
                <div className={props.styles.numberOfWordsAdded}>
                    {`Number of words added: ${props.currentGame.words.length}`}
                </div>
            )}
            <div className={props.styles.playersNotInTeams}>
                <div className={props.styles.playersNotInTeamsHeader}>
                    Players not in teams
                </div>
                {findPlayersNotInTeam(props.currentGame).map(player => (
                    <div key={player}>
                        {helpers.mapUserIdToName(props.users, player)}
                    </div>
                ))}

            </div>

            <TeamsAndScore
                auth={props.auth}
                currentGame={props.currentGame}
                onTeamClick={joinTeam}
                users={props.users}
            />

            {props.currentGame.host === props.auth.uid && (
                <div className={props.styles.startGame}>
                    <StyledButton
                        onClick={() => props.startWhoInHatGameRequest(props.currentGameId)}
                        text="Start Game"
                    />
                </div>
            )}

            <SuccessModal
                backdrop
                closeModal={closeAddingWord}
                error
                isOpen={addingWord}
                headerMessage="Enter a word to guess"
            >
                <div className={props.styles.addNewWordWrapper}>
                    <TextInput onChange={setWord} value={word} label="Choose word" />

                    <div className={props.styles.confirmButtons}>
                        <StyledButton
                            text="Confirm"
                            onClick={confirmAddWord}
                        />

                        <StyledButton
                            color="secondary"
                            onClick={closeAddingWord}
                            text="Cancel"
                        />
                    </div>
                </div>
            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeAddingTeams}
                error
                isOpen={addingTeam}
                headerMessage="Enter a team name"
            >
                <div className={props.styles.addNewTeamWrapper}>
                    <TextInput onChange={setTeamName} value={teamName} label="Choose team name" />

                    <div className={props.styles.confirmButtons}>
                        <StyledButton
                            text="Confirm"
                            onClick={confirmAddNewTeam}
                        />

                        <StyledButton
                            color="secondary"
                            onClick={closeAddingTeams}
                            text="Cancel"
                        />
                    </div>
                </div>
            </SuccessModal>
        </div>
    );
};

MakingTeams.defaultProps = {
    auth: {
        uid: ''
    },
    addTeamRequest: noop,
    addWordRequest: noop,
    currentGame: {
        words: [],
        host: '',
        isCustomNames: false,
        teams: []
    },
    currentGameId: '',
    joinTeamRequest: noop,
    startWhoInHatGameRequest: noop,
    styles: defaultStyles,
    users: {}
};

MakingTeams.propTypes = {
    addTeamRequest: PropTypes.func,
    addWordRequest: PropTypes.func,
    auth: PropTypes.shape({
        uid: PropTypes.string
    }),
    currentGame: PropTypes.shape({
        words: PropTypes.arrayOf(PropTypes.string),
        host: PropTypes.string,
        isCustomNames: PropTypes.bool,
        teams: PropTypes.arrayOf(PropTypes.shape({
            members: PropTypes.arrayOf(PropTypes.string),
            name: PropTypes.string,
            score: PropTypes.number
        }))
    }),
    currentGameId: PropTypes.string,
    joinTeamRequest: PropTypes.func,
    startWhoInHatGameRequest: PropTypes.func,
    styles: PropTypes.objectOf(PropTypes.string),
    users: PropTypes.shape({})
};

export default MakingTeams;
