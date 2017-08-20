import {UI} from "UI";
import {StyleSheet, styleRule} from "UI";

export class IndexPageStyle extends StyleSheet {
    @styleRule
    container = {
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
    };

    @styleRule
    topContainer = {
        flexGrow: "1.5",
        width: "100%",
        backgroundColor: "#f0a150",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    };

    @styleRule
    bottomContainer = {
        flexGrow: "2",
        width: "100%",
        fontSize: "18px",
        paddingTop: "20px",
        textAlign: "center",
    };
}

