// UI components
import {UI} from "UI";
import {NavManager} from "navmanager/NavManager";
import {
    BasicOrientedElement,
    NavAnchoredNotifications,
    NavElement,
    NavLinkElement,
    NavSection,
    navSessionManager,
} from "navmanager/NavElement";
import {Direction, Orientation} from "UI";
import {LoginModal} from "LoginModal";
import {logout} from "Logout";
import {FAIcon} from "ui/FontAwesome";

/*
 * This is the NavManager file of your app.
 * Here's where you can add links in the navigation menu
 */

class AppNavManager extends NavManager {
    leftSidePanel = null;
    rightSidePanel = null;

    getLeftFixed() {
        return [
            <NavSection anchor={Direction.LEFT} style={{margin: 0}}>
                <NavLinkElement value="Home" href="/" />
                <NavLinkElement value="Blog" href="/blog" />
                {/*<NavLinkElement value="Forum" href="/forum" />*/}
                {/*<NavLinkElement value="Chat" href="/chat" />*/}
            </NavSection>
        ];
    }

    getUserElement() {
        if (USER.isAuthenticated) {
            return <NavElement value={[<FAIcon icon="user" style={{marginRight: "0.3rem"}} />, USER.email]}>
                <NavElement value={UI.T("Settings")} />
                <NavElement value={UI.T("Logout")} onClick={() => logout()}/>
            </NavElement>;
        } else {
            return <NavElement value={UI.T("Login/Signup")} onClick={() => LoginModal.show()} />;
        }
    }

    getRightFixed() {
        return [
            <NavSection anchor={Direction.RIGHT} style={{margin: 0}}>
                {this.getUserElement()}
                <NavLinkElement value={UI.T("About")} href="/about/" />
            </NavSection>
        ];
    }
}


export {AppNavManager};