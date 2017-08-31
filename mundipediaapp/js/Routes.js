import {UI, Route} from "UI";
import {IndexPage} from "./IndexPage";
import {BlogRoute} from "BlogPanel";
import {ForumRoute} from "ForumPanel";
import {AboutPage} from "./AboutMundipedia";
import {GlobalChat} from "./GlobalChat";

export const MAIN_ROUTE = new Route(null, IndexPage, [
    new BlogRoute(),
    new ForumRoute(),
    new Route("chat", GlobalChat),
    new Route("about", AboutPage),
]);