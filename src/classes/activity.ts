import { appSession } from "@/services/session";
import { useStore } from "@/store";
import { IActivity } from "songtreasures-api";
import { RouteLocationRaw } from "vue-router";
import { Collection } from ".";
import { Song } from ".";


export class Activity {
    private activity: IActivity;
    private store = useStore();

    constructor(activity: IActivity) {
        this.activity = activity;
    }

    public get item() {
        if (this.activity.type == "song") {
            return appSession.songs.find(i => i.id == this.activity.itemId);
        } else {
            return appSession.contributors.find(i => i.id == this.activity.itemId)?.item;
        }
    }

    public get name() {
        const name = this.item?.name;
        if (!name) return null;
        if (typeof(name) == "string") {
            return name;
        } else {
            return name[this.store.getters.languageKey] ?? name.en ?? Object.values(name)[0];
        }
    }

    public getRouterLink(collections: Collection[]): RouteLocationRaw {
        const link: RouteLocationRaw = this.activity.type == "song" ? {
            name: "song",
            params: {
                collection: collections.find(c => this.collectionIds.some(col => col == c.id))?.key ?? "HV",
                number: (this.item as Song | undefined)?.collections[0].number ?? "1",
            },
        } : {
            name: "contributor",
            params: {
                contributor: this.activity.itemId,
            },
        };
        return link;
    }

    public getImage(collections: Collection[]): string | undefined {
        return this.type == "song" ? collections.find(c => this.collectionIds.some(col => col == c.id))?.image : this.item?.image ?? "/img/portrait-placeholder.png";
    }

    public timeSince() {
        try {
            const rtfl = new Intl.RelativeTimeFormat(this.store.getters.languageKey, {
                localeMatcher: "best fit",
                numeric: "auto",
                style: "long",
            });
            
            const now = new Date().getTime();
            const then = new Date(this.activity.loggedDate).getTime();
            
            const units: { unit: Intl.RelativeTimeFormatUnit; amount: number }[] = [
                { unit: "year", amount: 31536000000 },
                { unit: "month", amount: 2628000000 },
                { unit: "day", amount: 86400000 },
                { unit: "hour", amount: 3600000 },
                { unit: "minute", amount: 60000 },
                { unit: "second", amount: 1000 },
            ];
            
            const relatime = (elapsed: number) => {
                for (const { unit, amount } of units) {
                    if (Math.abs(elapsed) > amount || unit === "second") {
                        return rtfl.format(Math.round(elapsed / amount), unit);
                    }
                }
            };
            
            return relatime(then - now);
        } catch(err) {
            // Error handling
        }
    }

    public get id() {
        return this.activity.id;
    }

    public get collectionIds(): string[] {
        return this.activity.type == "song" ? (this.item as Song | undefined)?.collections.map(c => c.id) ?? [] : [];
    }

    public get type() {
        return this.activity.type;
    }

    public get loggedDate() {
        return this.activity.loggedDate;
    }
}
