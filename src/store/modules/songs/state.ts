import { Collection, CollectionItem, Song } from "@/classes";
import SongFilter from "@/classes/songFilter";
import { ISearchResultGroup } from "hiddentreasures-js/build/models/searchResultGroup";
import { SheetMusicOptions } from "songtreasures";
import { ApiContributor, IMediaFile } from "songtreasures-api";


export type SongViewType = "default" | "performance" | "chords";

export type AudioTrack = {
    file: IMediaFile;
    collection?: Collection;
}

export type State = {
    collectionId?: string;
    language: string;
    song?: Song;
    songId?: string;
    transposition?: number;
    newMelody: boolean;
    lines: string[];
    collections: Collection[];
    initialized: boolean;
    list: string;
    contributorItem?: CollectionItem<ApiContributor>;
    filter: SongFilter;
    audio?: AudioTrack;
    sheetMusic?: SheetMusicOptions;
    search?: string;
    searchResult?: ISearchResultGroup;
    view: SongViewType;
}

export const state: State = {
    collections: [],
    lines: [],
    initialized: false,
    list: "default",
    newMelody: false,
    filter: new SongFilter({
        themes: [],
        videoFiles: [],
        audioFiles: [],
        origins: [],
        categoryIds: [],
        contentTypes: [],
        sheetMusicTypes: [],
        hasAudioFiles: false,
        hasLyrics: false,
        hasSheetMusic: false,
        hasVideoFiles: false,
    }),
    language: "en",
    view: "default",
};
