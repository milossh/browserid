/*globals BrowserID: true, $:true */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

BrowserID.verifyEmailAddress = (function() {
  "use strict";

  var bid = BrowserID,
      dom = bid.DOM,
      network = bid.Network,
      errors = bid.Errors,
      pageHelpers = bid.PageHelpers,
      helpers = bid.Helpers,
      complete = helpers.complete,
      doc,
      token,
      redirectTo,
      sc;

  function showSiteInfo() {
    $(".siteinfo").hide();
    var staged = bid.Storage.getStagedOnBehalfOf();
    if (staged) {
      dom.setInner('.website', staged);
      $('.siteinfo').show();
    }
  }

  function showEmailAddress(oncomplete) {
    network.emailForVerificationToken(token, function(info) {
      if (info) {
        dom.setInner('#email', info.email);
        oncomplete();
      }
      else {
        pageHelpers.replaceFormWithNotice("#cannotconfirm", oncomplete);
      }
    }, pageHelpers.getFailure(errors.completeUserRegistration, oncomplete));
  }

  function submit(oncomplete) {
    var pass = dom.getInner("#password"),
        vpass = dom.getInner("#vpassword");

    var valid = bid.Validation.passwordAndValidationPassword(pass, vpass);

    if (valid) {
      network.completeUserRegistration(token, pass, function(registered) {
        if (redirectTo && registered) {
          // XXX How can we get this localStorage stuff out of here?
          localStorage.removeItem("redirectTo");
          doc.location = redirectTo;
          oncomplete();
        }
        else {
          var selector = registered ? "#congrats" : "#cannotcomplete";
          pageHelpers.replaceFormWithNotice(selector, oncomplete);
        }
      }, pageHelpers.getFailure(errors.completeUserRegistration, oncomplete));
    }
    else {
      oncomplete();
    }
  }

  var Module = bid.Modules.PageModule.extend({
    start: function(options) {
      var self=this;

      self.checkRequired(options, "token");

      token = options.token;
      doc = options.document || window.document;

      // Save this off early because if the user is not logged in, the storage
      // info will be cleared by time they hit submit.
      redirectTo = localStorage.redirectTo;

      sc.start.call(self, options);

      showSiteInfo();
      showEmailAddress(complete.curry(options.ready));
    },

    submit: submit
  });

  sc = Module.sc;

  return Module;

}());
