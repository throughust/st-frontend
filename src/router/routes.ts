import { RouteRecordRaw } from "vue-router";

const DashboardLayout = () => import(/* webpackChunkName: 'dashboardLayout' */ "../layout/DashboardLayout.vue");
const Dashboard = () => import(/* webpackChunkName: 'dashboard' */ "../views/Dashboard.vue");
const Admin = () => import(/* webpackChunkName: 'users' */ "../views/Admin.vue");
const SettingsView = () => import(/* webpackChunkName: 'settings' */ "../views/SettingsView.vue");
const SongSelector = () => import(/* webpackChunkName: 'song' */ "../views/SongSelector.vue");
const LyricsViewer = () => import(/* webpackChunkName: 'lyrics' */ "../views/LyricsViewer.vue");
const KaraokeViewer = () => import(/* webpackChunkName: 'karaoke' */ "../views/KaraokeViewer.vue");
//const Collections = () => import(/* webpackChunkName: 'collections' */ "../views/Collections.vue");
const SongList = () => import(/* webpackChunkName: 'songList' */ "../views/SongList.vue");
const SongViewer = () => import(/* webpackChunkName: 'songSettings' */ "../views/SongViewer.vue");
const ContributorView = () => import(/* webpackChunkName: 'contributor' */ "../views/ContributorView.vue");

const CollectionView = () => import(/* webpackChunkName: 'store' */ "../views/CollectionView.vue");
const CollectionItem = () => import(/* webpackChunkName: 'store-item' */ "../views/collections/CollectionItem.vue");
const CollectionList = () => import(/* webpackChunkName: 'store-home' */ "../views/collections/CollectionList.vue");

const Playlist = () => import(/* webpackChunkName: 'playlist' */ "../views/playlist/Playlist.vue");
const PlaylistView = () => import(/* webpackChunkName: 'playlist-view' */ "../views/playlist/PlaylistView.vue");
const PlaylistOverview = () => import(/* webpackChunkName: 'playlist-overview' */ "../views/playlist/PlaylistOverview.vue");


const CompleteSearch = () => import(/* webpackChunkName: 'completeSearch' */ "../views/dashboard/CompleteSearch.vue");

const Login = () => import(/* webpackChunkName: 'login' */ "../views/Login.vue");
const CreateUser = () => import(/* webpackChunkName: 'createUser' */ "../views/CreateUser.vue");

const Success = () => import(/* webpackChunkName: 'success' */ "../views/Success.vue");

const NotFound = () => import(/* webpackChunkName: 'notFound' */ "../views/NotFound.vue");
const VerifyEmail = () => import(/* webpackChunkName: 'notFound' */ "../views/VerifyEmail.vue");

const SheetMusic = () => import(/* webpackChunkName: 'sheetMusic' */ "../views/SheetMusic.vue");

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        name: "dashboard",
        component: DashboardLayout,
        children: [
            {
                path: "",
                name: "main",
                alias: "/dashboard",
                component: Dashboard,
            },
            {
                path: "admin",
                name: "admin",
                component: Admin,
            },
            {
                path: "songs",
                name: "songs",
                component: SongSelector,
                children: [
                    // {
                    //     path: "",
                    //     name: "collections",
                    //     component: Collections,
                    // },
                    {
                        path: ":collection",
                        name: "song-list",
                        component: SongList,
                    },
                    {
                        path: ":collection/:number",
                        name: "song",
                        component: SongViewer,
                    },
                    {
                        path: "search",
                        name: "search",
                        component: CompleteSearch,
                        props: { q: "" },
                    },
                    // {
                    //     path: 'sheetmusic',
                    //     name: 'songs-sheet-music',
                    //     component: SheetMusic
                    // }
                ],
            },
            {
                path: "contributors/:contributor",
                name: "contributor",
                component: ContributorView,
            },
            {
                path: "collections",
                alias: "store",
                name: "collections",
                component: CollectionView,
                children: [
                    {
                        path: "",
                        name: "collection-list",
                        component: CollectionList,
                    },
                    {
                        path: ":id",
                        name: "collection-item",
                        component: CollectionItem,
                    },
                ],
            },

            {
                path: "settings",
                name: "settings",
                component: SettingsView,
            },
            {
                path: "/playlists",
                name: "playlists",
                component: Playlist,
                children: [
                    {
                        path: "",
                        name: "playlist-overview",
                        component: PlaylistOverview,
                    },
                    {
                        path: ":id",
                        name: "playlist-view",
                        component: PlaylistView,
                    },
                ],
            },
        ],
    },
    {
        path: "/login",
        name: "login",
        component: Login,
    },
    {
        path: "/create",
        name: "create-user",
        component: CreateUser,
    },
    {
        path: "/lyrics",
        name: "lyrics",
        component: LyricsViewer,
    },
    {
        path: "/karaoke",
        name: "karaoke",
        component: KaraokeViewer,
    },
    {
        path: "/success",
        name: "success",
        component: Success,
    },
    {
        path: "/verify-email",
        name: "verify-email",
        component: VerifyEmail,
    },
    {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: NotFound,
    },
    {
        path: "/sheetmusic/:id",
        name: "sheet-music-embed",
        component: SheetMusic,
    },
    {
        path: "/sheetmusic",
        name: "sheet-music",
        component: SheetMusic,
    },
];

export default routes;