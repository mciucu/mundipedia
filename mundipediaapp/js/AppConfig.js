import {PageTitleManager} from "base/PageTitleManager";

import {GlobalState} from "state/State";
import {Theme} from "style/Theme";

// The default page title
PageTitleManager.setDefaultTitle("Mundipedia");

const oldThemeProperties = Theme.Global.getProperties();

Theme.Global.setProperties({
    FONT_FAMILY_SANS_SERIF: "'Mundigrotesque Light', " + oldThemeProperties.FONT_FAMILY_SANS_SERIF,
    COLOR_ALTERNATIVE_WHITE: "#e3e3e3",
    COLOR_PALE_BRIGHT_BLUE: "#bbbbc9",
    COLOR_BACKGROUND: "#f3f4f5",
    COLOR_TEXT: "#222",
    GLOBAL_YEAR_SELECT_HEIGHT: 60,
});
