/*globals BrowserID: true, $:true */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

BrowserID.addEmailAddress = (function() {
  "use strict";

  var ANIMATION_TIME=250,
      bid = BrowserID,
      dom = bid.DOM,
      user = bid.User,
      storage = bid.Storage,
      errors = bid.Errors,
      pageHelpers = bid.PageHelpers,
      helpers = bid.Helpers,
      complete = helpers.complete,
      doc,
      token,
      redirectTimeout,
      redirectTo,
      sc;

  function showError(el, oncomplete) {
    $(".hint,#signUpForm").hide();
    $(el).fadeIn(ANIMATION_TIME, oncomplete);
  }

  function emailRegistrationComplete(oncomplete, info) {
    var valid = info.valid;
    if (valid) {
      emailRegistrationSuccess(info, complete.curry(oncomplete, true));
    }
    else {
      showError("#cannotconfirm", complete.curry(oncomplete, false));
    }
  }

  function showRegistrationInfo(info) {
    dom.setInner(".email", info.email);

    if (info.origin) {
      dom.setInner(".website", info.origin);

      $(".siteinfo").show();
    }
  }

  function emailRegistrationSuccess(info, oncomplete) {
    dom.addClass("body", "complete");

    showRegistrationInfo(info);

    setTimeout(function() {
      if(redirectTo) {
        localStorage.removeItem("redirectTo");
        doc.location = redirectTo;
        complete(oncomplete);
      }
      else {
        pageHelpers.replaceFormWithNotice("#congrats", oncomplete);
      }
    }, redirectTimeout);
  }

  function userMustEnterPassword(info) {
    return !!info.needs_password;
  }

  function verifyWithoutPassword(oncomplete) {
    user.verifyEmailNoPassword(token,
      emailRegistrationComplete.curry(oncomplete),
      pageHelpers.getFailure(errors.verifyEmail, oncomplete)
    );
  }

  function verifyWithPassword(oncomplete) {
    var pass = dom.getInner("#password"),
        vpass = dom.getInner("#vpassword"),
        valid = bid.Validation.passwordAndValidationPassword(pass, vpass);

    if(valid) {
      user.verifyEmailWithPassword(token, pass,
        emailRegistrationComplete.curry(oncomplete),
        pageHelpers.getFailure(errors.verifyEmail, oncomplete)
      );
    }
    else {
      complete(oncomplete, false);
    }
  }

  function startVerification(oncomplete) {
    user.tokenInfo(token, function(info) {
      if(info) {
        showRegistrationInfo(info);

        if(userMustEnterPassword(info)) {
          dom.addClass("body", "enter_password");
          complete(oncomplete, true);
        }
        else {
          dom.addClass("body", "no_password");
          verifyWithoutPassword(oncomplete);
        }
      }
      else {
        showError("#cannotconfirm");
        complete(oncomplete, false);
      }
    }, pageHelpers.getFailure(errors.getTokenInfo, oncomplete));
  }

  var Module = bid.Modules.PageModule.extend({
    start: function(options) {
      var self=this;

      self.checkRequired(options, "token");

      token = options.token;
      doc = options.document || window.document;
      redirectTimeout = options.redirect_timeout || 2000;

      // Save self off early because if the user is not logged in, the storage
      // info will be cleared by time they hit submit.
      redirectTo = localStorage.redirectTo;

      sc.start.call(self, options);

      startVerification(options.ready);
    },

    submit: verifyWithPassword
  });

  sc = Module.sc;

  return Module;
}());
