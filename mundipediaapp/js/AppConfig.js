import {PageTitleManager} from "base/PageTitleManager";

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


// import D3PathString from "d3-geo/src/path/string";

// D3PathString.prototype.point = function (x, y) {
//     switch (this._point) {
//         case 0: {
//             this._string.push("M" + x.toFixed(1) + "," + y.toFixed(1));
//             this._point = 1;
//             break;
//         }
//         case 1: {
//             this._string.push("L" + x.toFixed(1) + "," + y.toFixed(1));
//             break;
//         }
//         default: {
//             if (this._circle == null) this._circle = circle(this._radius);
//             this._string.push("M", x, ",", y, this._circle);
//             break;
//         }
//     }
// };
