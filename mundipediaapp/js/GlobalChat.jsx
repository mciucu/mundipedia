import {UI} from "ui/UIBase";
import {GroupChatStore} from "state/MessageThreadStore";
import {StateDependentElement} from "ui/StateDependentElement";
import {GroupChatWidget} from "ChatWidget";

export class GlobalChat extends StateDependentElement(GroupChatWidget) {
    getAjaxUrl() {
        return GroupChatStore.options.fetchURL;
    }

    getAjaxRequest() {
        return {
            chatId: this.options.chatId,
        }
    }

    getDefaultOptions(options) {
        return Object.assign(super.getDefaultOptions(options), {
            chatId: window.GLOBAL_CHAT_ID,
            style: {
                height: "100%",
                maxWidth: 800,
                margin: "0 auto",
            },
        })
    }

    initializeShowLoadMoreButton() {}

    importState(data) {
        super.importState(...arguments);
        super.initializeShowLoadMoreButton();
    }

    get messageThread() {
        return GroupChatStore.get(this.options.chatId).getMessageThread();
    }
}
