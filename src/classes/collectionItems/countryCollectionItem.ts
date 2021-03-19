import { ApiCountryCollectionItem } from "dmb-api";
import { Song } from "../song";
import { BaseCollectionItem } from "./baseCollectionItem";


export class CountryCollectionItem extends BaseCollectionItem<Country> {
    public songIds: string[];
    public songs: Song[];

    constructor(ci: ApiCountryCollectionItem) {
        super();
        this.item = ci.country;
        this.songIds = ci.songIds;
        this.songs = ci.songs?.map(s => new Song(s)) ?? [];
    }
}