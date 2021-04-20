export enum SessionActionTypes {
    INITIALIZED = "INITIALIZED",

    SESSION_START = "SESSION_START",
    SESSION_LOGIN_SOCIAL = "SESSION_LOGIN_SOCIAL",
    SESSION_LOGIN_EMAIL_PASSWORD = "SESSION_LOGIN_EMAIL_PASSWORD",
    SESSION_CREATE_USER = "SESSION_CREATE_USER",

    SESSION_SAVE_SETTINGS = "SESSION_SAVE_SETTINGS",
    SESSION_CLEAR = "SESSION_CLEAR",
    
    SET_DISPLAY_NAME = "SET_DISPLAY_NAME",

    PLAYLIST_CREATE = "PLAYLIST_CREATE",
    PLAYLIST_DELETE = "PLAYLIST_DELETE",
    PLAYLIST_ADD_SONG = "PLAYLIST_ADD_SONG",
    PLAYLIST_ADD_FILE = "PLAYLIST_ADD_FILE",
    PLAYLIST_REMOVE_ENTRY = "PLAYLIST_REMOVE_ENTRY",

    LOG_SONG_ITEM = "LOG_SONG_ITEM",
    LOG_CONTRIBUTOR_ITEM = "LOG_CONTRIBUTOR_ITEM",
}
