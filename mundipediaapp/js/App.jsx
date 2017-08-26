import {UI, ViewportMeta} from "UI";
import {MAIN_ROUTE} from "./Routes"
import {AppNavManager} from "./AppNavManager.jsx";
import {EstablishmentApp} from "EstablishmentApp";

import {GlobalStyleSheet} from "GlobalStyleSheet";
import {styleRuleCustom} from "decorators/Style";

export * from "./AppConfig";
export * from "style/Theme";

class MundipediaGlobalStyleSheet extends GlobalStyleSheet {
    @styleRuleCustom({selector: "@font-face"})
    mundiFontFace = {
        fontFamily: "'Mundigrotesque Light'",
        src: "url('/static/fonts/Mundigrotesque-Light.woff') format('woff')"
    }
}

export class AppClass extends EstablishmentApp {
    getBeforeContainer() {
        return <AppNavManager ref="navManager"/>;
    }

    static initializeGlobalStyle() {
        return MundipediaGlobalStyleSheet.initialize();
    }

    getRoutes() {
        return MAIN_ROUTE;
    }
}
