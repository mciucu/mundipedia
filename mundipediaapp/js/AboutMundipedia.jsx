import {
    EmailInput,
    Form,
    Image,
    Input,
    Level,
    Link,
    StyleSheet,
    SubmitInput,
    TextArea,
    Theme,
    UI,
    registerStyle,
    styleRule,
} from "ui/UI";
import {Ajax} from "Ajax";
import {MundipediaLogo} from "./MundipediaLogo";

import {FAIcon} from "FontAwesome";
import {enhance} from "Color";
import {FeedbackForm} from "FeedbackForm";


class TeamCardStyle extends StyleSheet {
    height = 350;
    width = 250;

    headerImageDimensions = 160;

    borderRadius = "50%";

    bodyDescriptionPadding = 20;

    footerHeight = 40;
    footerSocialAccountDimensions = 25;

    getHeaderHeight() {
        return 10 / 7 * this.headerImageDimensions;
    }

    @styleRule
    container = {
        // minHeight: this.Height,
        width: this.width,
        border: `1px solid rgba(0,0,0,0)`,
        display: "flex",
        flexDirection: "column",
        ":hover": {
            border: `1px solid ${enhance(this.themeProperties.COLOR_ALTERNATIVE_WHITE, 0.1)}`,
        },
    };

    @styleRule
    header = {
        height: this.getHeaderHeight(),
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        // backgroundColor: this.themeProperties.COLOR_ALTERNATIVE_WHITE,
    };

    @styleRule
    circleImage = {
        height: this.headerImageDimensions,
        width: this.headerImageDimensions,
        borderRadius: this.borderRadius,
        // backgroundColor: this.elementBackgroundColor,
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
        backgroundColor: this.themeProperties.COLOR_ALTERNATIVE_WHITE,
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
        color: this.themeProperties.COLOR_TEXT,
        fontSize: "16px",
        fontWeight: "600",
    };

    @styleRule
    titleJob = {
        color: enhance(this.themeProperties.COLOR_TEXT, .35),
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
        backgroundColor: "#bbbbc9",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginRight: "12.5px",
        transition: ".2s",
        ":hover": {
            backgroundColor: enhance("#bbbbc9", 0.2),
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
        const people = [{
            name: "Mihai Ciucu",
            image: <MundipediaLogo size={TeamCardStyle.getInstance().headerImageDimensions}/>,
            job: "Founder",
            description: "I don't have time for thinking about a description, I'm busy!",
            socialAccounts: [{
                name: "github",
                url: "https://github.com/mciucu"
            }]
        }, {
            name: "Andra Geangu",
            image: "https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/4/005/027/1b1/24f3e57.jpg",
            job: "Co-Founder",
        }, {
            name: "Vlad Tarniceru",
            image:"https://pbs.twimg.com/profile_images/665837433217540096/r7N4Vjv0_400x400.jpg",
            job: "UI/UX designer, frontend engineer",
            description: "Listening to dark jazz",
            socialAccounts: [{
                name: "twitter",
                url: "https://twitter.com/vladtarniceru"
            }, {
                name: "github",
                url: "https://github.com/saintandy"
            }]
        }, {
            name: "Catalin Orzanescu",
            image: "https://media.licdn.com/mpr/mpr/shrinknp_200_200/AAEAAQAAAAAAAApKAAAAJDMxMjFmMmQ2LThiMzMtNGE4Ni1hM2UwLWIyNWRiNzllNTFkZg.jpg",
            job: "Research Collaborator",
        }, {
            name: "Loredana Branzei",
            job: "Research Collaborator",
        }, {
            name: "Anamaria Balsadiu",
            job: "Research Collaborator",
        }, {
            name: "Mircea Pavel",
            image: "",
            job: "Research Collaborator",
        }, {
            name: "Marian Iancu",
            job: "Research Collaborator",
        }, {
            name: "Micu Adelina",
            job: "Research Collaborator",
        }];

        return people.map(person => <div className={this.styleSheet.teamSectionContainer}>
                    <TeamCard {...person}/>
                </div>);
    }
}

class AboutSectionStyle extends StyleSheet {
    @styleRule
    titleContainer = {
        fontSize: "32px",
        fontWeight: "600",
        textAlign: "center",
        marginTop: "60px",
    };

    @styleRule
    messageContainer = {
        ">p": {
            lineHeight: "30px",
            textAlign: "justify",
            fontSize: "18px",
        }
    }
}

@registerStyle(AboutSectionStyle)
class AboutSection extends UI.Element {
    getDefaultOptions() {
        return {
            hasLogo: true,
        }
    }

    render() {
        const {title, message} = this.options;
        return [
            <div className={this.styleSheet.titleContainer}>
                {
                    this.options.hasLogo ? <MundipediaLogo size={100} /> : ""
                }
                {title}
            </div>,
            <div className={this.styleSheet.messageContainer}>
                {message}
            </div>
        ];
    }
}

class AboutPageStyle extends StyleSheet {
    @styleRule
    aboutPage = {
        backgroundColor: this.themeProperties.COLOR_BACKGROUND,
    };

    @styleRule
    container = {
        width: "920px",
        padding: "0 15px",
        maxWidth: "100%",
        margin: "0 auto",
    };

    @styleRule
    title = {
        fontSize: "46px",
        paddingTop: "50px",
        textAlign: "center",
    };
}


// Just change the TeamSection, it should get an array of information
// about the cards and should map that info in some result value and return it
@registerStyle(AboutPageStyle)
export class AboutPage extends UI.Element {
    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.aboutPage);
    }

    render() {
        return [
            <div className={this.styleSheet.container}>
                <div className={this.styleSheet.title}>
                    <MundipediaLogo size={120} />
                    <span>
                        Mundipedia
                    </span>
                </div>
                <AboutSection title="About us"
                              message={[
                                  <p>
                                      We’re a non-profit with the purpose of collecting, standardizing
                                      and visualizing information about the state of the world, currently and historically.
                                  </p>,
                                  <p>
                                      Mundipedia was born because there was a need for a centralized database for historical
                                      information. It’s intended not just as a historical map of the world, where you can
                                      just slide to what year you want. It’s intended to show information like historical GDP,
                                      populations, the areas where certain languages are spoken.
                                  </p>,
                                  <p>
                                      In short, we want to put a memorable visual representation on top of the world’s historical
                                      information while also acting as the curators of this data.
                                  </p>,
                                  <p>
                                      Everything that we’ll collect will be made freely available to anyone, at first through our
                                      website and later on through a standardized API.
                                  </p>,
                                  <p>
                                      This website is built with <Link href="https://stemjs.org/">Stem JS</Link>.
                                      The souce code is available <Link href="https://github.com/mciucu/mundipedia" newTab>on github</Link>.
                                  </p>
                              ]}
                              hasLogo={false} />
                <AboutSection title="Aren’t there other websites that do this?"
                              message={[
                                  <p>
                                      There’s little information that’s not on the internet somewhere. It’s in a multitude of different
                                      formats thought: scanned maps, spreadsheets, yet untranslated cuneiform tablets, you name it. Mundipedia
                                      wants to be is a platform that gathers all that data and offers a single format for every
                                      type of data.
                                  </p>
                              ]}
                              /*hasLogo*/ />
                <AboutSection title="We’re not a wiki (yet)"
                              message={[
                                  <p>
                                      We don’t accept user data right now, but we want to in the future. One of the
                                      main principles of Mundipedia is that the way information is presented can be more important than the
                                      actual information. Every single type of data that we’ll store has a different way of best presenting
                                      it, and that’s why at first we want the people that are inputing the data to be close to the decisions
                                      of how it’s displayed.
                                  </p>,
                                  <p>
                                      Using crowdsourcing to generate data has become a panacea for many content platforms, many forgetting how
                                      important it is to have a system in place that enforces consistency and quality. Don’t misunderstand us,
                                      openness to community efforts is critically important, it's just that at first we want to set up an infrastructure
                                      that will make sure the end-user hears only a single coherent and high quality voice. Anyone that's interested in
                                      a collaboration is welcomed to contact us using the form bellow or via email.
                                  </p>
                              ]} />
                <AboutSection title="How we’re funded"
                              message={[
                                  <p>
                                      We're not right now, and are still looking for ways to
                                      be funded, but whatever happens though, we will stand by our key principles:
                                  </p>,
                                  <p>
                                      <li>
                                          All of the information will remain forever free and without copyright limitations to usage.
                                      </li>
                                      <li>
                                          We will never have banners or ads of any kind on our website.
                                      </li>
                                      <li>
                                          We will not compromise our content for sponsorships.
                                      </li>
                                  </p>
                              ]} />
                <AboutSection title="Contact us"
                              message={[
                                  <p>
                                      Write to us at <strong>contact@mundipedia.org</strong> if you’ve got any thoughts you want to send our way.
                                  </p>
                              ]} />
                <FeedbackForm />
                <AboutSection title="Our team"
                              message={[
                                  <TeamSection />
                              ]}
                              hasLogo={false} />
            </div>
        ]
    }
}