export class Song implements SongInterface {
    public number = 0;
    public collection: Collection = {} as Collection;
    public name: {
        [languageKey: string]: string;
    } = {};
    public authors: Contributor[] = []
    public composers: Contributor[] = [];
    public leadSheetUrl = "";
    public yearWritten = 0;
    public originCountry: Country = {} as Country;
    public soundFiles: MediaFile[] = [];
    public videoFiles: MediaFile[] = [];
    public biography: MediaFile = {} as MediaFile;
    public melodyOrigin = {};

    constructor(song: SongInterface) {
        this.number = song.number;
        this.collection = song.collection;
        this.name = song.name;
        this.authors = song.authors;
        this.composers = song.composers;
        this.leadSheetUrl = song.leadSheetUrl;
        this.yearWritten = song.yearWritten;
        this.originCountry = song.originCountry;
        this.soundFiles = song.soundFiles;
        this.videoFiles = song.videoFiles;
        this.biography = song.biography;
        this.melodyOrigin = song.melodyOrigin;
    }

    public search(text: string): boolean {
        for (const key in Object.keys(this.name)) {
            if (this.name[key].includes(text)) return true;
        }

        return false;
    }

    public language(code: string): boolean {
        if (Object.keys(this.name).includes(code)) return true;

        return false;
    }
}
