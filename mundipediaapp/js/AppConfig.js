import {UI, CodeEditor} from "UI";

import {Ajax} from "base/Ajax";
import {ensure} from "base/Require";
import {getCookie} from "base/Utils";
import {PageTitleManager} from "base/PageTitleManager";
import {WebsocketSubscriber} from "websocket/WebsocketSubscriber";

import {GlobalState} from "state/State";

// The default page title
PageTitleManager.setDefaultTitle("Mundipedia");

// Add an ajax preprocessor to always have the csfr token
Ajax.addPreprocessor((request) => {
    request.credentials = request.credentials || "include";
    request.headers.set("X-CSRFToken", getCookie("csrftoken"));
});

GlobalState.registerStream = function (streamName) {
    WebsocketSubscriber.addListener(streamName, GlobalState.applyEventWrapper);
};

//Register on the global event stream
GlobalState.registerStream("global-events");

//Register on the user event stream
if (self.USER && self.USER.id) {
    GlobalState.registerStream("user-" + self.USER.id + "-events");
}