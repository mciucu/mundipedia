import {UI} from "ui/UIBase";
import {GroupChatStore} from "state/MessageThreadStore";
import {StateDependentElement} from "ui/StateDependentElement";
import {GroupChatWidget} from "ChatWidget";

export class GlobalChat extends StateDependentElement(UI.Element) {
    getAjaxURL() {
        return GroupChatStore.options.fetchURL;
    }

    getAjaxRequest() {
        return {
            ids: [window.GLOBAL_CHAT_ID]
        }
    }
}
