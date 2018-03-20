"use strict";

var querystring = require("querystring");

var ttsEndpoint = { host: "api.nexmo.com", path: "/tts/json" };
var ttsPromptEndpoint = { host: "api.nexmo.com", path: "/tts-prompt/json" };
var callEndpoint = { host: "rest.nexmo.com", path: "/call/json" };
var up = {};

var _options = null;

// Error message resources are maintained globally in one place for easy management
var ERROR_MESSAGES = {
  sender: "Invalid from address",
  to: "Invalid to address",
  msisdn: "Invalid MSISDN passed",
  maxDigits: "Invalid max digits for TTS prompt",
  byeText: "Invalid bye text for TTS prompt",
  pinCode: "Invalid pin code for TTS confirm",
  failedText: "Invalid failed text for TTS confirm",
  answerUrl: "Invalid answer URL for call",
  product: "Invalid product. Should be one of [voice, sms]"
};

exports.initialize = function(pkey, psecret, options) {
  if (!pkey || !psecret) {
    throw "key and secret cannot be empty, set valid values";
  }
  up = {
    api_key: pkey,
    api_secret: psecret
  };
  _options = options;
};

function clone(a) {
  return JSON.parse(JSON.stringify(a));
}

function getEndpoint(action) {
  return { path: action };
}

function sendRequest(endpoint, method, callback) {
  endpoint.path =
    endpoint.path +
    (endpoint.path.indexOf("?") > 0 ? "&" : "?") +
    querystring.stringify(up);
  _options.httpClient.request(endpoint, method, callback);
}

exports.checkBalance = function(callback) {
  var balanceEndpoint = getEndpoint("/account/get-balance");
  sendRequest(balanceEndpoint, callback);
};

function sendVoiceMessage(voiceEndpoint, data, callback) {
  if (!data.to) {
    sendError(callback, new Error(ERROR_MESSAGES.to));
  } else {
    var endpoint = clone(voiceEndpoint);
    endpoint.path += "?" + querystring.stringify(data);
    _options.logger.info(
      "sending TTS message to " + data.to + " with message " + data.text
    );
    sendRequest(endpoint, "POST", function(err, apiResponse) {
      if (!err && apiResponse.status && apiResponse.status > 0) {
        sendError(callback, new Error(apiResponse["error-text"]), apiResponse);
      } else {
        if (callback) callback(err, apiResponse);
      }
    });
  }
}

exports.sendTTSMessage = function(recipient, message, opts, callback) {
  if (!message) {
    sendError(callback, new Error(ERROR_MESSAGES.msg));
  } else {
    if (!opts) {
      opts = {};
    }
    opts["to"] = recipient;
    opts["text"] = message;
    sendVoiceMessage(ttsEndpoint, opts, callback);
  }
};

exports.sendTTSPromptWithCapture = function(
  recipient,
  message,
  maxDigits,
  byeText,
  opts,
  callback
) {
  if (!message) {
    sendError(callback, new Error(ERROR_MESSAGES.msg));
  } else if (!maxDigits || isNaN(maxDigits) || maxDigits.length > 16) {
    sendError(callback, new Error(ERROR_MESSAGES.maxDigits));
  } else if (!byeText) {
    sendError(callback, new Error(ERROR_MESSAGES.byeText));
  } else {
    if (!opts) {
      opts = {};
    }
    opts["to"] = recipient;
    opts["text"] = message;
    opts["max_digits"] = maxDigits;
    opts["bye_text"] = byeText;
    sendVoiceMessage(ttsPromptEndpoint, opts, callback);
  }
};

exports.sendTTSPromptWithConfirm = function(
  recipient,
  message,
  maxDigits,
  pinCode,
  byeText,
  failedText,
  opts,
  callback
) {
  if (!message) {
    sendError(callback, new Error(ERROR_MESSAGES.msg));
  } else if (!maxDigits || isNaN(maxDigits) || maxDigits.length > 16) {
    sendError(callback, new Error(ERROR_MESSAGES.maxDigits));
  } else if (!pinCode || pinCode.length !== maxDigits) {
    sendError(callback, new Error(ERROR_MESSAGES.pinCode));
  } else if (!byeText) {
    sendError(callback, new Error(ERROR_MESSAGES.byeText));
  } else if (!failedText) {
    sendError(callback, new Error(ERROR_MESSAGES.failedText));
  } else {
    if (!opts) {
      opts = {};
    }
    opts["to"] = recipient;
    opts["text"] = message;
    opts["max_digits"] = maxDigits;
    opts["pin_code"] = pinCode;
    opts["bye_text"] = byeText;
    opts["failed_text"] = failedText;
    sendVoiceMessage(ttsPromptEndpoint, opts, callback);
  }
};

exports.call = function(recipient, answerUrl, opts, callback) {
  if (!answerUrl) {
    sendError(callback, new Error(ERROR_MESSAGES.answerUrl));
  } else {
    if (!opts) {
      opts = {};
    }
    opts["to"] = recipient;
    opts["answer_url"] = answerUrl;
    sendVoiceMessage(callEndpoint, opts, callback);
  }
};

function sendError(callback, err, returnData) {
  // Throw the error in case if there is no callback passed
  if (callback) {
    callback(err, returnData);
  } else {
    throw err;
  }
}

exports.setHost = function(aHost) {
  ttsEndpoint.host = aHost;
  ttsPromptEndpoint.host = aHost;
  callEndpoint.host = aHost;
  niEndpoint.host = aHost;
  niStandardEndpoint.host = aHost;
};
