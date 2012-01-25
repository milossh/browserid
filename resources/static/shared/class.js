/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


BrowserID.Class = (function() {
  function create(constr, config) {
    var inst = new constr;
    inst.init(config);
    return inst;
  }

  function extend(sup, extension) {
    var mixins = [].slice.call(arguments, 1);

    // No superclass
    if(!mixins.length) {
      mixins = [sup];
      sup = null;
    }

    var subclass = mixins[0].hasOwnProperty("constructor") ? mixins[0].constructor : function() {};

    if(sup) {
      // there is a superclass, set it up.
      // Object.create would work well here.
      var F = function() {};
      F.prototype = sup.prototype;
      subclass.prototype = new F;
      subclass.sc = sup.prototype;
    }
    else {
      // no superclass, create a prototype object.
      subclass.prototype = {};
    }

    for(var i = 0, mixin; mixin = mixins[i]; ++i) {
      for(var key in mixin) {
        subclass.prototype[key] = mixin[key];
      }
    }
    subclass.prototype.constructor = subclass;

    /**
     * Extend a class to create a subclass.
     * @method extend
     * @param {object} extensions - prototype extensions
     * @returns {function} subclass
     */
    subclass.extend = extend.bind(null, subclass);
    /**
     * Create an instance of a class
     * @method create
     * @param {object} [config] - configuration, passed on to init.
     */
    subclass.create = create.bind(null, subclass);

    return subclass;
  }

  return extend;

}());

