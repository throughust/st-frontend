
interface Step {
    name: string;
    id: string;
    type: string;
}

interface LocaleString {
    [code: string]: string;
}

interface Language {
    key: string;
    name: string;
}

interface Origin {
    country: string;
    description: LocaleString;
}

interface Country {
    name: {
        [key: string]: string;
    };
    countryCode: string;
}

type SheetMusicOptions = {
    show: boolean;
    url?: string;
    originalKey?: string;
    transposition?: number;
    zoom?: number;
    type?: string;
}

type AudioTrack = {
    file: MediaFile;
    song?: Song;
    collection?: Collection;
}

type SongFilter = {
    themes: string[];
    origins: string[];
    videoFiles: string[];
    audioFiles: string[];
    contentTypes: string[];
    sheetMusicTypes: string[];
    hasLyrics: boolean;
    hasAudioFiles: boolean;
    hasVideoFiles: boolean;
    hasSheetMusic: boolean;
}
