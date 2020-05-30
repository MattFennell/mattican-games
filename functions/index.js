/* eslint-disable max-len */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fp = require('lodash/fp');
const lodash = require('lodash');
const constants = require('./src/constants');
const common = require('./src/common');
const queries = require('./src/othelloLogic/queries');

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

exports.auth = require('./src/auth');
exports.articulate = require('./src/articulate');
exports.avalon = require('./src/avalon');
exports.hitler = require('./src/hitler');
exports.profile = require('./src/profile');
exports.shared = require('./src/shared');
exports.whoInHat = require('./src/whoInHat');

const operations = admin.firestore.FieldValue;
// currently at v8.13.0 for node

// // https://firebase.google.com/docs/reference/js/firebase.functions.html#functionserrorcod


//  1 = White
// -1 = Black
exports.createOthelloGame = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.name) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a game name');
        }

        if (!data.opponent) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide an opponent type');
        }

        if (data.opponent === constants.othelloPlayerTypes.Computer && !data.difficulty) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a computer difficulty');
        }

        if (data.opponent !== constants.othelloPlayerTypes.Computer && data.opponent !== constants.othelloPlayerTypes.Human) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a valid opponent type');
        }

        if (data.opponent === constants.othelloPlayerTypes.Computer && !constants.othelloDifficulties.includes(data.difficulty)) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a valid computer difficulty');
        }

        if (data.name && data.name.length > 32) {
            throw new functions.https.HttpsError('invalid-argument', 'Game name too long. Max 32 characters');
        }

        return db.collection('users').doc(context.auth.uid).get().then(response => {
            const { displayName } = response.data();
            return db.collection('games').where('name', '==', data.name).get().then(
                docs => {
                    if (docs.size > 0) {
                        throw new functions.https.HttpsError('already-exists', 'A game with that name already exists');
                    }
                    const initialBoard = {
                        rowZero: [0, 0, 0, 0, 0, 0, 0, 0],
                        rowOne: [0, 0, 0, 0, 0, 0, 0, 0],
                        rowTwo: [0, 0, 0, 0, 0, 0, 0, 0],
                        rowThree: [0, 0, 0, 1, -1, 0, 0, 0],
                        rowFour: [0, 0, 0, -1, 1, 0, 0, 0],
                        rowFive: [0, 0, 0, 0, 0, 0, 0, 0],
                        rowSix: [0, 0, 0, 0, 0, 0, 0, 0],
                        rowSeven: [0, 0, 0, 0, 0, 0, 0, 0]
                    };

                    return db.collection('games').add({
                        activePlayer: -1,
                        board: initialBoard,
                        currentPlayers: [context.auth.uid],
                        difficulty: data.difficulty ? data.difficulty : 'N/A',
                        hasFinished: false,
                        hasResigned: false,
                        hasStarted: false,
                        history: [],
                        host: context.auth.uid,
                        mode: 'Othello',
                        name: data.name,
                        opponentType: data.opponent,
                        playersReady: [],
                        usernameMappings: {
                            [context.auth.uid]: displayName
                        }
                    });
                }
            );
        });
    });

exports.editGame = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);
        return db.collection('games').doc(data.gameId).get().then(doc => {
            if (!data.opponent) {
                throw new functions.https.HttpsError('invalid-argument', 'Must provide an opponent type');
            }

            if (data.opponent === constants.othelloPlayerTypes.Computer && !data.difficulty) {
                throw new functions.https.HttpsError('invalid-argument', 'Must provide a computer difficulty');
            }

            if (data.opponent !== constants.othelloPlayerTypes.Computer && data.opponent !== constants.othelloPlayerTypes.Human) {
                throw new functions.https.HttpsError('invalid-argument', 'Must provide a valid opponent type');
            }

            if (data.opponent === constants.othelloPlayerTypes.Computer && !constants.othelloDifficulties.includes(data.difficulty)) {
                throw new functions.https.HttpsError('invalid-argument', 'Must provide a valid computer difficulty');
            }
            return doc.ref.update({
                difficulty: data.difficulty,
                opponentType: data.opponent
            });
        });
    });

exports.startGame = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);
        return db.collection('games').doc(data.gameId).get().then(doc => {
            if (!doc.exists) {
                throw new functions.https.HttpsError('not-found', 'Game not found. Contact Matt');
            }

            if (doc.data().host !== context.auth.uid) {
                throw new functions.https.HttpsError('invalid-argument', 'You are not the host');
            }

            if (doc.data().playersReady.length !== doc.data().currentPlayers.length
            && doc.data().opponentType === constants.othelloPlayerTypes.Human) {
                throw new functions.https.HttpsError('invalid-argument', 'Not everybody is ready');
            }

            const { opponentType, currentPlayers } = doc.data();

            const players = fp.shuffle([constants.othelloPlayerTypes.Human, opponentType]);

            if (opponentType === constants.othelloPlayerTypes.Computer) {
                return doc.ref.update({
                    activePlayer: -1,
                    hasStarted: true,
                    playerBlack: players[0] === constants.othelloPlayerTypes.Human ? context.auth.uid : constants.othelloPlayerTypes.Computer,
                    playerWhite: players[1] === constants.othelloPlayerTypes.Human ? context.auth.uid : constants.othelloPlayerTypes.Computer
                });
            }

            const randomPlayers = fp.shuffle(currentPlayers);

            return doc.ref.update({
                activePlayer: -1,
                hasStarted: true,
                playerBlack: randomPlayers[0],
                playerWhite: randomPlayers[1]
            });
        })
            .then(() => db.collection('games').doc(data.gameId).get().then(doc => {
                const {
                    activePlayer, board, difficulty, playerBlack, playerWhite
                } = doc.data();

                if ((activePlayer === 1 && playerWhite !== constants.othelloPlayerTypes.Computer)
            || (activePlayer === -1 && playerBlack !== constants.othelloPlayerTypes.Computer)) {
                    console.log('next player is a human');
                    return Promise.resolve();
                }

                console.log('board before', board);

                // Do the first computer turn
                const computerMove = queries.getComputerMove(board, activePlayer, difficulty);
                console.log('computer move', computerMove);
                const newBoard = queries.placeDisc(board, computerMove.row, computerMove.column, activePlayer);

                console.log('new board', newBoard);

                // It must always end with it becoming the other players turn (or the game ending above)
                return doc.ref.update({
                    activePlayer: activePlayer * -1,
                    board: newBoard
                });
            }));
    });

const runtimeOpts = {
    timeoutSeconds: 30,
    memory: '128MB'
};

exports.placeDisc = functions
    .runWith(runtimeOpts)
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);
        return db.collection('games').doc(data.gameId).get().then(doc => {
            if (!doc.exists) {
                throw new functions.https.HttpsError('not-found', 'Game not found. Contact Matt');
            }

            const {
                activePlayer, board, playerBlack, playerWhite
            } = doc.data();

            if (activePlayer === 1 && context.auth.uid !== playerWhite) {
                throw new functions.https.HttpsError('invalid-argument', 'It is not your turn');
            }

            if (activePlayer === -1 && context.auth.uid !== playerBlack) {
                throw new functions.https.HttpsError('invalid-argument', 'It is not your turn');
            }

            if (data.row < 0 || data.row > 7 || !common.isNumber(data.row)) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid row');
            }

            if (data.column < 0 || data.column > 7 || !common.isNumber(data.column)) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid row');
            }

            if (!queries.placeDisc(board, data.row, data.column, activePlayer)) {
                throw new functions.https.HttpsError('invalid-argument', 'That is not a valid move');
            }

            const newBoard = queries.placeDisc(board, data.row, data.column, activePlayer);

            const availableMovesWhite = queries.getAvailableMoves(newBoard, 1);
            const availableMovesBlack = queries.getAvailableMoves(newBoard, -1);

            if (availableMovesWhite.length === 0 && availableMovesBlack.length === 0) {
                return doc.ref.update({
                    board: newBoard,
                    hasFinished: true
                });
            }

            let nextPlayer = activePlayer * -1;

            // If black has no moves available, then White must have moves available since we know one of them does
            // Therefore the next player must be white
            if (availableMovesBlack.length === 0) {
                nextPlayer = 1;
                console.log('FORCING NEXT PLAYER TO BE WHITE');
            }

            // Vice versa
            if (availableMovesWhite.length === 0) {
                console.log('FORCING NEXT PLAYER TO BE BLACK');
                nextPlayer = -1;
            }

            return doc.ref.update({
                activePlayer: nextPlayer,
                board: newBoard
            });
        })
            .then(() => db.collection('games').doc(data.gameId).get().then(doc => {
                const {
                    activePlayer, board, difficulty, playerBlack, playerWhite
                } = doc.data();

                if ((activePlayer === 1 && playerWhite !== constants.othelloPlayerTypes.Computer)
                || (activePlayer === -1 && playerBlack !== constants.othelloPlayerTypes.Computer)) {
                    console.log('next player is a human');
                    return Promise.resolve();
                }

                // At this point we can assume that they have available moves
                // If they had no moves available, it wouldn't be their turn

                const computerMove = queries.getComputerMove(board, activePlayer, difficulty);
                let newBoard = queries.placeDisc(board, computerMove.row, computerMove.column, activePlayer);

                const availableMovesWhite = queries.getAvailableMoves(newBoard, 1);
                const availableMovesBlack = queries.getAvailableMoves(newBoard, -1);

                if (availableMovesWhite.length === 0 && availableMovesBlack.length === 0) {
                    return doc.ref.update({
                        board: newBoard,
                        hasFinished: true
                    });
                }

                // This is after the computer has played and we know that at least one player can go
                // It should keep making moves whilst the human has no available moves

                while (queries.getNumberOfAvailableMoves(newBoard, activePlayer * -1) === 0) {
                    console.log('Generating a new computer move', newBoard);
                    console.log('new board', newBoard);
                    const nextComputerMove = queries.getComputerMove(board, activePlayer, difficulty);
                    newBoard = queries.placeDisc(board, nextComputerMove.row, nextComputerMove.column, activePlayer);
                }


                // It must always end with it becoming the other players turn (or the game ending above)
                return doc.ref.update({
                    activePlayer: activePlayer * -1,
                    board: newBoard
                });
            }));
    });


exports.leaveGame = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);
        return db.collection('games').doc(data.gameId).get().then(doc => {
            if (!doc.exists) {
                throw new functions.https.HttpsError('not-found', 'Game not found. Contact Matt');
            }

            const { currentPlayers } = doc.data();

            if (currentPlayers.length === 1) {
                return doc.ref.delete();
            }

            return doc.ref.update({
                currentPlayers: operations.arrayRemove(context.auth.uid)
            });
        });
    });

exports.resign = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);
        return db.collection('games').doc(data.gameId).get().then(doc => {
            if (!doc.exists) {
                throw new functions.https.HttpsError('not-found', 'Game not found. Contact Matt');
            }

            if (doc.data().currentPlayers.length === 1) {
                return doc.ref.delete();
            }

            return doc.ref.update({
                hasResigned: true,
                currentPlayers: operations.arrayRemove(context.auth.uid)
            });
        });
    });
