import {UI, Link, registerStyle} from "UI";
import {Card} from "./Card";
import {IndexPageStyle, QuoteStyle, CodeStyle} from "./IndexPageStyle";
import {MundipediaLogo} from "./MundipediaLogo";
import {HistoricalWorldMap} from "./SVGMap";

@registerStyle(QuoteStyle)
class Quote extends UI.Element {
    render() {
        let {text, hasQuotes} = this.options,
            message = text;
        if (hasQuotes) {
            message = "\"" + message + "\"";
        }

        return <div className={this.styleSheet.quote}>
            {message}
        </div>;
    }
}

@registerStyle(CodeStyle)
class Code extends UI.Primitive("span") {
    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.code);
    }
}

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