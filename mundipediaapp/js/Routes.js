import {UI, Route} from "ui/UI";
import {IndexPage} from "./IndexPage";
import {BlogRoute} from "BlogPanel";
import {ForumRoute} from "ForumPanel";
import {AboutPage} from "./AboutMundipedia";
import {GlobalChat} from "./GlobalChat";
import {StateDependentElement} from "ui/StateDependentElement";
import {ArticleEditor} from "ArticleEditor";

export const MAIN_ROUTE = new Route(null, IndexPage, [
    new BlogRoute(),
    new ForumRoute(),
    new Route("chat", GlobalChat),
    new Route("about", AboutPage),
    new Route(["article", "%s", "edit"], StateDependentElement(ArticleEditor)),
]);