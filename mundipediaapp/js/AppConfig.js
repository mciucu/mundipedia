import {PageTitleManager} from "base/PageTitleManager";

import {GlobalState} from "state/State";
import {Theme} from "style/Theme";

// The default page title
PageTitleManager.setDefaultTitle("Mundipedia");

const oldThemeProperties = Theme.Global.getProperties();

Theme.Global.setProperties({
    FONT_FAMILY_SANS_SERIF: "'Mundigrotesque Light', " + oldThemeProperties.FONT_FAMILY_SANS_SERIF,
});
