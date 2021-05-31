import { Collection, Song } from "@/classes";
import { ApiSong, MediaFile } from "dmb-api";
import { items, songs } from "./api";
import { cache } from "./cache";
import { notify } from "./notify";

export class Session {
    private _initialized?: boolean;
    public songs: Song[] = [];
    public collections: Collection[] = [];
    public files: MediaFile[] = [];

    public themes: Theme[] = [];
    public countries: Country[] = [];
    public copyrights: Copyright[] = [];
    public languages: Language[] = [];

    public get initialized() {
        return this._initialized == true;
    }

    public async init() {
        if (this._initialized == false) {
            while(this._initialized == false) {
                await new Promise(r => setTimeout(r, 100));
            }
            return;
        }

        this._initialized = false;
        this.collections = (await songs.getCollections()).map(c => new Collection(c));

        const ownedCols = this.collections.filter(c => c.available).map(c => c.id);

        const previousCols = await cache.get("config", "owned_collections");

        if (previousCols) {
            const fetchSongs = ownedCols.filter(c => !(JSON.parse(previousCols as string) as string[]).some(i => i == c));
            
            if (fetchSongs.length) {
                const s = await songs.getAllSongs(fetchSongs);

                await cache.replaceEntries("songs", s.reduce((a, b) => {
                    a[b.id] = b;
                    return a;
                }, {} as {
                    [id: string]: ApiSong;
                }));

                const f = await songs.getFiles(fetchSongs);

                await cache.replaceEntries("files", f.reduce((a, b) => {
                    a[b.id] = b;
                    return a;
                }, {} as {
                    [id: string]: MediaFile;
                }));
            }
        }

        await cache.set("config", "owned_collections", JSON.stringify(ownedCols));
        
        if (ownedCols.length) {
            // const offline = (await cache.get("config", "offline")) == true;
            // if (offline) {

                try {
                    const key = "last_updated_files";
                    const lastUpdated = await cache.get("config", key) as string | undefined;

                    const now = new Date();
    
                    if (lastUpdated == undefined || (now.getTime() - new Date(lastUpdated).getTime()) > 86400000) {
                        const updateSongs = await songs.getFiles(ownedCols, lastUpdated);
    
                        await cache.replaceEntries("files", updateSongs.reduce((a, b) => {
                            a[b.id] = b;
                            return a;
                        }, {} as {
                            [id: string]: MediaFile;
                        }));
        
                        await cache.set("config", key, now.toISOString());
                    }
                } catch(e) {
                    notify("error", "Error fetching files", "warning", e);
                    this.files = await songs.getFiles(ownedCols);
                }

                this.files = this.files.length > 0 ? this.files : (await cache.getAll("files"));
                
            // } else {
                try {
                    const key = "last_updated_songs";
                    const lastUpdated = await cache.get("config", key) as string | undefined;
    
                    const now = new Date();
    
                    if (lastUpdated == undefined || (now.getTime() - new Date(lastUpdated).getTime()) > 86400000) {
                        const updateSongs = await songs.getAllSongs(ownedCols, lastUpdated);
    
                        await cache.replaceEntries("songs", updateSongs.reduce((a, b) => {
                            a[b.id] = b;
                            return a;
                        }, {} as {
                            [id: string]: ApiSong;
                        }));
        
                        await cache.set("config", key, now.toISOString());
                    }
                }
                catch(e) {
                    notify("error", "Error occured", "warning", e);
                    this.songs = (await songs.getAllSongs(ownedCols)).map(s => new Song(s));
                }
                
                this.songs = this.songs.length > 0 ? this.songs : (await cache.getAll("songs")).map(s => new Song(s));
            //     this.songs = (await songs.getAllSongs(ownedCols)).map(s => new Song(s));
            // }
        }

        items.getCountries().then(c => {
            this.countries = c;
        });
        items.getThemes().then(t => {
            this.themes = t;
        });
        items.getCopyrights().then(c => {
            this.copyrights = c;
        });

        this.languages = await items.getLanguages();

        this._initialized = true;
    }
}

export const appSession = new Session();
