import {UI, registerStyle, Link, StyleSheet, styleRule, Image, Theme} from "ui/UI";
import {MundipediaLogo} from "./MundipediaLogo";

import {FAIcon} from "FontAwesome";
import {enhance} from "Color";


class TeamCardStyle extends StyleSheet {
    height = 350;
    width = 250;

    headerHeight = 142;
    headerCircleDimensions = this.headerHeight * 7 / 10;
    borderRadius = "15%";

    bodyDescriptionPadding = 20;

    footerHeight = 40;
    footerSocialAccountDimensions = 25;

    elementBackgroundColor = Theme.Global.properties.COLOR_PALE_BRIGHT_BLUE;
    elementColor = Theme.Global.properties.COLOR_DARK;

    @styleRule
    container = {
        // minHeight: this.Height,
        width: this.width,
        border: `1px solid ${Theme.Global.properties.COLOR_ALTERNATIVE_WHITE}`,
        display: "flex",
        flexDirection: "column",
        ":hover": {
            border: `1px solid ${enhance(Theme.Global.properties.COLOR_ALTERNATIVE_WHITE, 0.1)}`,
        },
    };

    @styleRule
    header = {
        height: this.headerHeight,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        // backgroundColor: Theme.Global.properties.COLOR_ALTERNATIVE_WHITE,
    };

    @styleRule
    circleImage = {
        height: this.headerCircleDimensions,
        width: this.headerCircleDimensions,
        borderRadius: this.borderRadius,
        backgroundColor: this.elementBackgroundColor,
    };

    @styleRule
    image = {
        height: "100%",
        width: "100%",
        borderRadius: this.borderRadius,
    };

    @styleRule
    hr = {
        width: "80%",
        margin: "0 10%",
        height: "1px",
        backgroundColor: Theme.Global.properties.COLOR_ALTERNATIVE_WHITE,
    };

    @styleRule
    padding = {
        width: "100%",
        paddingTop: this.bodyDescriptionPadding,
    };

    @styleRule
    body = {
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
        flex: "1",
    };

    @styleRule
    description = {
        padding: `0 10%`,
        lineHeight: this.bodyDescriptionPadding,
        fontSize: "14px",
    };

    @styleRule
    titleName = {
        color: this.elementColor,
        fontSize: "16px",
        fontWeight: "600",
    };

    @styleRule
    titleJob = {
        color: enhance(this.elementColor, .35),
        fontSize: "14px",
    };

    @styleRule
    footer = {
        height: this.footerHeight,
        padding: "0 10%",
        width: "100%",
        // backgroundColor: "#bbb",
        display: "flex",
        flexDirection: "row",
    };

    @styleRule
    url = {
        display: "block",
        color: "inherit",
        textDecoration: "none",
    };

    @styleRule
    socialAccount = {
        height: this.footerSocialAccountDimensions,
        width: this.footerSocialAccountDimensions,
        borderRadius: this.borderRadius,
        backgroundColor: this.elementBackgroundColor,
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginRight: "12.5px",
        transition: ".2s",
        ":hover": {
            backgroundColor: enhance(this.elementBackgroundColor, 0.2),
            transition: ".2s",
        }
    };
}


@registerStyle(TeamCardStyle)
class TeamCard extends UI.Element {
    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.container);
    }

    getImage() {
        let {image} = this.options;

        return <div className={this.styleSheet.circleImage}>
            {
                image instanceof UI.Element ?
                    image :
                    <Image src={image} className={this.styleSheet.circleImage} />
            }
        </div>;
    }

    render() {
        const {image, name, job, description, socialAccounts} = this.options;
        const {styleSheet} = this;

        return [
            image && [
                <div className={styleSheet.header}>
                    {this.getImage()}
                </div>,
                <div className={styleSheet.hr} />,
            ],

            <div className={styleSheet.body}>
                <div className={styleSheet.padding} />

                <div className={styleSheet.description}>
                    <div className={styleSheet.titleName}>
                        {name}
                    </div>
                    <div className={styleSheet.titleJob}>
                        {job}
                    </div>

                    {
                        description && [
                            <div className={styleSheet.padding}/>,
                            description,
                        ]
                    }
                </div>
                <div className={styleSheet.padding} />
                {
                    socialAccounts && [
                        <div className={styleSheet.hr} />,
                        <div className={styleSheet.padding} />,
                        <div className={styleSheet.footer}>
                            {
                                socialAccounts.map((socialAccount) => {
                                    return (
                                        <Link href={socialAccount.url} className={styleSheet.url}>
                                            <div className={styleSheet.socialAccount}>
                                                <FAIcon icon={socialAccount.name} />
                                            </div>
                                        </Link>
                                    );
                                })
                            }
                        </div>,
                    ]
                }
            </div>,
        ];
    }
}


class TeamSectionStyle extends StyleSheet {
    @styleRule
    container = {
        padding: "25px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        flexWrap: "wrap",
        flexDirection: "row",
    };

    @styleRule
    teamSectionContainer = {
        padding: "12.5px",
    };
}


@registerStyle(TeamSectionStyle)
export class TeamSection extends UI.Element {
    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.container);
    }

    render() {
        let cards = [];
        for (let i = 0; i < 6; i += 1) {
            cards.push(
                <div className={this.styleSheet.teamSectionContainer}>
                    <TeamCard
                        image="https://pbs.twimg.com/profile_images/665837433217540096/r7N4Vjv0_400x400.jpg"
                        description={
                            "If you're blue and you don't know where to go to\n" +
                            "Why don't you go where fashion sits\n" +
                            "Puttin' on the Ritz"
                        }
                        name="Vlad Tarniceru - @saintandy"
                        job="UI/UX designer, frontend engineer"
                        socialAccounts={[
                            {
                                name: "twitter",
                                url: "https://twitter.com/vladtarniceru"
                            },
                            {
                                name: "github",
                                url: "https://github.com/saintandy"
                            },
                            {
                                name: "linkedin",
                                url: "https://github.com/saintandy"
                            },
                            {
                                name: "google",
                                url: "https://github.com/saintandy"
                            },
                        ]}
                    />
                </div>
            );
        }

        return cards;
    }
}


class AboutPageStyle extends StyleSheet {
    @styleRule
    container = {
        width: "1150px",
        maxWidth: "100%",
        margin: "0 auto",
    };
}

// Just change the TeamSection, it should get an array of information
// about the cards and should map that info in some result value and return it
@registerStyle(AboutPageStyle)
export class AboutPage extends UI.Element {
    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.container);
    }

    render() {
        return [
            <TeamSection />
        ]
    }
}