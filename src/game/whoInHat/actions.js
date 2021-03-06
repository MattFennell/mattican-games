const pre = 'WHO_IN_HAT/';

export const ADD_WORD_REQUEST = `${pre}ADD_WORD_REQUEST`;
export const CANCEL_ADDING_WORD = `${pre}CANCEL_ADDING_WORD`;
export const START_WHO_IN_HAT_GAME_REQUEST = `${pre}START_WHO_IN_HAT_GAME_REQUEST`;
export const START_WHO_IN_HAT_ROUND_REQUEST = `${pre}START_WHO_IN_HAT_ROUND_REQUEST`;
export const EDIT_WHO_IN_HAT_GAME_REQUEST = `${pre}EDIT_WHO_IN_HAT_GAME_REQUEST`;
export const LOAD_SCORE_SUMMARY_REQUEST = `${pre}LOAD_SCORE_SUMMARY_REQUEST`;
export const CONFIRM_SCORE_REQUEST = `${pre}CONFIRM_SCORE_REQUEST`;

export const cancelAddingWord = () => ({
    type: CANCEL_ADDING_WORD
});

export const addWordRequest = (gameId, word) => ({
    type: ADD_WORD_REQUEST,
    gameId,
    word
});

export const startWhoInHatGameRequest = gameId => ({
    type: START_WHO_IN_HAT_GAME_REQUEST,
    gameId
});

export const startWhoInHatRoundRequest = gameId => ({
    type: START_WHO_IN_HAT_ROUND_REQUEST,
    gameId
});

export const editGameRequest = (gameId, skippingRule,
    isCustomNames, scoreCap, timePerRound) => ({
    type: EDIT_WHO_IN_HAT_GAME_REQUEST,
    gameId,
    skippingRule,
    isCustomNames,
    scoreCap,
    timePerRound
});

export const loadScoreSummaryRequest = gameId => ({
    type: LOAD_SCORE_SUMMARY_REQUEST,
    gameId
});

export const confirmScoreRequest = (gameId, confirmedWords) => ({
    type: CONFIRM_SCORE_REQUEST,
    gameId,
    confirmedWords
});
