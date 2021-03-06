import {UI, Link, registerStyle} from "UI";
import {IndexPageStyle} from "./IndexPageStyle";
import {HistoricalWorldMap} from "./HistoricalWorldMap";


@registerStyle(IndexPageStyle)
export class IndexPage extends UI.Element {
    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.container);
    }

    render() {
        return [
            <HistoricalWorldMap />,
        ];
    }
}