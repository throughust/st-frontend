import api from "@/services/api";
import { ApiCollection, ApiContributor, Sort } from "dmb-api";
import { Lyrics, Song } from ".";
import { BaseClass } from "./baseClass";
import { cache } from "@/services/cache";
import { notify } from "@/services/notify";
import { CollectionItem } from "./collectionItem";
import { appSession } from "@/services/session";
import { StripeMutationTypes } from "@/store/modules/stripe/mutation-types";
import { Category } from "./category";
import { Country, Genre, Theme } from "./items";

type CollectionSettings = {
    offline: boolean;
    lastSynced?: string;
}

let closeId: string | null = null;

export class Collection extends BaseClass implements ApiCollection {
    public id;
    private _key;
    public enabled;
    public freeSongs;
    public keys: LocaleString;
    public defaultType;

    private _defaultSort: Sort;

    public get defaultSort(): Sort {
        if (this._defaultSort == "author") 
            if (this.hasAuthors)
                return "author";
            else 
                return "title";
        if (this._defaultSort == "composer") 
            if (this.hasAuthors)
                return "composer";
            else 
                return "title";

        return this._defaultSort;
    }

    private _available?: boolean;

    public get available() {
        return this._available == true;    
    }

    public details?: LocaleString;
    public hasChords: {
        [lang: string]: boolean;
    };

    public image: string;

    public settings?: CollectionSettings;

    private _initialized = false;
    private _loading = false;

    public songs: Song[] = [];
    public lyrics: Lyrics[] = [];
    
    public hasAuthors = false;
    public hasComposers = false;
    public hasCountries = false;
    public hasThemes = false;
    public hasCategories = false;
    public hasGenres = false;

    public themeTypes: Theme[] = [];

    public loadingLyrics = false;

    private _themes?: CollectionItem<Theme>[];
    private _loadingThemes = false;

    private _categories?: CollectionItem<Category>[];

    private _genres?: CollectionItem<Genre>[];

    private _authors: CollectionItem<ApiContributor>[] = [];
    private _composers: CollectionItem<ApiContributor>[] = [];

    public get authors() {
        return this._authors;
    }

    public get composers() {
        return this._composers;
    }

    private _countries?: CollectionItem<Country>[];
    private _loadingCountries = false;

    private _currentLanguage = "";

    public contributors: CollectionItem<ApiContributor>[] = [];

    public listType: Sort;

    public buttons: {
        label: string;
        value: string;
        selected: () => boolean;
    }[] = [];

    constructor(collection: ApiCollection) {
        super();
        this._key = collection.key;
        this.enabled = collection.enabled;
        this.freeSongs = collection.freeSongs;
        this.keys = collection.keys ?? {};
        this.defaultType = collection.defaultType;
        this._defaultSort = collection.defaultSort;
        this.listType = this.defaultSort;
        this.id = collection.id;
        this.name = collection.name;
        this.image = collection.image;
        this._available = collection.available;
        this.details = collection.details;
        this.hasChords = collection.hasChords ?? {};
        cache.get("config", "collection_" + this.id).then((r) => {
            this.settings = JSON.parse(r as string | undefined ?? "{\"offline\": false}") as CollectionSettings;
        });
    }

    public get key() {
        return this.keys[this.store.getters.languageKey] ?? this._key;
    }

    public getKeys() {
        const keys = Object.entries(this.keys).map(e => e[1]);
        return keys.length ? keys : [this.key];
    }

    public async setSettings(settings: CollectionSettings) {
        this.settings = settings;
        await cache.set("config", "collection_" + this.id, JSON.stringify(settings));
    }

    private async initialize() {
        if (!this._initialized) {
            this._initialized = true;

            await new Promise(r => setTimeout(r, 10));

            await appSession.init();

            if (this.available) {
                this.songs = appSession.songs.filter(s => s.collectionIds.some(c => this.id == c)).sort((a, b) => a.getNumber(this.id) - b.getNumber(this.id));
            } else {
                const files = await api.songs.getFiles([this.id]);
                appSession.files.push(...files.result);
                this.songs = ((await api.songs.getAllSongs([this.id])).result.map(s => new Song(s))).sort((a, b) => a.getNumber(this.id) - b.getNumber(this.id));
            }

            this.hasAuthors = this.hasAuthors || this.songs.some(s => s.participants.some(p => p.type == "author"));
            this.hasComposers = this.hasComposers || this.songs.some(s => s.participants.some(p => p.type == "composer"));
            this.hasThemes = this.hasThemes || this.songs.some(s => s.themeIds.length > 0);
            this.hasCountries = this.hasCountries || this.songs.some(s => s.origins.some(o => o.type == "text"));
            this.hasCategories = this.hasCategories || this.songs.some(s => s.categoryIds.length > 0);
            this.hasGenres = this.hasGenres || this.songs.some(s => s.genreIds.length > 0);

            this.buttons = [
                {
                    label: "common.number",
                    value: "number",
                    selected: () => this.listType == "number",
                },
                {
                    label: "common.title",
                    value: "title",
                    selected: () => this.listType == "title",
                },
                {
                    label: "song.author",
                    value: "author",
                    selected: () => this.listType == "author",
                    hidden: !this.hasAuthors,
                },
                {
                    label: "song.composer",
                    value: "composer",
                    selected: () => this.listType == "composer",
                    hidden: !this.hasComposers,
                },
                {
                    label: "song.genre",
                    value: "genre",
                    selected: () => this.listType == "genre",
                    hidden: !this.hasGenres,
                },
                {
                    label: "song.category",
                    value: "categories",
                    selected: () => this.listType == "categories",
                    hidden: !this.hasCategories,
                },
                {
                    label: "common.views",
                    value: "views",
                    selected: () => this.listType == "views",
                },
            ].filter(
                (b) =>
                    b.hidden != true,
            );

            this._authors = appSession.contributors.map(c => {
                const cItem = new CollectionItem<ApiContributor>({
                    songIds: this.songs.filter(s => s.participants.find(p => p.contributorId == c.id && p.type == "author")).map(s => s.id),
                    id: c.id,
                    fileIds: c.fileIds,
                    item: c.item,
                });
                return cItem;
            }).filter(i => i.songIds.length);
            
            
            this._composers = appSession.contributors.map(c => {
                const cItem = new CollectionItem<ApiContributor>({
                    songIds: this.songs.filter(s => s.participants.find(p => p.contributorId == c.id && p.type == "composer")).map(s => s.id),
                    id: c.id,
                    fileIds: c.fileIds,
                    item: c.item,
                });
                return cItem;
            }).filter(i => i.songIds.length);

            this.contributors = appSession.contributors.filter(i => this.songs.some(s => i.songIds.includes(s.id)));
        }
    }
    
    public async load(language: string) {
        if (this._loading) return;
        this._loading = true;
        await this.initialize();

        if (this.settings?.offline) {
            if (navigator.onLine) {
                try {
                    const key = "lyrics_lastUpdated_" + this.id + "_" + language;
                    const lastUpdated = await cache.get("config", key) as string | undefined;
                    const updateLyrics = await api.songs.getAllLyrics(this, language, "json", 0, lastUpdated);

                    await cache.replaceEntries("lyrics", updateLyrics.reduce((a, b) => {
                        a[b.id] = b;
                        return a;
                    }, {} as {
                        [id: string]: Lyrics;
                    }));

                    const now = new Date();

                    await cache.set("config", key, new Date(now.getTime() - 172800).toISOString());
                }
                catch(e) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const error = e as any;
                    notify("error", "Error occured", "warning", error);
                    this.lyrics = await api.songs.getAllLyrics(this, language, "json", 0);
                }
            }

            this.lyrics = this.lyrics.length > 0 ? this.lyrics : this.lyrics = (await cache.getAll("lyrics")).filter(l => l.collectionIds.some(col => col == this.id));
        }

        this._loading = false;
    }

    public get loading() {
        return this._loading || this._loadingThemes || this._loadingCountries;
    }

    public get product() {
        return this.store.state.stripe.products.find(p => p.collectionIds.includes(this.id));
    }

    // public get owned() {
    //     const prod = this.product;

    //     return prod && this.store.getters.user?.subscriptions.some(s => s.productIds.includes(prod.id));
    // }

    public get inCart() {
        return this.product ? this.store.state.stripe.cart.includes(this.product?.id) : false;
    }

    public addToCart() {
        const prod = this.product;
        this.store.commit(StripeMutationTypes.CART_ADD_PRODUCT, prod?.id);

        if (this.store.state.stripe.cart.length > 1) {
            this.store.commit(StripeMutationTypes.CART_SHOW, true);
            closeId = this.id;

            setTimeout(() => {
                if (closeId != null && closeId == this.id) {
                    this.store.commit(StripeMutationTypes.CART_SHOW, false);
                    closeId = null;
                }
            }, 3000);
        }
    }

    public getDetails(language: string){
        return this.getTranslatedProperty(this.details, language);
    }

    public getSong(number: number) {
        return this.songs.find(s => s.number == number);
    }

    public filteredSongs(filter: string, songFilter: SongFilter) {
        filter = filter.toLowerCase();

        const context: {
            [key: string]: string;
        } = {};

        const number = parseInt(filter);

        let numbers: number[] = [];
        
        if (number) {
            numbers = this.songs.filter(s => s.number == number || s.number.toString().includes(number.toString())).map(s => s.number);
        } else {
            for (const song of this.songs) {
                if (!numbers.includes(song.number)) {
                    if (song.names.find(n => n.toLowerCase().includes(filter)) || song.id.toLowerCase().includes(filter)) {
                        numbers.push(song.number);
                        continue;
                    }
                    if (song.Authors.find(a => a.name.toLowerCase().includes(filter)) || song.Composers.find(c => c.name.toLowerCase().includes(filter))) {
                        numbers.push(song.number);
                        continue;
                    }
                }
            }
        }

        const {themes, audioFiles, videoFiles, origins, contentTypes, sheetMusicTypes } = songFilter;

        const songs = this.songs.filter(s => 
            (numbers.includes(s.number) || s.rawContributorNames.includes(filter)) 
            && (themes.length == 0 || s.themes.filter(t => themes.includes(t.id)).length)
            && (origins.length == 0 || (s.melodyOrigin != null && origins.includes(s.melodyOrigin.country)))
            && (audioFiles.length == 0 || s.audioFiles.filter(a => audioFiles.includes(a.category)).length)
            && (videoFiles.length == 0 || s.videoFiles.filter(v => videoFiles.includes(v.category)).length)
            && (contentTypes.length == 0 || (contentTypes.includes("lyrics") 
                && s.hasLyrics) || (contentTypes.includes("audio") 
                && s.audioFiles.length > 0) || (contentTypes.includes("video") 
                && s.videoFiles.length > 0) || (contentTypes.includes("sheetmusic") 
                && s.sheetMusic.length > 0) )
            && (sheetMusicTypes.length == 0 || s.sheetMusic.find(sm => sheetMusicTypes.includes(sm.category))),
        );

        return {
            songs,
            context,
        };
    }

    public get origins() {
        const origins: Origin[] = [];

        for (const song of this.songs) {
            if (song.melodyOrigin != undefined && !origins.find(o => o.country == song.melodyOrigin?.country)) {
                origins.push(song.melodyOrigin);
            }
        }

        return origins;
    }

    public async getList(value: Sort) {
        if (value == "countries") {
            if (!this._countries) {
                this._loadingCountries = true;

                await new Promise(r => setTimeout(r, 10));

                const songs = this.songs.filter(s => s.origins.some(o => o.type === "text"));

                this._countries = appSession.countries.map(i => 
                    new CollectionItem({
                        id: i.id,
                        item: i,
                        songIds: songs.filter(s => s.origins.some(o => o.country === i.countryCode)).map(s => s.id),
                        fileIds: [],
                    }),
                );

                this._loadingCountries = false;
                return this._countries?.length;
            }
        }
        if (value == "themes") {
            if (!this._themes) {
                this._loadingThemes = true;

                await new Promise(r => setTimeout(r, 10));

                const songs = this.songs.filter(i => i.themeIds.length);

                this._themes = appSession.themes.map(i => 
                    new CollectionItem({
                        id: i.id,
                        item: i,
                        songIds: songs.filter(s => s.themeIds.includes(i.id)).map(s => s.id),
                        fileIds: [],
                    }),
                );

                this._loadingThemes = false;
                return this._themes.length;
            }
        }
        if (value == "genre") {
            if (!this._genres) {

                this._genres = appSession.genres.map(i => 
                    new CollectionItem<Genre>({
                        songIds: this.songs.filter(s => s.genreIds.includes(i.id)).map(s => s.id),
                        id: i.id,
                        item: i,
                        fileIds: [],
                    }),
                ).filter(i => i.songIds.length).sort((a, b) => a.name > b.name ? 1 : -1);

                return this._genres.length;
            }
        }
        if (value == "categories") {
            if (!this._categories) {
                const songs = this.songs.filter(i => i.categoryIds.length).sort((a, b) => a.getName() < b.getName() ? 1 : -1);

                this._categories = appSession.categories.map(i => 
                    new CollectionItem({
                        id: i.id,
                        item: i,
                        songIds: songs.filter(s => s.categoryIds.includes(i.id)).map(s => s.id),
                        fileIds: [],
                    }),
                );

                return this._categories.length;
            }
        }

        this.listType = value;

        return 1;
    }

    public get countries(): CollectionItem<Country>[] {
        return this._countries ?? [];
    }

    public get themes(): CollectionItem<Theme>[] {
        return this._themes ?? [];
    }

    public get categories(): CollectionItem<Category>[] {
        return this._categories ?? [];
    }

    public get genres() {
        return this._genres ?? [];
    }
}
