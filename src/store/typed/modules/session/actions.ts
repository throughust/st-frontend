import router from "@/router";
import api from "@/services/api";
import auth from "@/services/auth";
import { ensureLanguageIsFetched } from "@/i18n";
import { RootState } from "../..";
import { ApiActivity, ApiSong } from "dmb-api";
import { ActionContext, ActionTree, Commit } from "vuex";
import { SessionActionTypes } from "./action-types";
import { SessionMutationTypes } from "./mutation-types";
import { Mutations } from "./mutations";
import { State } from "./state";
import { SongsMutationTypes } from "../songs/mutation-types";

const smTs: {
    [key: string]: number;
} = {
    "C": 0,
    "Db": -1,
    "D": -2,
    "Eb": 9,
    "E": 8,
    "F": 7,
    "F#": 6,
    "G": 5,
    "Ab": 4,
    "A": 3,
    "Bb": 2,
    "B": 1,
};

const ts: {
    [key: string]: number;
} = {
    "C": 0,
    "Db": -1,
    "D": 10,
    "Eb": -3,
    "E": 8,
    "F": 7,
    "F#": 6,
    "G": 5,
    "Ab": -8,
    "A": 3,
    "Bb": -10,
    "B": 1,
};

async function init(state: State, commit: Commit): Promise<void> {
    const user = await api.session.getCurrentUser();
    user.displayName = auth.user?.displayName ?? user.displayName;
    
    api.playlists.getPlaylists().then(p => {
        commit(SessionMutationTypes.SET_PLAYLISTS, p);
    });
    const items = JSON.parse(localStorage.getItem("activities") ?? "[]") as ApiActivity[];

    if (items.length) {
        await api.activity.pushActivities(items);
        localStorage.setItem("activities", "[]");
    }

    api.activity.getActivities().then(a => {
        commit(SessionMutationTypes.SET_LOG_ITEMS, a);
    });

    commit(SessionMutationTypes.SET_USER, user);
    try {
        const languages = await api.items.getLanguages();
        commit(SessionMutationTypes.SET_LANGUAGES, languages);
        const collections = await api.songs.getCollections();
        commit(SessionMutationTypes.COLLECTIONS, collections);

        
    } catch (e) {
        //console.log(e);
    }
    if (router.currentRoute.value.name == "login") {
        router.push(state.redirect ?? "/");
    }
    await ensureLanguageIsFetched();

    commit(SessionMutationTypes.INITIALIZED);
    commit(SongsMutationTypes.SET_SHEETMUSIC_TRANSPOSITION, smTs[user.settings?.defaultTransposition ?? "C"]);
    commit(SongsMutationTypes.SET_TRANSPOSITION, ts[user.settings?.defaultTransposition ?? "C"]);
}

type AugmentedActionContext = {
    commit<K extends keyof Mutations>(
        key: K,
        payload: Parameters<Mutations[K]>[1],
    ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, "commit">;

export interface Actions {
    /**
     * Initialize session.
     * @param param0 
     */
    [SessionActionTypes.SESSION_START]({ state, commit }: AugmentedActionContext): Promise<void>;
    [SessionActionTypes.SESSION_CLEAR]({ commit }: AugmentedActionContext): Promise<void>;
    [SessionActionTypes.SESSION_LOGIN_SOCIAL]({ state, commit }: AugmentedActionContext, payload: string): Promise<void>;
    [SessionActionTypes.SESSION_LOGIN_EMAIL_PASSWORD]({ state, commit }: AugmentedActionContext, payload: {
        email: string;
        password: string;
        stayLoggedIn: boolean;
    }): Promise<void>;
    [SessionActionTypes.SESSION_CREATE_USER]({ state, commit }: AugmentedActionContext, payload: { 
        email: string; 
        password: string; 
        displayName: string;
    }): Promise<void>;
    [SessionActionTypes.SESSION_SAVE_SETTINGS]({ commit }: AugmentedActionContext): Promise<void>;

    [SessionActionTypes.SET_DISPLAY_NAME]({ state, commit }: AugmentedActionContext, payload: string): Promise<void>;
    
    [SessionActionTypes.PLAYLIST_CREATE]({ commit }: AugmentedActionContext, payload: { name: string }): Promise<void>;
    [SessionActionTypes.PLAYLIST_DELETE]({ commit }: AugmentedActionContext, payload: string): Promise<void>;
    [SessionActionTypes.PLAYLIST_ADD_FILE]({ commit }: AugmentedActionContext, payload: {
        playlistId: string;
        fileId: string;
    }): Promise<void>;
    [SessionActionTypes.PLAYLIST_ADD_SONG]({ commit }: AugmentedActionContext, payload: {
        playlistId: string;
        songId: string;
    }): Promise<void>;
    [SessionActionTypes.PLAYLIST_REMOVE_ENTRY]({ commit }: AugmentedActionContext, payload: {
        playlistId: string;
        entryId: string;
    }): Promise<void>;

    [SessionActionTypes.LOG_ITEM]({ commit }: AugmentedActionContext, payload: ApiSong): Promise<void>;
}

export const actions: ActionTree<State, RootState> & Actions = {
    async [SessionActionTypes.SESSION_START]({state, commit}): Promise<void> {
        if (auth.isAuthenticated) {
            if (!state.initialized) {
                await init(state, commit);
            }
        } else {
            await auth.sendLinkToEmail();
        }
    },
    async [SessionActionTypes.SESSION_CLEAR]({ commit }): Promise<void> {
        await auth.logout();
        commit(SessionMutationTypes.CLEAR_SESSION, undefined);
    },
    async [SessionActionTypes.SESSION_LOGIN_SOCIAL]({ state, commit }, provider): Promise<void> {
        await auth.login(provider);

        if (auth.isAuthenticated) {
            await init(state, commit);
        } else {
            await auth.sendLinkToEmail();
        }
    },
    async [SessionActionTypes.SESSION_LOGIN_EMAIL_PASSWORD]({ state, commit }, obj): Promise<void> {
        await auth.loginWithEmailAndPassword(obj.email, obj.password, obj.stayLoggedIn);

        if (auth.isAuthenticated) {
            await init(state, commit);
        } else {
            await auth.sendLinkToEmail();
        }
    },
    async [SessionActionTypes.SESSION_CREATE_USER]({ state, commit}, object ): Promise<void> {
        await auth.createEmailAndPasswordUser(object.email, object.password, object.displayName);

        if (auth.isAuthenticated) {
            await init(state, commit);
        } else {
            await auth.sendLinkToEmail();
        }
    },
    async [SessionActionTypes.SESSION_SAVE_SETTINGS]({ state, commit }): Promise<void> {
        if (state.currentUser?.settings) {
            const user = await api.session.saveUser(state.currentUser.settings);
            commit(SessionMutationTypes.SET_USER, user);
            await ensureLanguageIsFetched();
        }
    },

    async [SessionActionTypes.SET_DISPLAY_NAME]({ state, commit }, name: string): Promise<void> {
        await auth.setDisplayName(name);
        
        commit(SessionMutationTypes.SET_USER, Object.assign({
            displayName: name,
        }, state.currentUser));
    },

    // PLAYLIST RELATED ACTIONS
    async [SessionActionTypes.PLAYLIST_CREATE]({ commit }, obj: { name: string }): Promise<void> {
        const res = await api.playlists.createPlaylist(obj.name);

        commit(SessionMutationTypes.SET_PLAYLIST, res);
    },
    async [SessionActionTypes.PLAYLIST_DELETE]({ commit }, id): Promise<void> {
        await api.playlists.deletePlaylist(id);
        commit(SessionMutationTypes.DELETE_PLAYLIST, id);
    },
    async [SessionActionTypes.PLAYLIST_ADD_FILE]({ commit }, obj): Promise<void> {
        const res = await api.playlists.addToPlaylist(obj.playlistId, obj.fileId, "file");

        if (res) {
            commit(SessionMutationTypes.UPDATE_PLAYLIST, res);
        }
    },
    async [SessionActionTypes.PLAYLIST_ADD_SONG]({ commit }, obj): Promise<void> {
        const res = await api.playlists.addToPlaylist(obj.playlistId, obj.songId, "song");

        if (res) {
            commit(SessionMutationTypes.UPDATE_PLAYLIST, res);
        }
    },
    async [SessionActionTypes.PLAYLIST_REMOVE_ENTRY]({ commit }, obj): Promise<void> {
        const res = await api.playlists.removeEntryFromPlaylist(obj.playlistId, obj.entryId);

        if (res) {
            commit(SessionMutationTypes.UPDATE_PLAYLIST, res);
        }
    },

    // LOG ITEMS
    async [SessionActionTypes.LOG_ITEM]({ commit }, song: ApiSong): Promise<void> {
        const items = JSON.parse(localStorage.getItem("activities") ?? "[]") as ApiActivity[];

        items.push({
            loggedDate: new Date().toISOString(),
            songId: song.id,
            song: song,
        });

        if (items.length >= 10) {
            await api.activity.pushActivities(items);
            localStorage.setItem("activities", "[]");
        } else {
            localStorage.setItem("activities", JSON.stringify(items));
        }

        commit(SessionMutationTypes.SET_LOG_ITEMS, items);
    },
};