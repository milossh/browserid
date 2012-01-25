/*jshint browsers:true, forin: true, laxbreak: true */
/*global test: true, start: true, module: true, ok: true, equal: true, BrowserID:true */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function() {
  "use strict";

  var bid = BrowserID,
      storage = bid.Storage,
      xhr = bid.Mocks.xhr,
      WindowMock = bid.Mocks.WindowMock,
      dom = bid.DOM,
      testHelpers = bid.TestHelpers,
      validToken = true,
      controller,
      config = {
        token: "token"
      },
      docMock;

  module("pages/add_email_address", {
    setup: function() {
      testHelpers.setup();
      bid.Renderer.render("#page_head", "site/add_email_address", {});
      $(".siteinfo,.password_entry").hide();
    },
    teardown: function() {
      testHelpers.teardown();
      $("#page_head").empty();
    }
  });

  function createController(options, callback) {
    docMock = new WindowMock().document;
    controller = BrowserID.addEmailAddress.create();
    options = options || {};
    options.document = docMock;
    options.ready = callback;
    options.redirect_timeout = 1;
    controller.start(options);
  }

  function expectTooltipVisible() {
    xhr.useResult("needsPassword");
    createController(config, function() {
      controller.submit(function() {
        testHelpers.testTooltipVisible();
        start();
      });
    });
  }

  function testEmail() {
    equal(dom.getInner(".email"), "testuser@testuser.com", "correct email shown");
  }

  function testCannotConfirm() {
    ok($("#cannotconfirm").is(":visible"), "cannot confirm box is visible");
  }

  asyncTest("no password: start with good token and site - site info updated", function() {
    storage.setStagedOnBehalfOf("browserid.org");

    createController(config, function() {
      testEmail();
      ok($(".siteinfo").is(":visible"), "siteinfo is visible when we say what it is");
      equal($("body").hasClass("complete"), true, "body has complete class");
      start();
    });
  });

  asyncTest("no password: start with good token and nosite - site info not visible", function() {
    createController(config, function() {
      testEmail();
      equal($(".siteinfo").is(":visible"), false, "siteinfo is not visible without having it");
      equal($(".siteinfo .website").text(), "", "origin is not updated");
      start();
    });
  });

  asyncTest("no password: start with bad token - cannot confirm message shown", function() {
    xhr.useResult("invalid");

    createController(config, function() {
      testCannotConfirm();
      start();
    });
  });

  asyncTest("no password: start with emailForVerficationToken XHR failure - error visible", function() {
    xhr.useResult("ajaxError");
    createController(config, function() {
      testHelpers.testErrorVisible();
      start();
    });
  });

  asyncTest("password: first secondary address added - enter_password class added to body", function() {
    xhr.useResult("needsPassword");
    createController(config, function() {
      equal($("body").hasClass("enter_password"), true, "enter_password added to body");
      testEmail();
      start();
    });
  });

  asyncTest("password: missing password - tooltip visible", function() {
    $("#password").val();
    $("#vpassword").val("password");

    expectTooltipVisible();
  });

  asyncTest("password: missing verify password - tooltip visible", function() {
    $("#password").val("password");
    $("#vpassword").val();

    expectTooltipVisible();
  });

  asyncTest("password: too short of a password - tooltip visible", function() {
    $("#password").val("pass");
    $("#vpassword").val("pass");

    expectTooltipVisible();
  });

  asyncTest("password: too long of a password - tooltip visible", function() {
    var tooLong = "";
    for(var i = 0; i < 81; i++) {
      tooLong += (i % 10);
    }
    $("#password").val(tooLong);
    $("#vpassword").val(tooLong);

    expectTooltipVisible();
  });

  asyncTest("password: mismatched passwords - tooltip visible", function() {
    $("#password").val("passwords");
    $("#vpassword").val("password");

    expectTooltipVisible();
  });

  asyncTest("password: good passwords, bad token - cannot confirm", function() {
    $("#password").val("password");
    $("#vpassword").val("password");

    xhr.useResult("invalid");
    createController(config, function() {
      testCannotConfirm();
      start();
    });
  });

  asyncTest("password: good passwords, good token, no redirectTo - body has complete class", function() {
    $("#password").val("password");
    $("#vpassword").val("password");

    createController(config, function() {
      controller.submit(function(status) {
        equal(status, true, "correct status");
        equal($("body").hasClass("complete"), true, "body has complete class");
        start();
      });
    });
  });

  asyncTest("password: good passwords, good token, redirectTo - page is redirected", function() {
    $("#password").val("password");
    $("#vpassword").val("password");
    localStorage.redirectTo = "redirect_url";

    createController(config, function() {
      controller.submit(function(status) {
        equal(docMock.location, "redirect_url", "document redirected to redirect_url");
        equal(localStorage.redirectTo, null, "redirectTo has been cleared");
        start();
      });
    });
  });

}());
