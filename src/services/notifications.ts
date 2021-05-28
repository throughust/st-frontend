import { cache } from "./cache";
import { Notification as N } from "songtreasures";  
import { reactive, readonly } from "vue";
import { useStore } from "@/store";
import { NotificationMutationTypes } from "@/store/modules/notifications/mutation-types";

export class Notification implements N {
    public id: string;
    public title;
    public content;
    public icon;
    public type;
    public dateTime: Date;

    constructor(n: N) {
        this.id = n.id ?? Math.floor(new Date().getTime() * Math.random()).toString();
        this.title = n.title;
        this.content = n.content;
        this.icon = n.icon;
        this.type = n.type;
        this.dateTime = n.dateTime ?? new Date();
    }
}

export class Notifications {
    private store = useStore();
    private notifications: {
        [key: string]: Notification;
    } = reactive({});

    private loadNotifications() {
        return cache.getAll("notifications");
    }

    private async setNotification(n: Notification) {
        this.notifications[n.id] = n;
        await cache.set("notifications", n.id, n);
    }

    private async deleteNotification(id: string){
        delete this.notifications[id];
        await cache.delete("notifications", id);
    }

    public async init() {
        const nots = (await this.loadNotifications()).map(n => new Notification(n));
        for (const n of nots) {
            if (new Date().getTime() - n.dateTime.getTime() > 43200000) {
                await cache.delete("notifications", n.id);
            } else {
                this.notifications[n.id] = n;
            }
        }
        this.store.commit(NotificationMutationTypes.ADD_NOTIFICATIONS, nots);
    }

    public get Notifications() {
        return readonly(Object.values(this.notifications));
    }

    public async notify(n: N) {
        const not = new Notification(n);
        this.store.commit(NotificationMutationTypes.ADD_NOTIFICATION, not);
        await this.setNotification(not); 
    }

    public async remove(id: string) {
        await this.deleteNotification(id);
    }
}

export const notifications = new Notifications();

// const notifications = new Notifications();

// class NotificationItem implements Notification {
//     public id;
//     public type;
//     public title;
//     public icon;
//     public content;

//     constructor(n: Notification) {
//         this.id = n.id;
//         this.type = n.type;
//         this.title = n.title;
//         this.icon = n.icon;
//         this.content = n.content;
//     }

//     public delete() {
//         delete notifications.notifications[this.id];
//     }
// }
