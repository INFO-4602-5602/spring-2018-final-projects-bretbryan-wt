/*
 * This uses the Facebook load pattern to load an array of external scripts
 * asynchronously.
 */

(function(w, d, s) {
  var easy_loader = function(){
    var js, fjs = d.getElementsByTagName(s)[0],
      socialjs = w.Drupal.settings.easy_social.external_scripts,
      load = function(url, id) {
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.src = url; js.id = id; js.async = true;
        fjs.parentNode.insertBefore(js, fjs);
      };

    for (var i=0,len=socialjs.length; i < len; i++) {
      load(socialjs[i], 'es_scr'+i);
    }
  };

  if (w.addEventListener) {
    w.addEventListener('load', easy_loader, false);
  }
  else if (w.attachEvent) {
    w.attachEvent('onload', easy_loader);
  }
}(window, document, 'script'));
;
/**
 * @file Asynchronous tracking for Eloqua.
 */

var _elqQ = _elqQ || [];

Drupal.behaviors.eloquaApiTracking = {
  attach: function (context, settings) {
    if (context === document) {

      if (typeof settings.eloqua_api.siteId !== 'undefined') {
        _elqQ.push(['elqSetSiteId', settings.eloqua_api.siteId]);

        // Support for 1st party cookies.
        if (typeof settings.eloqua_api.firstPartyCookieHost !== 'undefined') {
          _elqQ.push(['elqUseFirstPartyCookie', settings.eloqua_api.firstPartyCookieHost]);
        }

        _elqQ.push(['elqTrackPageView']);
      }

      function async_load() {
        if (typeof settings.eloqua_api.trackingRemoteUrl !== 'undefined') {
          var s = document.createElement('script'),
              x = document.getElementsByTagName('script')[0];
          s.src = settings.eloqua_api.trackingRemoteUrl;
          s.type = 'text/javascript';
          s.async = true;
          x.parentNode.insertBefore(s, x);
        }
      }
      if (window.addEventListener) window.addEventListener('load', async_load, false);
      else if (window.attachEvent) window.attachEvent('onload', async_load);

    }
  }
};

/**
 * Passes a visitor's GUID, to the provided callback method. If first-party
 * cookie support is enabled, it will use the value from the cookie. Otherwise,
 * the GUID will be retrieved asynchronously from Eloqua.
 *
 * @param {function} callback
 *   Called with the visitor GUID upon successful retrieval. May be an empty
 *   string if one could not be found.
 */
Drupal.behaviors.eloquaApiTracking.getGuid = function getGuid(callback) {
  if (Drupal.settings.eloqua_api && typeof Drupal.settings.eloqua_api.firstPartyCookieHost !== 'undefined') {
    Drupal.behaviors.eloquaApiTracking._getGuidFromCookie(callback);
  }
  else {
    Drupal.behaviors.eloquaApiTracking._getGuidFromEloqua(callback);
  }
};

/**
 * Private method to pull GUID from first-party cookie. Pulled directly from
 * Eloqua documentation.
 *
 * @param {function} callback
 *   Callback method called with a single argument (the GUID) when the GUID is
 *   found.
 *
 * @private
 */
Drupal.behaviors.eloquaApiTracking._getGuidFromCookie = function cookieGuid(callback) {
  // HACK. @todo Implement this in a non-Tableau specific way. We have to wait
  // for the cookie to be set because it happens after a convoluted process of:
  // Configure tracking script, load it async, which fires AJAX command to an
  // Eloqua domain, which responds with a 302 to a first-party domain, which
  // sets a cookie.
  Tabia.util.waitFor(function eloquaCookieIsSet() {
    return document.cookie.indexOf('ELOQUA') !== -1;
  }, function readEloquaCookie() {
    var cookies = document.cookie.split(';'),
        subCookies,
        subCookie,
        name,
        value,
        index,
        i,
        l;

    for (i = 0; i < cookies.length; i++) {
      index = cookies[i].indexOf('=');

      if (index > 0 && cookies[i].length > index + 1) {
        name = cookies[i].substr(0, index).trim();

        if (name === 'ELOQUA') {
          value = cookies[i].substr(index + 1);
          subCookies = value.split('&');

          for (l = 0; l < subCookies.length; l++) {
            subCookie = subCookies[l].split('=');

            if (subCookie.length == 2 && subCookie[0] === 'GUID') {
              callback(Drupal.behaviors.eloquaApiTracking._formatGuid(subCookie[1]));
            }
          }
        }
      }
    }
  }, function couldNotReadEloquaCookie() {
    callback('');
  }, {
    waitTimeout: 20000
  });
};

/**
 * Private method to pull GUID from Eloqua asynchronously.
 *
 * GetElqCustomerGUID() is defined globally in the external Eloqua tracking script
 * and is available once that has loaded
 *
 * @param {function} callback
 *   Callback method called with a single arugment (the GUID) when the GUID is
 *   found.
 *
 * @private
 */
Drupal.behaviors.eloquaApiTracking._getGuidFromEloqua = function eloquaGuid(callback) {
  // Poll to see if the function to get the ELQ customer GUID is available.
  var elqCustomerLoaded = setInterval(function () {
    // If the function is not available, attempt to load the function.
    if (typeof GetElqCustomerGUID !== 'function') {
      // Poll to see if the _elqQ variable is available every 1/2 second.
      // Once it is, push elqGetCustomerGUID to load the global function.
      var elqLoaded = setInterval(function() {
        if (typeof _elqQ !== 'undefined') {
          _elqQ.push(['elqGetCustomerGUID']);
          clearInterval(elqLoaded);
        }
      }, 500);
    }
    // Once the Eloqua global scope function is available, use it to get a GUID and pass
    // the GUID to the provided callback.
    else {
      var guidFromGlobal = GetElqCustomerGUID();
      callback(Drupal.behaviors.eloquaApiTracking._formatGuid(guidFromGlobal));
      clearInterval(elqCustomerLoaded);
    }
  }, 500);
};

/**
 * Private method to format and return a "proper" 8-4-4-4-12 UUID for use in querying Eloqua by external ID.
 *
 * @param {String} SuspectGuid
 *    String that *should* contain a UUID. Might be in 8-4-4-4-12 format, might just be 32 char.
 *
 * @returns {String}
 *    String formatted as 8-4-4-4-12 UUID OR the original string (if not 32 char long).
 *
 * @private
 */
Drupal.behaviors.eloquaApiTracking._formatGuid = function formatGuid(suspectGuid) {
  if(suspectGuid.length === 32 && suspectGuid.indexOf('-') === -1) {
    return suspectGuid.substr(0, 8) + '-' + suspectGuid.substr(8, 4) + '-' + suspectGuid.substr(12, 4) + '-' + suspectGuid.substr(16, 4) + '-' + suspectGuid.substr(20);
  }
  return suspectGuid;
};
;
