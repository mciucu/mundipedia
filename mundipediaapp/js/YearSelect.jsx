import {UI, StyleSheet, styleRule, Button, TextInput, registerStyle} from "UI";
import {FAIcon} from "FontAwesome";

class YearSelectStyle extends StyleSheet {
    height = 40;
    width = 160;

    @styleRule
    yearSelect = {
        width: this.width,
        height: this.height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    };

    @styleRule
    button = {
        height: this.height,
        width: this.width / 4,
        backgroundColor: this.themeProperties.COLOR_BACKGROUND,
        border: "0",
        transition: "0.15s",
        ":hover": {
            backgroundColor: this.themeProperties.COLOR_BACKGROUND,
            color: this.themeProperties.COLOR_PRIMARY,
            transition: "0.15s",
        },
        ":active": {
            backgroundColor: this.themeProperties.COLOR_BACKGROUND,
            transition: "0.15s",
        },
        ":focus": {
            backgroundColor: this.themeProperties.COLOR_BACKGROUND,
            transition: "0.15s",
        },
        ":active:focus": {
            backgroundColor: this.themeProperties.COLOR_BACKGROUND,
            transition: "0.15s",
        }
    };

    @styleRule
    textInput = {
        height: this.height,
        width: this.width / 2,
        fontSize: "18px",
        textAlign: "center",
        border: "0",
        outline: "none",
        borderBottom: "2px solid #000",
        transition: "0.15s",
        backgroundColor: this.themeProperties.COLOR_BACKGROUND,
        ":hover": {
            borderBottom: "2px solid " + this.themeProperties.COLOR_PRIMARY,
            color: this.themeProperties.COLOR_PRIMARY,
            transition: "0.15s",
        },
        ":active": {
            borderBottom: "2px solid " + this.themeProperties.COLOR_PRIMARY,
            color: this.themeProperties.COLOR_PRIMARY,
            transition: "0.15s",
        },
        ":focus": {
            borderBottom: "2px solid " + this.themeProperties.COLOR_PRIMARY,
            color: this.themeProperties.COLOR_PRIMARY,
            transition: "0.15s",
        },
    };
}

@registerStyle(YearSelectStyle)
export class YearSelect extends UI.Element {
    setOptions(options) {
        this.currentValue = options.values[0];
        super.setOptions(options);
    }

    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.yearSelect);
    }

    addChangeListener(callback) {
        return this.addListener("change", callback);
    }

    getCurrentValue() {
        return this.currentValue;
    }

    setCurrentValue(value) {
        this.currentValue = value;
        this.redraw();
        this.dispatch("change");
    }

    getFromArrow(direction) {
        let {values} = this.options;

        let currentIndex = values.indexOf(this.getCurrentValue());
        let nextIndex = currentIndex + direction;
        if (!(nextIndex >= 0 && nextIndex < values.length)) {
            return;
        }

        this.setCurrentValue(values[nextIndex]);
    }

    getFromInput(enteredValue) {
        let {values} = this.options;
        let valuesFiltered;

        valuesFiltered = values.filter((value) => {
            return value <= enteredValue;
        });
        this.setCurrentValue(valuesFiltered[valuesFiltered.length - 1] || values[0]);
    }

    render() {
        return [
            <Button className={this.styleSheet.button} onClick={() => this.getFromArrow(-1)}>
                <FAIcon icon="arrow-left"/>
            </Button>,
            <TextInput ref="textInput" className={this.styleSheet.textInput} value={this.getCurrentValue()} />,
            <Button className={this.styleSheet.button} onClick={() => this.getFromArrow(1)}>
                <FAIcon icon="arrow-right"/>
            </Button>,
        ];
    }

    onMount() {
        this.textInput.addNodeListener("keypress", (event) => {
            if (event.keyCode === 13) { // 'Enter' key was pressed
                this.getFromInput(this.textInput.getValue());
                this.redraw();
            }
        });
    }
}

