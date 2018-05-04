/**
 * Access the LiftIgniter API for widgets in Drupal.
 *
 * Resources:
 *   http://www.liftigniter.com/liftigniter-javascript-sdk-docs-1-1
 *   https://github.com/janl/mustache.js
 */

/* jshint loopfunc:true, forin:false */
/* globals $p */

(function($, dlHelper, behavior) {

  var config,
      listIdPrefix = 'li-recommendation-',
      blockIdPrefix = 'block-liftigniter-widget-';

  /**
   * Page load behavior.
   */
  behavior.attach = function liftIgniter(context, settings) {
    // Ajax protection.
    if (context !== document) {
      return;
    }

    // Save off settings.
    config = settings.liftIgniter;

    var widgets = (config && config.widgets) ? config.widgets : {},
        langData = (settings.dataLayer) ? settings.dataLayer.languages : {},
        defaultLang = (settings.dataLayer) ? settings.dataLayer.defaultLang : false,
        langPrefix = settings.pathPrefix.match(/^\w+-\w+\/$/),
        options = {},
        fetched;

    // Add main transform callback, allow external.
    settings.liftIgniter.transformCallbacks.push(
      behavior.basicTransforms
    );

    // Use language options.
    if (config.useLang) {
      // Prefix is present.
      if (langPrefix !== null) {
        // Find language code.
        langPrefix = langPrefix[0].slice(0, settings.pathPrefix.length - 1);
        for (var lang in langData) {
          if (langData.hasOwnProperty(lang) && langData[lang].prefix && langData[lang].prefix === langPrefix) {
            options = {'rule_language': langData[lang].language};
            break;
          }
        }
      }
      else if (config.langDefaultNoPrefix && defaultLang) {
        // Use default language.
        options = {'rule_language': defaultLang};
      }
    }

    // Register all widgets for API fetching.
    for (var widgetKey in widgets) {
      if (widgets.hasOwnProperty(widgetKey)) {
        var widget = $.extend({}, widgets[widgetKey], {
          max: parseInt(widgets[widgetKey].max, 10) || 5,
          opts: $.extend(widgets[widgetKey].opts || {}, options),
          items: widgets[widgetKey].items || []
        });

        // Request a set of specific fields.
        if (widget.fields) {
          $p('setRequestFields', widget.fields);
        }
        else if (config.fields) {
          $p('setRequestFields', config.fields);
        }

        // Mandatory request the following fields.
        if (widget.requiredFields) {
          $p("setMandatoryRequestFields", widget.requiredFields);
        }

        // Register widget request and render results.
        behavior.requestWidget(widgetKey, widget);

        // Execute all the registered widgets, possible scroll delay.
        if (typeof $.fn.waypoint !== 'undefined' && config.useWaypoints) {
          $('#' + blockIdPrefix + widgetKey).waypoint(function () {
            if (!fetched) {
              $p('fetch');
              fetched = true;
            }
          }, {offset: '100%', triggerOnce: true});
        }
        else {
          $p('fetch');
        }
      }
    }
  };

  /**
   * Register widget request.
   *
   * @param {string} key
   * @param {object} widget
   */
  behavior.requestWidget = function (key, widget) {
    $p('register', {
      max: widget.max,
      widget: key,
      opts: widget.opts,
      callback: function(response) {
        if (response.items && response.items.length) {
          // Append our items to the widget.
          widget.items = widget.items.concat(response.items);
        }

        // Limit the number of items to the defined maximum.
        widget.items = widget.items.splice(0, widget.max);

        // Apply any transformations.
        behavior.transformWidget(key, widget);
      }
    });
  };

  /**
   * Perform transformation callbacks.
   *
   * @param {string} key
   * @param {object} widget
   */
  behavior.transformWidget = function (key, widget) {
    var transformed = 0;

    if (widget.items.length) {
      // Perform transformations.
      for (var t in config.transformCallbacks) {
        config.transformCallbacks[t](widget, key, function done() {
          transformed ++;

          // When all transformations have been applied, render our widget.
          if (transformed === config.transformCallbacks.length) {
            behavior.renderWidget(key, widget);
          }
        });
      }
    }
  };

  /**
   * Render the widget.
   *
   * @param {string} key
   * @param {object} widget
   */
  behavior.renderWidget = function (key, widget) {
    var template = $('script#' + listIdPrefix + key).html(),
        $element = $('div#' + listIdPrefix + key);

    if ($element.length) {
      $element.css('visibility', 'hidden');
      $element.html($p('render', template, widget));
      $element.css('visibility', 'visible').hide().fadeIn('fast');

      // Add standard tracking. Helps improve quality.
      $p('track', {
        elements: document.querySelectorAll('#' + listIdPrefix + key + ' .recommended__item'),
        name: key,
        source: 'LI',
        _debug: false
      });

      // Trigger a document event to indicate that our widget was rendered.
      $(document).trigger('liftigniterWidgetRendered', [key, widget]);
    }
  };

  /**
   * Obtain a list of available widgets, for admin.
   *
   * @return {array}
   */
  behavior.getWidgets = function() {
    $p('getWidgetNames', {
      callback: function(widgets) {
        return widgets;
      }
    });
  };

  /**
   * Allow adjusting data after response, proxy function.
   *
   * @param {object} data
   * @param {string} key
   * @param {function} done
   *  Callback function when transformations have been completed.
   *
   * @return {object}
   */
  behavior.basicTransforms = function(data, key, done) {
    // Force current protocol.
    if (config.forceSameProtocol) {
      for (var i in data.items) {
        data.items[i].url = data.items[i].url.replace(/http(s*):/, window.location.protocol);
      }
    }

    // @todo Add option to force baseUrl.

    done();
  };

})(jQuery, new DataLayerHelper(dataLayer), Drupal.behaviors.liftIgniter = {});
;
(function ($) {

/**
 * A progressbar object. Initialized with the given id. Must be inserted into
 * the DOM afterwards through progressBar.element.
 *
 * method is the function which will perform the HTTP request to get the
 * progress bar state. Either "GET" or "POST".
 *
 * e.g. pb = new progressBar('myProgressBar');
 *      some_element.appendChild(pb.element);
 */
Drupal.progressBar = function (id, updateCallback, method, errorCallback) {
  var pb = this;
  this.id = id;
  this.method = method || 'GET';
  this.updateCallback = updateCallback;
  this.errorCallback = errorCallback;

  // The WAI-ARIA setting aria-live="polite" will announce changes after users
  // have completed their current activity and not interrupt the screen reader.
  this.element = $('<div class="progress" aria-live="polite"></div>').attr('id', id);
  this.element.html('<div class="bar"><div class="filled"></div></div>' +
                    '<div class="percentage"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.filled', this.element).css('width', percentage + '%');
    $('div.percentage', this.element).html(percentage + '%');
  }
  $('div.message', this.element).html(message);
  if (this.updateCallback) {
    this.updateCallback(percentage, message, this);
  }
};

/**
 * Start monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.startMonitoring = function (uri, delay) {
  this.delay = delay;
  this.uri = uri;
  this.sendPing();
};

/**
 * Stop monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.stopMonitoring = function () {
  clearTimeout(this.timer);
  // This allows monitoring to be stopped from within the callback.
  this.uri = null;
};

/**
 * Request progress data from server.
 */
Drupal.progressBar.prototype.sendPing = function () {
  if (this.timer) {
    clearTimeout(this.timer);
  }
  if (this.uri) {
    var pb = this;
    // When doing a post request, you need non-null data. Otherwise a
    // HTTP 411 or HTTP 406 (with Apache mod_security) error may result.
    $.ajax({
      type: this.method,
      url: this.uri,
      data: '',
      dataType: 'json',
      success: function (progress) {
        // Display errors.
        if (progress.status == 0) {
          pb.displayError(progress.data);
          return;
        }
        // Update display.
        pb.setProgress(progress.percentage, progress.message);
        // Schedule next timer.
        pb.timer = setTimeout(function () { pb.sendPing(); }, pb.delay);
      },
      error: function (xmlhttp) {
        pb.displayError(Drupal.ajaxError(xmlhttp, pb.uri));
      }
    });
  }
};

/**
 * Display errors on the page.
 */
Drupal.progressBar.prototype.displayError = function (string) {
  var error = $('<div class="messages error"></div>').html(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
  }
};

})(jQuery);
;
(function($) {

  Drupal.behaviors.asafFormWrappers = {
    attach: function(context, options) {
      // If context is form we have to take a parent to find form in context
      context = context.jquery ? context.parent() : context;

      $('form[data-asaf-area-wrapper-id]', context).once('area-wrapper', function() {
        var area = $(this);
        var wrapperId = area.data('asaf-area-wrapper-id');

        if (!area.parent().is('#'+wrapperId)) {
          area.wrap('<div id="' + wrapperId + '" class="asaf-area-wrapper" />')
        }
      });
    }
  };

  Drupal.behaviors.asafSubmitByEnter = {
    attach: function(context, options) {
      if (options.asaf && options.asaf.submitByEnter) {
        $('input.ajax-processed').each(
          function () {
            var $form = $(this).parents('form');

            $form.once('submit-by-enter', function () {
              $form.bind('keydown', function (event) {
                if (event.keyCode == 13 && event.target.tagName.toLocaleLowerCase() == 'input' && event.target.type !== 'submit' && event.target.type !== 'button') {
                  var $firstButton = $('input.ajax-processed:eq(0)');
                  var event = options.ajax[$firstButton.attr('id')]['event'];
                  if (event) {
                    $firstButton.trigger(event);
                  }
                }
              })

            });
          }
        );
      }
    }
  };

  Drupal.ajax = Drupal.ajax || {};
  Drupal.ajax.prototype.commands = Drupal.ajax.prototype.commands || {};

  Drupal.ajax.prototype.commands.asafReload = function (ajax, response, status) {
    var loc = response.window == 'parent' ? parent.location : location;
    loc.reload();
  }

  Drupal.ajax.prototype.commands.asafRedirect = function (ajax, response, status) {

    var loc = response.window == 'parent' ? parent.location : location;
    loc.href = response.href;
  }

})(jQuery);
;
/**
 * @file Reveal premium content to authenticated users.
 */

(function ($) {
  Drupal.ajax = Drupal.ajax || {};
  Drupal.ajax.prototype.commands = Drupal.ajax.prototype.commands || {};

  var beforeSend = Drupal.ajax.prototype.beforeSend,
      success = Drupal.ajax.prototype.success,
      error = Drupal.ajax.prototype.error;

  Drupal.ajax.prototype.beforeSend = function(xmlhttprequest, options) {
    // Add loading overlay on all ajax-enabled forms.
    if ($(this.selector).hasClass('premium-access-ajax__trigger')) {
      Drupal.behaviors.premiumAccessAjaxOverlay.loadOverlay($(this.selector));
    }

    beforeSend.call(this, xmlhttprequest, options);
  };

  Drupal.ajax.prototype.success = function(response, status) {
    // Fail-safe to remove loading overlay on all ajax-enabled forms.
    Drupal.behaviors.premiumAccessAjaxOverlay.removeOverlay($(this.selector));

    success.call(this, response, status);
  };

  Drupal.ajax.prototype.error = function(response, status) {
    // Fail-safe to remove loading overlay on all ajax-enabled forms.
    Drupal.behaviors.premiumAccessAjaxOverlay.removeOverlay($(this.selector));

    error.call(this, response, status);
  };

  /**
   * Client-side behavior for the premium_access_ajax module.
   */
  Drupal.behaviors.premiumAccessAjaxOverlay = {
    $overlay: $('<div class="loading-overlay">' +
      '<div class="loader">' +
      '<div class="loader__animation"></div>' +
      '<div class="loader__message"></div></div></div>'),

    attach: function (context, settings) {
      var $formWrapper = $('.asaf-area-wrapper');

      // Break out early if overlay not enabled.
      if (!settings.premiumAccessAjaxOverlay) {
        return;
      }

      // Append our overlay wrapper class if none was found.
      if (!$formWrapper.parents('.premium-access-ajax__overlay').length) {
        $('.asaf-area-wrapper').addClass('premium-access-ajax__overlay');
      }
    },

    /**
     * Appends the overlay to a given wrapper.
     */
    loadOverlay: function ($element, message) {
      var $wrapper = $element.closest('.premium-access-ajax__overlay'),
          $loader = this.$overlay.children('.loader');

      // Set the loading message.
      message = message || Drupal.settings.premiumAccessAjaxOverlay.message;

      this.$overlay.find('.loader__message').text(message);

      // Reset inline styles.
      $loader.removeAttr('style');

      if ($wrapper.length) {
        $wrapper.prepend(this.$overlay);
      }
    },

    /**
     * Removes the overlay from a given form.
     */
    removeOverlay: function ($element) {
      var $wrapper = $element.closest('.premium-access-ajax__overlay');

      if ($wrapper.length) {
        $wrapper.find('.loading-overlay').remove();
      }
    }

  };

  // Make functions available as custom AJAX commands.
  Drupal.ajax = Drupal.ajax || {};
  Drupal.ajax.prototype.commands = Drupal.ajax.prototype.commands || {};

  Drupal.ajax.prototype.commands.premiumAccessAjaxLoadOverlay = function (ajax, response, status) {
    Drupal.behaviors.premiumAccessAjaxOverlay.loadOverlay($(response.selector), response.message);
  };

  Drupal.ajax.prototype.commands.premiumAccessAjaxRemoveOverlay = function (ajax, response, status) {
    Drupal.behaviors.premiumAccessAjaxOverlay.removeOverlay($(response.selector));
  };
})(jQuery);
;
/* jshint unused:false */
/* globals _:false */
(function ($) {
  var $regForm = $('[data-form-eloqua]');

  // Trim Reg Form on submit
  $regForm.on('submit', function submitHandlerTrim (e) {
    var $this = $(this),
        $inputs = $this.find('.form-text.required');

    $inputs.each(function trimInputs () {
      var $this = $(this);
      $this.val($.trim($this.val()));
    });
  });

  // Apply jquery.validate plugin to each Reg Form.
  $regForm.each(function () {
    $(this).validate({
      ignore: '.automagic, :hidden:not(.required-hidden)',
      invalidHandler: function (event, validator) {
        // Ensure required hidden fields are visible on error.
        $('.required-hidden.error').show()
          .parent('.form-item').show();
      },
      rules: {
        'profile_about_you[field_profile_first_name][und][0][value]': {
          isAlpha: true
        },
        'field_profile_first_name': {
          isAlpha: true
        },
        'profile_about_you[field_profile_last_name][und][0][value]': {
          isAlpha: true
        },
        'field_profile_last_name': {
          isAlpha: true
        },
        'profile_about_you[field_profile_organization][und][0][value]': {
          isAlphaNum: true
        },
        'profile_about_you[mail]': {
          email: true
        },
        'mail': {
          email: true
        },
        'email': {
          email: true
        },
        'profile_about_you[tab_mail_confirm]': {
          equalTo: '#edit-profile-about-you-mail'
        },
        'profile_about_you[field_profile_phone][und][0][value]' : {
          isPhone: true,
          minlength: 5,
          maxlength: 40
        },
        'profile_about_you[taxonomy_vocabulary_4][und]': {
          selectNone: true
        },
        'profile_about_you[field_profile_department][und]': {
          selectNone: true
        },
        'profile_about_you[field_profile_job_role][und]': {
          selectNone: true
        },
        'profile_about_you[field_profile_address][und][0][country]': {
          selectNone: true
        },
        'profile_about_you[field_profile_address][und][0][administrative_area]' : {
          selectNone: true,
          isAlphaNum: true
        },
        'birthdate[date]': {
          date: true
        },
        'aws_account_id': {
          isAwsId: true
        },
        'profile_about_you[site_name]': {
          isCustomError: true
        }
      },
      messages: {
        'profile_about_you[field_profile_phone][und][0][value]': {
          minlength: Drupal.t("Please enter a valid phone number."),
          maxlength: Drupal.t("Please enter a valid phone number.")
        },
        'profile_about_you[tab_mail_confirm]': {
          equalTo: Drupal.t("The e-mail addresses do not match.")
        }
      },
      errorClass: 'error form-field__error',
      errorPlacement: function ($error, $element) {
        // .first() because the date_popup widget nests two fields with two
        // descriptions causing duplicate error messages.
        var $target = $element.parents('.form-item').find('.form-field__description').first();
        if ($target.length) {
          $target.append($error);
        }
        else {
          $element.after($error);
        }
      },
      highlight: function (element, errorClass, validClass) {
        $(element).addClass(errorClass).removeClass(validClass);
        $(element).parents('.form-item').addClass('form-field--invalid');
      },
      unhighlight: function (element, errorClass, validClass) {
        $(element).removeClass(errorClass).addClass(validClass);
        $(element).parents('.form-item').removeClass('form-field--invalid');
      }
    });
  });

  if ($('#edit-profile-about-you-field-salutation-und').length) {
    $('#edit-profile-about-you-field-salutation-und').rules('add', {
      selectNone: true
    });
  }

  // Define custom validation rules/messages.

  // Reset default messages in order to make them translatable in Drupal.
  $.validator.messages.required = Drupal.t("This field is required.");
  $.validator.messages.email = Drupal.t("Please enter a valid email address.");

  // Check if select list is set to "-None-".
  $.validator.addMethod("selectNone", function (value, element) {
    if (value === "_none" || value === "*" || value === "#empty_value" || value === " " ) {
      return false;
    }
    return true;
  }, Drupal.t("This field is required."));
  // Check if input is letters and basic characters
  $.validator.addMethod("isAlpha", function (value, element) {
    return /^([a-zA-Z\u00C0-\u1FFF\u2800-\uFFFD\u0027\u2018\u2019\s\.\-']*)?$/.test($(element).val());
  }, Drupal.t("This field can only include letters and basic characters."));
  // Check if the input is alphanumeric
  $.validator.addMethod("isAlphaNum", function (value, element) {
    return /^([a-zA-Z0-9\u00C0-\u1FFF\u2800-\uFFFD\u0027\u2018\u2019\s\-\_\,\.'\(\)\&\/\:#\pL\" ]*)?$/.test($(element).val());
  },Drupal.t("This field can only include letters and basic characters."));
  // Check if input is a valid phone number
  $.validator.addMethod("isPhone", function (value, element) {
    return /^([0-9+\-()ext. ]*)$/.test($(element).val());
  },Drupal.t("This field can only be numbers or + - x . ( ) characters."));
  $.validator.addMethod("isAwsId", function (value, element) {
    var $val = $(element).val();
    return /^([0-9]{12})$/.test($val) || !$val;
  },Drupal.t("This field must be 12-digits."));
  $.validator.addMethod("isCustomError", function (value, element, params) {
    return !$(element).hasClass('error');
  }, function (params, element) {
    var errorMessage = $(element)
      .siblings('.form-field__description').find('.error').html();

    return errorMessage;
  });

  // Bind a submit handler after validate's submit handler to allow tracking
  // of unblocked (successful) form submissions.
  $regForm.on('submit', function tabFormSubmitted (e) {
    var isAjaxForm = $(this).hasClass('premium-access-ajax'),
        isSubmitBlocked = e.isDefaultPrevented(),
        ajaxEvent = false,
        target = $(this).attr('target') || '_self',
        $form = $(this);

    if (Drupal.settings.premiumAccessAjax && Drupal.settings.premiumAccessAjax.event) {
      ajaxEvent = Drupal.settings.premiumAccessAjax.event;
    }

    if (!isSubmitBlocked) {
      // Support AJAX forms.
      if (isAjaxForm && ajaxEvent) {
        e.preventDefault();
        $(this).find('.premium-access-ajax__trigger').trigger(ajaxEvent);
        $(document).trigger('tab_form_ajax_submitted', [$form]);
      }
      else {
        // Let ezConvert handle form submissions when enabled AND not submitting
        // to a separate tab.
        if (typeof ezConvert !== 'undefined' && target !== '_blank') {
          e.preventDefault();
        }

        // Trigger a document-level custom event for goal tracking (Optimizely, etc.)
        $(document).trigger('tab_form_submitted', [$form]);
        Tabia.debug('valid form submitted', {type: 'validate'});
      }
    }
  });

  /**
   * Helper function to clear form validation errors.
   */
  $.fn.clearValidation = function () {
    var validator = $(this).data('validator');

    // Iterate through all form elements, and remove the error.
    $('[name]',this).each(function (){
      $(this).removeClass(validator.settings.errorClass);
      validator.successList.push(this);
      validator.showErrors();
    });

    validator.resetForm();
    validator.reset();
  };

  /**
   * Helper function to add a custom validation error to a given field..
   *
   * @param field
   *  The name of the element.
   * @param message
   *  The validation message to display.
   */
  $.fn.addValidationError = function (field, message) {
    var validator = $(this).data('validator'),
        $element = $('[name="' + field + '"]');

    validator.errorList.push({
      element: $element[0],
      message: message
    });

    validator.showErrors();
  };

  /**
   * Helper function to remove validation errors from a given field.
   *
   * @param field
   *  The name of the element.
   */
  $.fn.clearValidationError = function (field) {
    var validator = $(this).data('validator'),
        $element = $('[name="' + field + '"]');

    this.addValidationError(field, null);

    $element
      .removeClass(validator.settings.errorClass)
      .valid(true);
  };

}) (jQuery);
;
Drupal.behaviors.eloquaApiForm = {
  attach: function(context) {
    if (context !== document) {
      return;
    }

    // Attempt to load the GUID through our own API.
    Drupal.behaviors.eloquaApiTracking.getGuid(function setGuidOnForm(guid) {
      var inputs = document.getElementsByTagName('input'),
        i;

      // Once available, write in the value of the hidden field.
      for (i=0; i < inputs.length; i++) {
        if (inputs[i].getAttribute('name') === 'eloqua_api_cid') {
          inputs[i].value = guid;
        }
      }
    });
  }
};
;
/**
 * Custom AJAX command to reload the current page with access=onetime query param.
 */
Drupal.ajax.prototype.commands.reloadWithOneTimeAccess = function () {
  var hasQueryString = window.location.href.indexOf('?') > 0;
  window.location.href += (hasQueryString ? '&' : '?') + 'access=onetime';
};
;
/**
 * @file Add/process queue activites that should be posted to Eloqua.
 *
 * EXMAPLE:
 * $.jQueue.push({
 *     leadSource: 'Faux Trial',
 *     leadSourceDetail: 'Amazing Trial Download',
 *     campaignId: '01123581321345589144'
 *   },
 *   'Drupal.behaviors.tableauEloquaQueue.eloquaPost',
 *   {processNow: true}
 * );
 */


/* global videojs:false */

(function ($, Drupal, window, Tabia, _) {
  var nameSpace = 'jQueue';

  /**
   * Publish events and listen for queue items.
   */
  Drupal.behaviors.tableauEloquaQueue = {
    /**
     * Use the queue to later process lead activities.
     */
    attach: function(context, settings) {
      if (context !== document) { return; }

      // Users with GUID are posted server-side.
      var elqDetails = groucho.storage.get('elqDetails'),
          hasGuid = (elqDetails && typeof elqDetails === 'object' && elqDetails.status !== 'Open');

      // Track activities.
      if (settings.tableauEloqua.queueForms.length && !hasGuid) {
        leadActivityForms();
      }
      leadActivityVideos();
    },


    /**
     * Queue-item callback for submitting Eloqua CRM activities (public).
     *
     * @param {object} data
     *   Data from the form to help process.
     *
     * @return {Promise}
     */
    eloquaPost: function eloquaPost(item) {
      var completed = $.Deferred(),
          dlHelper = new DataLayerHelper(dataLayer);

      if (item.data && item.data.leadSource && item.data.campaignId && dlHelper.get('userUid') !== 0) {
        // Process data via FormFrame.
        formFramePost(item.data, completed);
      }
      else {
        completed.reject();
      }

      return completed.promise();
    }
  };


  /**
   * Lead activity: configured forms (anon premium).
   */
  function leadActivityForms() {
    $('form').submit(function anonFormActivity() {
      var $this = $(this),
          formId = $this.find('input[name="form_id"]').val(),
          data = {
            nid: $this.find('input[name="nid"]').val(),
            keyword: Tabia.util.getUrlParameter('kw'),
            leadSource: $this.find('input[name="lead_source"]').val(),
            leadSourceDetail: $this.find('input[name="lead_source_detail"]').val(),
            campaignId: $this.find('input[name="campaign_id"]').val()
          };

      // Admin configured forms.
      if (($.inArray(formId, Drupal.settings.tableauEloqua.queueForms) >= 0) &&
          data.leadSource !== null && data.campaignId !== null) {
        // Add submit event to a localStorage queue.
        $.jQueue.push(data, 'Drupal.behaviors.tableauEloquaQueue.eloquaPost');
      }
    });
  }


  /**
   * Lead activity: Brightcove video plays (anonymous AND authenticated).
   *
   * Prototype for now...
   * @todo ONLY works with in-page embed players NOT iframe.
   * @todo Make configurable, perhaps: per story, by term, or by node-type via admin page.
   */
  function leadActivityVideos() {
    var dlHelper = new DataLayerHelper(dataLayer);

    $('body.node-type-customer-story .video-js').each(function videoActivity() {
      videojs(this).on('firstplay', function brightcovePlay() {
        $.jQueue.push({
            nid: dlHelper.get('entityId'),
            leadSource: 'Customer Stories',
            leadSourceDetail: 'Customer Stories - Video – Ongoing',
            campaignId: '70132000000K669'
          },
          'Drupal.behaviors.tableauEloquaQueue.eloquaPost',
          {processNow: true}
        );
      });
    });
  }


  /**
   * Post via FormFrame in item callbacks (private).
   *
   * @param {object} data
   * @param {Deferred} completed (reference)
   */
  function formFramePost(data, completed) {
    var params = {},
        expectedParams = {
          nid: 'baseId',
          keyword: 'kw',
          leadSource: 'ls',
          leadSourceDetail: 'lsd',
          campaignId: 'cid'
        },
        frameSrc,
        $iframe;

    // Add data as frame params.
    for (var i in data) {
      if (expectedParams.hasOwnProperty(i)) {
        // Map to param name from passed data (if valid).
        params[expectedParams[i]] = data[i];
      }
    }
    // Respect language on the form/frame URL.
    frameSrc = '/' + Drupal.settings.pathPrefix + 'form/frame/post-queue?' + $.param(params);

    // Build a FormFrame.
    $iframe = $('<iframe>', {
      src: frameSrc,
      width: 0, height: 0, frameborder: 0,
      marginwidth: 0, marginheight: 0, scrolling: 'no'
    }).load(function () {
      var _thisFrame = this;

      Tabia.debug('Form frame iframe loaded', {type: nameSpace});

      /**
       * Check if frame has been submitted.
       *
       * @return {Boolean}
       */
      function isSubmitted() {
        var parsedFrameUrl;

        // Safety in-case frame still exists without a window object anymore.
        if (!_thisFrame.contentWindow) {
          return false;
        }
        // Normal check for signin param.
        parsedFrameUrl = Tabia.util.parseUrl(_thisFrame.contentWindow.location.href);
        return parsedFrameUrl.params.hasOwnProperty('signin');
      }

      // Submit the form.
      if (!isSubmitted()) {
        //this.contentWindow.postMessage(JSON.stringify({actionPremiumSubmit: 1}), this.src);
        $iframe.contents().find('[id^=tableau-premium-access-button-form]').submit();
        Tabia.debug('Queue item submit attempted via FormFrame', {
          type: nameSpace,
          data: _.extend(data, {url: _thisFrame.contentWindow.location.href})
        });
      }

      // Keep checking for frame submitted and update queue.
      Tabia.util.waitFor(
        function submittedTest() {
          return isSubmitted();
        },
        function submittedThen() {
          $(_thisFrame).remove();
          Tabia.notice('Successful Eloqua post via iframe', {type: nameSpace});
          completed.resolve();
        },
        function timeoutSubmitted() {
          $(_thisFrame).remove();
          Tabia.warning('Queue form frame post timeout. Destroying iframe', {type: nameSpace});
        },
        {waitInterval: 1000, waitTimeout: 45000}
      );
    });

    // Create a form frame.
    $('body').append($iframe);
    Tabia.debug('Building iframe', {type: nameSpace, data: {
      postedFromUrl: window.location.href,
      iframe: frameSrc
    }});

    // Send the promise.
    return completed.promise();
  }

})(jQuery, Drupal, window, Tabia, _);
;
/**
 * @file Manage initialization and logic for the standalone SearchBox.
 */
(function ($) {
  Drupal.behaviors.initCoveoSearchBox = {
    attach: function (context, settings) {
      var $searchBlocks = $('.coveo-search-block'),
          coveoDrupalSettings = settings.coveo,
          drupalSearchPath;

      if (typeof window.Coveo !== 'object' || typeof coveoDrupalSettings === 'undefined') {
        return;
      }

      // Grab the search page path. This is the redirect point when a search query is submitted
      // via any search block.
      drupalSearchPath = coveoDrupalSettings.searchPagePath;

      // Set up endpoints to query against.
      Coveo.SearchEndpoint.endpoints['default'] = new Coveo.SearchEndpoint({
        restUri: coveoDrupalSettings.searchEndpoint,
        accessToken: coveoDrupalSettings.searchToken
      });

      $searchBlocks.each(function setupCoveoSearchbox() {
        var $this = $(this),
            coveoDefaultQuery = $this.data('defaultQuery'),
            coveoTabGroup = $this.data('tabGroup') || '',
            blockSearchPath = drupalSearchPath;

        // If we find a defined tab group, append a '#t' hash param to default the state of the
        // search page to have that group selected and active by default. This corresponds to the
        // data-id attribute on the CoveoTab element.
        if (coveoTabGroup) {
          $this.on('newQuery', function (e, data) {
           $this.coveo('state').attributes.t = coveoTabGroup;
          });
        }

        // Provide a default query on initialization if no query exists.
        if (coveoDefaultQuery) {
          $this.on('afterInitialization', function () {
            var q = $this.coveo('state', 'q');

            if (!q) {
              $this.coveo('state', 'q', coveoDefaultQuery);
            }
          });
        }

        $this.coveo('initSearchbox', blockSearchPath);

      });
    }
  };
})(jQuery);
;
(function ($) {

Drupal.behaviors.textarea = {
  attach: function (context, settings) {
    $('.form-textarea-wrapper.resizable', context).once('textarea', function () {
      var staticOffset = null;
      var textarea = $(this).addClass('resizable-textarea').find('textarea');
      var grippie = $('<div class="grippie"></div>').mousedown(startDrag);

      grippie.insertAfter(textarea);

      function startDrag(e) {
        staticOffset = textarea.height() - e.pageY;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
        return false;
      }

      function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
      }
    });
  }
};

})(jQuery);
;
/**
 * Social widget behavior.
 */
Drupal.behave('tabShare').ready(function ($) {
  var $socialWidgets = $('.social-share__widget'),
      dlHelper = new DataLayerHelper(dataLayer);

  if (!$socialWidgets.length) {
    return;
  }

  // Log clicks on social widgets.
  $('.social-share__link').on('click', function shareClick () {
    var network = $(this).data('social'),
        title = dlHelper.get('entityLabel');

    // Google Analytics.
    Tabia.util.trackGA('tabShare', 'click-' + network, title);
    // Insights.
    Tabia.notice('tabShare', {data: {
      url: window.location.href,
      network: network,
      title: title,
      bundle: dlHelper.get('entityBundle'),
      language: dlHelper.get('drupalLanguage')
    }});
  });
});
;
(function ($) {

/**
 * Automatically display the guidelines of the selected text format.
 */
Drupal.behaviors.filterGuidelines = {
  attach: function (context) {
    $('.filter-guidelines', context).once('filter-guidelines')
      .find(':header').hide()
      .closest('.filter-wrapper').find('select.filter-list')
      .bind('change', function () {
        $(this).closest('.filter-wrapper')
          .find('.filter-guidelines-item').hide()
          .siblings('.filter-guidelines-' + this.value).show();
      })
      .change();
  }
};

})(jQuery);
;
(function ($) {

Drupal.mollom = Drupal.mollom || {};

/**
 * Open links to Mollom.com in a new window.
 *
 * Required for valid XHTML Strict markup.
 */
Drupal.behaviors.mollomTarget = {
  attach: function (context) {
    $(context).find('.mollom-target').click(function () {
      this.target = '_blank';
    });
  }
};

/**
 * Retrieve and attach the form behavior analysis tracking image if it has not
 * yet been added for the form.
 */
Drupal.behaviors.mollomFBA = {
  attach: function (context, settings) {
    $(':input[name="mollom[fba]"][value=""]', context).once().each(function() {
      $input = $(this);
      $.ajax({
        url: Drupal.settings.basePath + Drupal.settings.pathPrefix + 'mollom/fba',
        type: 'POST',
        dataType: 'json',
        success: function(data) {
          if (!data.tracking_id || !data.tracking_url) {
            return;
          }
          // Save the tracking id in the hidden field.
          $input.val(data.tracking_id);
          // Attach the tracking image.
          $('<img src="' + data.tracking_url + '" width="1" height="1" alt="" />').appendTo('body');
        }
      })
    });
  }
};

 /**
 * Attach click event handlers for CAPTCHA links.
 */
Drupal.behaviors.mollomCaptcha = {
  attach: function (context, settings) {
    $('a.mollom-switch-captcha', context).click(function (e) {
      var $mollomForm = $(this).parents('form');
      var newCaptchaType = $(this).hasClass('mollom-audio-captcha') ? 'audio' : 'image';
      Drupal.mollom.getMollomCaptcha(newCaptchaType, $mollomForm);
    });
    $('a.mollom-refresh-captcha', context).click(function (e) {
      var $mollomForm = $(this).parents('form');
      var currentCaptchaType = $(this).hasClass('mollom-refresh-audio') ? 'audio' : 'image';
      Drupal.mollom.getMollomCaptcha(currentCaptchaType, $mollomForm);
    });
  }
};

/**
 * Fetch a Mollom CAPTCHA and output the image or audio into the form.
 *
 * @param captchaType
 *   The type of CAPTCHA to retrieve; one of "audio" or "image".
 * @param context
 *   The form context for this retrieval.
 */
Drupal.mollom.getMollomCaptcha = function (captchaType, context) {
  var formBuildId = $('input[name="form_build_id"]', context).val();
  var mollomContentId = $('input.mollom-content-id', context).val();

  var path = 'mollom/captcha/' + captchaType + '/' + formBuildId;
  if (mollomContentId) {
    path += '/' + mollomContentId;
  }

  // Retrieve a new CAPTCHA.
  $.ajax({
    url: Drupal.settings.basePath + Drupal.settings.pathPrefix + path,
    type: 'POST',
    dataType: 'json',
    success: function (data) {
      if (!(data && data.content)) {
        return;
      }
      // Inject new CAPTCHA.
      $('.mollom-captcha-content', context).parent().html(data.content);
      // Update CAPTCHA ID.
      $('input.mollom-captcha-id', context).val(data.captchaId);
      // Add an onclick-event handler for the new link.
      Drupal.attachBehaviors(context);
      // Focus on the CAPTCHA input.
      if (captchaType == 'image') {
          $('input[name="mollom[captcha]"]', context).focus();
      } else {
         // Focus on audio player.
         // Fallback player code is responsible for setting focus upon embed.
         if ($('#mollom_captcha_audio').is(":visible")) {
             $('#mollom_captcha_audio').focus();
         }
      }
    }
  });
  return false;
}

})(jQuery);
;
/**
 * Display a message highlighting the language drop down when the browser's
 * language preference does not match the current page and a translation exists.
 */
(function($) {
  $(document).ready(function() {
    var maxRepeats = parseInt(Drupal.settings.lang_dropdown_remind.repeat),
        repeated = parseInt($.cookie('langDropdownReminded')) || 0;

    // Ensure we only show the message as many times as specified.
    if (repeated < maxRepeats) {
      Drupal.getLanguagePreference(function(langPref) {
        // Support XHTML and HTML5 language identification methods.
        var docLang = $('html').attr('xml:lang') || $('html').attr('lang'),
            langOnly = langPref.substr(0, 2);

        // We care if the language preference and document language don't match.
        if (langOnly.length === 2 && docLang.indexOf(langOnly) === -1) {
          // Support the following language selectors:
          // 1) Core Language Switcher
          // 2) Language Switcher Dropdown (lang_dropdown 1.x)
          // 3) Language Switcher Dropdown (lang_dropdown 2.x)
          var $langLink = $('.language-switcher-locale-url li[class~="' + langOnly + '"] a,' +
                            '#lang-dropdown-form input[name^="' + langOnly + '"],' +
                            '#lang_dropdown_form_language input[name^="' + langOnly + '"]'),
              translationExists = false;

          if ($langLink.length) {
            // Core language switcher.
            if ($langLink.attr('href') !== undefined && $langLink.attr('href').indexOf('node') === -1) {
              translationExists = true;
            }
            // Language switcher dropdown (lang_dropdown).
            else if ($langLink.attr('value') !== undefined && $langLink.attr('value').indexOf('node') === -1) {
              translationExists = true;
            }
          }

          // Furthermore, we only care if an appropriate translation exists.
          if (translationExists) {
            // Create, insert, and display the message.
            var message = Drupal.settings.lang_dropdown_remind.messages[langOnly] || Drupal.settings.lang_dropdown_remind.messages['default'];
            var closeMsg = Drupal.settings.lang_dropdown_remind.close[langOnly] || Drupal.settings.lang_dropdown_remind.close['default'];
            var close = '<a id="langdropdown-reminder-close">' + closeMsg + '</a>';
            var $markup = $('<div id="langdropdown-reminder">' +
              Drupal.settings.lang_dropdown_remind.markup.replace('!message', message).replace('!close_button', close) +
              '</div>');
            $markup.hide();
            $(Drupal.settings.lang_dropdown_remind.prependto).prepend($markup);
            // Triggering a custom event that can be used for custom interaction
            // in a theme.
            $(Drupal.settings.lang_dropdown_remind.prependto).trigger('lang_dropdown_remind_ready');

            $('#langdropdown-reminder').slideDown();

            // Allow something to trigger opening of the language dropdown.
            $('#trigger-langdropdown').click(function() {$('#edit-lang-dropdown-select_child').toggle();});

            // Behavior for the "close" button.
            $('#langdropdown-reminder-close').click(function() {
              // Trigger a custom event when the language bar is about to be closed. Useful for styling in a theme.
              $(Drupal.settings.lang_dropdown_remind.prependto).trigger('lang_dropdown_remind_close');

              $('#langdropdown-reminder').slideUp();

              // Ensure the language switcher dropdown is also gone (otherwise,
              // it would be awkwardly stuck open with no way to close it).
              $('#edit-lang-dropdown-select_child').css('display', '');

              // If a user physically clicked the "close" button, don't ever
              // display the reminder again (for this session).
              $.cookie('langDropdownReminded', maxRepeats, {path: '/'});
            });

            // Increment the repeated value in the cookie.
            $.cookie('langDropdownReminded', ++repeated, {path: '/'});
          }
        }
      });
    }
  });
})(jQuery);
;
/**
 * @file Common data layer helper.
 */

(function ($) {
  Drupal.behaviors.dataLayer = {

    /**
     * The language prefix list (no blank).
     *
     * @return {array}
     */
    langPrefixes: function langPrefixes() {
      var languages = Drupal.settings.dataLayer.languages,
          langList = [];

      for (var lang in languages) {
        if (languages[lang].prefix !== '') {
          langList.push(languages[lang].prefix);
        }
      }
      return langList;

      // With Underscore.js dependency.
      //var list = _.pluck(Drupal.settings.datalayer.languages, 'prefix');
      //return _.filter(list, function(lang) { return lang });
    },

    /**
     * Drupal behavior.
     */
    attach: function() { return }

  };
})(jQuery);
;
// When updating this file, please update the corresponding JSON file country_region.json.

Tabia = window.Tabia || {};

Tabia.mapping = Tabia.mapping || {};

Tabia.mapping.countryRegion = {
  'AD': {
    'region': 39
  },
  'AE': {
    'region': 145
  },
  'AF': {
    'region': 34
  },
  'AG': {
    'region': 29
  },
  'AI': {
    'region': 29
  },
  'AL': {
    'region': 39
  },
  'AM': {
    'region': 145
  },
  'AN': {
    'region': 29
  },
  'AO': {
    'region': 17
  },
  'AP': {
    'region': 142
  },
  'AR': {
    'region': 5
  },
  'AS': {
    'region': 61
  },
  'AT': {
    'region': 155
  },
  'AU': {
    'region': 53
  },
  'AW': {
    'region': 29
  },
  'AX': {
    'region': 154
  },
  'AZ': {
    'region': 145
  },
  'BA': {
    'region': 39
  },
  'BB': {
    'region': 29
  },
  'BD': {
    'region': 34
  },
  'BE': {
    'region': 155
  },
  'BF': {
    'region': 11
  },
  'BG': {
    'region': 151
  },
  'BH': {
    'region': 145
  },
  'BI': {
    'region': 14
  },
  'BJ': {
    'region': 11
  },
  'BL': {
    'region': 29
  },
  'BM': {
    'region': 21
  },
  'BN': {
    'region': 35
  },
  'BO': {
    'region': 5
  },
  'BR': {
    'region': 5
  },
  'BS': {
    'region': 29
  },
  'BT': {
    'region': 34
  },
  'BU': {
    'region': 35
  },
  'BW': {
    'region': 18
  },
  'BY': {
    'region': 151
  },
  'BZ': {
    'region': 13
  },
  'CA': {
    'region': 21
  },
  'CD': {
    'region': 17
  },
  'CF': {
    'region': 17
  },
  'CG': {
    'region': 17
  },
  'CH': {
    'region': 155
  },
  'CI': {
    'region': 11
  },
  'CK': {
    'region': 61
  },
  'CL': {
    'region': 5
  },
  'CM': {
    'region': 17
  },
  'CN': {
    'region': 30
  },
  'CO': {
    'region': 5
  },
  'CR': {
    'region': 13
  },
  'CS': {
    'region': 39
  },
  'CU': {
    'region': 29
  },
  'CV': {
    'region': 11
  },
  'CY': {
    'region': 145
  },
  'CZ': {
    'region': 151
  },
  'DD': {
    'region': 155
  },
  'DE': {
    'region': 155
  },
  'DJ': {
    'region': 14
  },
  'DK': {
    'region': 154
  },
  'DM': {
    'region': 29
  },
  'DO': {
    'region': 29
  },
  'DZ': {
    'region': 15
  },
  'EC': {
    'region': 5
  },
  'EE': {
    'region': 154
  },
  'EG': {
    'region': 15
  },
  'EH': {
    'region': 15
  },
  'ER': {
    'region': 14
  },
  'ES': {
    'region': 39
  },
  'ET': {
    'region': 14
  },
  'EU': {
    'region': 150
  },
  'FI': {
    'region': 154
  },
  'FJ': {
    'region': 54
  },
  'FK': {
    'region': 5
  },
  'FM': {
    'region': 57
  },
  'FO': {
    'region': 154
  },
  'FR': {
    'region': 155
  },
  'FX': {
    'region': 155
  },
  'GA': {
    'region': 17
  },
  'GB': {
    'region': 154
  },
  'GD': {
    'region': 29
  },
  'GE': {
    'region': 145
  },
  'GF': {
    'region': 5
  },
  'GG': {
    'region': 154
  },
  'GH': {
    'region': 11
  },
  'GI': {
    'region': 39
  },
  'GL': {
    'region': 21
  },
  'GM': {
    'region': 11
  },
  'GN': {
    'region': 11
  },
  'GP': {
    'region': 29
  },
  'GQ': {
    'region': 17
  },
  'GR': {
    'region': 39
  },
  'GT': {
    'region': 13
  },
  'GU': {
    'region': 57
  },
  'GW': {
    'region': 11
  },
  'GY': {
    'region': 5
  },
  'HK': {
    'region': 30
  },
  'HN': {
    'region': 13
  },
  'HR': {
    'region': 39
  },
  'HT': {
    'region': 29
  },
  'HU': {
    'region': 151
  },
  'ID': {
    'region': 35
  },
  'IE': {
    'region': 154
  },
  'IL': {
    'region': 145
  },
  'IM': {
    'region': 154
  },
  'IN': {
    'region': 34
  },
  'IQ': {
    'region': 145
  },
  'IR': {
    'region': 145
  },
  'IS': {
    'region': 154
  },
  'IT': {
    'region': 39
  },
  'JE': {
    'region': 154
  },
  'JM': {
    'region': 29
  },
  'JO': {
    'region': 145
  },
  'JP': {
    'region': 30
  },
  'KE': {
    'region': 14
  },
  'KG': {
    'region': 143
  },
  'KH': {
    'region': 35
  },
  'KI': {
    'region': 57
  },
  'KM': {
    'region': 14
  },
  'KN': {
    'region': 29
  },
  'KP': {
    'region': 30
  },
  'KR': {
    'region': 30
  },
  'KW': {
    'region': 145
  },
  'KY': {
    'region': 29
  },
  'KZ': {
    'region': 143
  },
  'LA': {
    'region': 35
  },
  'LB': {
    'region': 145
  },
  'LC': {
    'region': 29
  },
  'LI': {
    'region': 155
  },
  'LK': {
    'region': 34
  },
  'LR': {
    'region': 11
  },
  'LS': {
    'region': 18
  },
  'LT': {
    'region': 154
  },
  'LU': {
    'region': 155
  },
  'LV': {
    'region': 154
  },
  'LY': {
    'region': 15
  },
  'MA': {
    'region': 15
  },
  'MC': {
    'region': 155
  },
  'MD': {
    'region': 151
  },
  'ME': {
    'region': 39
  },
  'MF': {
    'region': 29
  },
  'MG': {
    'region': 14
  },
  'MH': {
    'region': 57
  },
  'MK': {
    'region': 39
  },
  'ML': {
    'region': 11
  },
  'MM': {
    'region': 35
  },
  'MN': {
    'region': 30
  },
  'MO': {
    'region': 30
  },
  'MP': {
    'region': 57
  },
  'MQ': {
    'region': 29
  },
  'MR': {
    'region': 11
  },
  'MS': {
    'region': 29
  },
  'MT': {
    'region': 39
  },
  'MU': {
    'region': 14
  },
  'MV': {
    'region': 34
  },
  'MW': {
    'region': 14
  },
  'MX': {
    'region': 13
  },
  'MY': {
    'region': 35
  },
  'MZ': {
    'region': 14
  },
  'NA': {
    'region': 18
  },
  'NC': {
    'region': 54
  },
  'NE': {
    'region': 11
  },
  'NF': {
    'region': 53
  },
  'NG': {
    'region': 11
  },
  'NI': {
    'region': 13
  },
  'NL': {
    'region': 155
  },
  'NO': {
    'region': 154
  },
  'NP': {
    'region': 34
  },
  'NR': {
    'region': 57
  },
  'NT': {
    'region': 145
  },
  'NU': {
    'region': 61
  },
  'NZ': {
    'region': 53
  },
  'OM': {
    'region': 145
  },
  'PA': {
    'region': 13
  },
  'PE': {
    'region': 5
  },
  'PF': {
    'region': 61
  },
  'PG': {
    'region': 54
  },
  'PH': {
    'region': 35
  },
  'PK': {
    'region': 34
  },
  'PL': {
    'region': 151
  },
  'PM': {
    'region': 21
  },
  'PN': {
    'region': 61
  },
  'PR': {
    'region': 29
  },
  'PS': {
    'region': 145
  },
  'PT': {
    'region': 39
  },
  'PW': {
    'region': 57
  },
  'PY': {
    'region': 5
  },
  'QA': {
    'region': 145
  },
  'RE': {
    'region': 14
  },
  'RO': {
    'region': 151
  },
  'RS': {
    'region': 39
  },
  'RU': {
    'region': 151
  },
  'RW': {
    'region': 14
  },
  'SA': {
    'region': 145
  },
  'SB': {
    'region': 54
  },
  'SC': {
    'region': 14
  },
  'SD': {
    'region': 15
  },
  'SE': {
    'region': 154
  },
  'SG': {
    'region': 35
  },
  'SH': {
    'region': 11
  },
  'SI': {
    'region': 39
  },
  'SJ': {
    'region': 154
  },
  'SK': {
    'region': 151
  },
  'SL': {
    'region': 11
  },
  'SM': {
    'region': 39
  },
  'SN': {
    'region': 11
  },
  'SO': {
    'region': 14
  },
  'SR': {
    'region': 5
  },
  'ST': {
    'region': 17
  },
  'SU': {
    'region': 151
  },
  'SV': {
    'region': 13
  },
  'SY': {
    'region': 145
  },
  'SZ': {
    'region': 18
  },
  'TC': {
    'region': 29
  },
  'TD': {
    'region': 17
  },
  'TG': {
    'region': 11
  },
  'TH': {
    'region': 35
  },
  'TJ': {
    'region': 143
  },
  'TK': {
    'region': 61
  },
  'TL': {
    'region': 35
  },
  'TM': {
    'region': 143
  },
  'TN': {
    'region': 15
  },
  'TO': {
    'region': 61
  },
  'TP': {
    'region': 35
  },
  'TR': {
    'region': 145
  },
  'TT': {
    'region': 29
  },
  'TV': {
    'region': 61
  },
  'TW': {
    'region': 30
  },
  'TZ': {
    'region': 14
  },
  'UA': {
    'region': 151
  },
  'UG': {
    'region': 14
  },
  'US': {
    'region': 21
  },
  'UY': {
    'region': 5
  },
  'UZ': {
    'region': 143
  },
  'VA': {
    'region': 39
  },
  'VC': {
    'region': 29
  },
  'VE': {
    'region': 5
  },
  'VG': {
    'region': 29
  },
  'VI': {
    'region': 29
  },
  'VN': {
    'region': 35
  },
  'VU': {
    'region': 54
  },
  'WF': {
    'region': 61
  },
  'WS': {
    'region': 61
  },
  'YD': {
    'region': 145
  },
  'YE': {
    'region': 145
  },
  'YT': {
    'region': 14
  },
  'YU': {
    'region': 39
  },
  'ZA': {
    'region': 18
  },
  'ZM': {
    'region': 14
  },
  'ZW': {
    'region': 14
  }
};
;
/**
 * Data mapping for raw API values.
 *
 * When updating this file, please update the corresponding JSON file general_mappers.json.
 *
 * @todo Expose taxonomy term name/field settings from Drupal.
 */

Tabia.mapping = Tabia.mapping || {};

// General region mapping data. Sub-regions must be an array.
Tabia.mapping.regionsGeneralized = {
  1730: {
    name: 'North America',
    subRegions: [ 21 ],
    sampleCounty: 'US'
  },
  1733: {
    name: 'Europe',
    subRegions: [ 150, 39, 151, 154, 155 ],
    sampleCounty: 'GB'
  },
  1732: {
    name: 'Asia Pacific',
    subRegions: [ 142, 30, 34, 35, 53, 54, 57, 61, 143],
    sampleCounty: 'JP'
  },
  1731: {
    name: 'Latin America',
    subRegions: [ 19, 419, 5, 13, 29 ],
    sampleCounty: 'BZ'
  },
  1734: {
    name: 'Middle East & Africa',
    subRegions: [ 2, 9, 11, 14, 15, 17, 18, 145],
    sampleCounty: 'EG'
  }
};

// Drupal term mapping to employee count.
Tabia.mapping.orgSize = {
  1943: {
    name: 'Small Business',
    count: 1500
  },
  1944: {
    name: 'Medium Organization',
    count: 5000
  },
  1945: {
    name: 'Enterprise',
    count: 9999999
  }
};

// Drupal term mapping to raw industry values.
Tabia.mapping.industries = {
  1600: {
    name: 'Aerospace & Defense'
  },
  1601: {
    name: 'Agriculture & Mining'
  },
  1602: {
    name: 'Associations & Non-Profits'
  },
  1366: {
    name: 'Automotive'
  },
  1606: {
    name: 'Banking & Finance',
    synonyms: ['Banking', 'Securities & Investments']
  },
  1367: {
    name: 'Business Services'
  },
  1603: {
    name: 'Construction'
  },
  249: {
    name: 'Consumer Goods & Services',
    synonyms: ['Consumer Goods', 'Consumer Services']
  },
  283: {
    name: 'Education'
  },
  432: {
    name: 'Energy & Utilities',
    synonyms: ['Natural Resources', 'Oil & Gas', 'Utilities']
  },
  1604: {
    name: 'Food & Beverage'
  },
  273: {
    name: 'Government'
  },
  1605: {
    name:'Hardware'
  },
  254: {
    name: 'Healthcare & Medical',
    synonyms: ['Healthcare Providers', 'Medical Devices']
  },
  272: {
    name: 'High Technology',
    synonyms: ['Software & Technology']
  },
  1372: {
    name: 'Manufacturing',
    synonyms: ['Industrial Machinery', 'Chemicals', 'Mill Products']
  },
  400: {
    name: 'Insurance',
    synonyms: ['Healthcare Payers']
  },
  311: {
    name: 'Investment Services'
  },
  1607: {
    name: 'Media, Entertainment & Publishing',
    synonyms: ['Media & Entertainment']
  },
  1369: {
    name: 'Other',
    synonyms: ['(null)', 'N/A', 'Unclassified']
  },
  611: {
    name: 'Pharmaceuticals & Biotech',
    synonyms: ['Pharmaceuticals']
  },
  256: {
    name: 'Retail & Distribution',
    synonyms: ['Retail & Wholesale']
  },
  1371: {
    name: 'Telecommunications',
    synonyms: ['Communications']
  },
  1361: {
    name: 'Transportation & Logistics'
  },
  1370: {
    name: 'Travel & Hospitality',
    synonyms: ['Hospitality & Travel']
  }
};
;
/**
 * @file Demandbase data processing.
 */

// jshint camelcase:false
(function ($) {

  var behave = Drupal.behave('tabDemandbase'),
      behavior = behave.behavior(),
      urlParams = {
        nodemandbase: Tabia.util.getUrlParameter('nodemandbase'),
        nodemandbasefill: Tabia.util.getUrlParameter('nodemandbasefill')
      };

  /**
   * Initialize behaviors.
   */
  behavior.init = function () {
    // Save reference to settings object on behavior (concise and readable code).
    behavior.settings = this.settings.tableau_demandbase_integration || {};

    // Default enabled. Can disable by setting window.demandbaseDisabled true, or by
    // providing the nodemandbase=1 query parameter.
    behavior.enabled = !window.demandbaseDisabled;
    if (Number(urlParams.nodemandbase)) {
      behavior.enabled = false;
    }

    // The flags below allow certain behaviors to be modified, e.g., with Optimizely.

    // Allow user-facing input filling?
    // Set via admin UI, or, for an Optimizely variation,
    // set window.demandbaseAllowUserFacingFill before DOM-ready.
    if (!_.isUndefined(window.demandbaseAllowUserFacingFill)) {
      behavior.settings.allowUserFacingFill = window.demandbaseAllowUserFacingFill;
    }

    // For QA or other reasons, you can also disable filling via query param.
    if (!_.isNull(urlParams.nodemandbasefill)) {
      behavior.settings.allowUserFacingFill = !Number(urlParams.nodemandbasefill);
    }

    // Build Demandbase to CMS mapping values from JSON data.
    if (typeof behavior.dataMapping === 'undefined') {
      behavior.dataMapping = {
        // Get standardized regions from country.
        countries: Tabia.mapping.countryRegion,
        // Setup general CMS value mapping.
        regionsGeneralized: Tabia.mapping.regionsGeneralized,
        industries: Tabia.mapping.industries
      };
    }
  };

  /**
   * Set enabled state.
   *
   * @param {boolean} enabled
   */
  behavior.setEnabled = function (enabled) {
    Tabia.debug('setting enabled status: ' + (enabled ? 'enabled' : 'disabled'),
      {type: 'demandbase'}
    );
    behavior.enabled = enabled;
    if (enabled) {
      Tabia.debug('triggering demandbase:initWidgets', {type: 'demandbase'});
      $(document).trigger('demandbase:initWidgets');
    }
  };

  /**
   * Global function to parse and return Demandbase data.
   *
   * @param {object} data
   *   User data from Demand Base.
   * @param {object} options
   *   userFacing {boolean} Should use facing fields be updated. (For ISP)
   *   geoOnly {boolean} Should only geographic fields be updated. (For ISP)
   *
   * @return {$.Deferred} A deferred object to relay async success or failure state.
   */
   behavior.useData = function(data, options) {
    var deferred = $.Deferred(),
        request,
        useData,
        industryTid,
        stashed;

    // Create a request object with a Deferred and options (with defaults).
    request = {
      deferred: deferred,
      options: $.extend({
        userFacing: false,
        geoOnly: false
      }, options)
    };

    if (!behavior.enabled) {
      Tabia.debug('Disabled, not using demandbase data', {type: 'demandbase'});
      deferred.reject({reason: 'disabled'});
      return;
    }

    // Grab industry tid using mapping config.
    for (var tid in behavior.dataMapping.industries) {
      if (behavior.dataMapping.industries[tid].name === data.industry) {
        industryTid = tid;
        break;
      }
    }
    useData = {
      ip: data.ip || false,
      information_level: data.information_level || false,
      organization: data.company_name,
      industry: data.industry,
      industry_tnid: industryTid,
      sub_industry: data.sub_industry,
      employee_count: data.employee_count,
      annual_sales: data.annual_sales,
      primary_sic: data.primary_sic,
      web_site: data.web_site,
      state: data.state || data.registry_state,
      country: data.country || data.registry_country_code,
      zip: data.zip
    };
    Tabia.debug('Using demandbase data',
      {type: 'demandbase', data: {data: data, useData: useData, options: options}}
    );

    // Use the data on the form.
    behavior.applyData(useData, request);

    // Stash Demandbase result.
    groucho.storage.set('demandbase', data);
    // Update standardized localStorage user.
    stashed = _.extend(_.pick(useData, 'ip', 'organization', 'country', 'state', 'city'), {
      industry: Number(industryTid),
      postalcode: data.zip,
      latitude: data.latitude || data.registry_latitude,
      longitude: data.longitude || data.registry_longitude
    });
    // Do not overwrite (keep original).
    groucho.userSet(stashed, true, this.settings.stashTtl);
    Tabia.debug('User properties set by Demandbase', {data: stashed});

    return deferred;
  };

  /**
   * Alter reg. form based on Demandbase data.
   *
   * @param {object} data
   *   User data after being altered to work with CMS.
   * @param {object} request
   *   deferred {$.Deferred}
   *   options {object}
   *     userFacing {boolean} Should use facing fields be updated. (For ISP)
   *     geoOnly {boolean} Should only geographic fields be updated. (For ISP)
   */
   behavior.applyData = function (data, request) {
    var customEvent;

    // Trigger a custom event and return if it's prevented.
    customEvent = jQuery.Event('demandbase:applyData');
    $(document).trigger(customEvent, [data]);
    if (customEvent.isDefaultPrevented()) {
      request.deferred.reject({reason: 'prevented in demandbase:applyData event handler'});
      return;
    }

    // Clear hidden fields each time we get new data.
    $('[id^="edit-db"]').val('');

    // Apply Demandbase data as requested.
    behavior.applyHiddenData(data, request);
    if (request.options.userFacing) {
      behavior.applyUserFacingData(data, request);
    }
  };

  /**
   * Alter geo form fields based on Demandbase data.
   *
   * @param {object} data
   */
  behavior.applyHiddenData = function (data, options) {
    Tabia.debug('applying hidden demandbase data', {type: 'demandbase'});
    // Allow just geo-fields for testing accuracy of IP-only based matching.
    if (!options.geoOnly) {
      $('#edit-db-industry').val(data.industry || '');
      $('#edit-db-sub-industry').val(data.sub_industry || '');
      $('#edit-db-employee-count').val(data.employee_count || '');
      $('#edit-db-annual-sales').val(data.annual_sales || '');
      $('#edit-db-sic').val(data.primary_sic || '');
      $('#edit-db-web-site').val(data.web_site || '');
    }
    $('#edit-db-state').val(data.state || '');
    $('#edit-db-country').val(data.country || '');
    $('#edit-db-zip').val(data.zip || '');
  };

  /**
   * Fill the Demandbase data based on options.
   *
   * @param {object} data
   * @param {object} request
   *   deferred {$.Deferred}
   *   options {object}
   *     userFacing {boolean} Should use facing fields be updated. (For ISP)
   *     geoOnly {boolean} Should only geographic fields be updated. (For ISP)
   */
  behavior.fillFormFields = function (data, request) {
    var options = request.options,
        $organization = $('[id^=edit-profile-about-you-field-profile-organization-und-0-value]'),
        $industry = $('[id^=edit-profile-about-you-taxonomy-vocabulary-4-und]'),
        $country = $('[id^=edit-profile-about-you-field-profile-address-und-0-country]'),
        $postalCode = $('[id^=edit-profile-about-you-field-profile-address-und-0-postal-code]'),
        $administrativeArea,
        industry;

    // Abort if not detailed information_level from the IP API.
    if (data.ip && data.information_level.toLowerCase() !== 'detailed') {
      Tabia.debug('autofill aborted, information_level not detailed',
        {type: 'demandbase'}
      );
      request.deferred.reject({reason: 'partial data'});
      return;
    }

    if (!behavior.settings.allowUserFacingFill) {
      Tabia.debug('autofill aborted, per global override',
        {type: 'demandbase'}
      );
      return;
    }
    else {
      Tabia.debug('filling form fields', {type: 'demandbase'});
    }

    // Set non-geo fields.
    if (!options.geoOnly) {
      Tabia.debug('autofilling non-geo fields', {type: 'demandbase'});
      // Grab industry tid using mapping config.
      for (var tid in behavior.dataMapping.industries) {
        if (behavior.dataMapping.industries[tid].name === data.industry) {
          industry = tid;
          break;
        }
      }
      if (data.organization) {
        $organization.val(data.organization).change();
      }
      // Update industry first, no dependency on addressfield.
      if ($industry.find("option[value='" + data.industry_tnid + "']").length) {
        $industry.val(data.industry_tnid).change();
      }
    }

    // Set geo fields.
    // @todo Remove window.autoFillDisabled after testing is complete.
    if (!window.autoFillDisabled) {
      Tabia.debug('autofilling geo fields', {type: 'demandbase'});
      // Note: since we're using jquery.addressfield, and jquery.validate,
      // We want to (and CAN) change the zip field first. Otherwise, the
      // jquery.validate plugin will trigger validation on the old value due
      // to the country change.
      $postalCode.val(data.zip).change();

      // Only update country if it differs from the current value (Addressfield).
      if (data.country !== $country.val() && data.country + '*' !== $country.val()) {
        $country.val(data.country).change();
      }

      // Get a reference to the newly created DOM element (by jquery.addressfield).
      $administrativeArea = $('#edit-profile-about-you-field-profile-address-und-0-administrative-area');

      // We still want to trigger the select list selection after the
      // jquery.addressfield plugin updates the state field to a pick list.

      // Now that jquery.addressfield has updated the addressfield elements DOM,
      // it's safe to modify the administrative-area value.

      $administrativeArea.val(data.state).change();

      if (!data.state) {
        Tabia.debug('missing demandbase value: state', {type: 'demandbase'});
        // Inform geocomplete that we're missing data, so it won't automatically hide it.
        $administrativeArea.attr('data-geocomplete-expand', true);
      }

      $(document).trigger('demandbase:geoFillAfter', data);
    }

    // Resolve our Deferred with the data.
    request.deferred.resolve({data: data});
  };

  /**
   * Alter user-facing form fields based on Demandbase data.
   *
   * @param {object} data
   * @param {object} request
   *   deferred {$.Deferred}
   *   options {object}
   *     userFacing {boolean} Should use facing fields be updated. (For ISP)
   *     geoOnly {boolean} Should only geographic fields be updated. (For ISP)
   */
  behavior.applyUserFacingData = function (data, request) {
    var options = request.options,
        autoFillEnabled = false,
        region;

    Tabia.debug('applying user-facing demandbase data', {type: 'demandbase'});

    // Always fill autocomplete on email domain match. We determine this
    // from the db_source.
    // @see tableau_demandbase_integration/callbacks/user-registration.js
    if (window.db_source === 'domain') {
      Tabia.debug('is email domain match', {type: 'demandbase'});
      autoFillEnabled = true;
      options.geoOnly = false;
    }
    else {
      // Auto-complete geo only.
      $.each(behavior.settings.geoOnlyCountries, function (country) {
        if (behavior.settings.geoOnlyCountries[country] === data.country) {
          // Do autofill, some.
          Tabia.debug('is geo only country', {type: 'demandbase'});
          autoFillEnabled = true;
          options.geoOnly = true;
        }
      });
    }

    // Auto-complete everything!
    if (!options.geoOnly) {
      // Region for this user.
      if (typeof behavior.dataMapping.countries[data.country] !== 'undefined') {
        region = behavior.dataMapping.countries[data.country].region;
      }
      // Should we disable autocomplete?
      $.each(behavior.settings.everythingRegions, function (r) {
        if (parseInt(behavior.settings.everythingRegions[r]) === region) {
          // Do autofill everything.
          Tabia.debug('autofill enabled by region', {type: 'demandbase'});
          autoFillEnabled = true;
          options.geoOnly = false;
        }
      });
    }

    if (autoFillEnabled) {
      behavior.fillFormFields(data, request);
    }
    else {
      Tabia.debug('autofill is disabled', {type: 'demandbase'});
    }
  };

  // Attach init DOM ready callback.
  behave.ready(behavior.init);

})(jQuery);
;
/**
 * @file Kick-off the Demandbase form behaviors.
 */

/* jshint camelcase:false */

var demandbase_parse = function demandbase_parse (company) {
  window.db_company = company;
  Tabia.debug('db_company triggered');
  jQuery(document).trigger('db_company', company);
};

Drupal.behave('tabDemandbaseIP').ready(function ($) {
  var tabDemandbase = Drupal.behaviors.tabDemandbase,
      $forms = $('[data-form-eloqua]');

  // Abort if behavior disabled or no forms.
  if (!tabDemandbase.enabled || !$forms.length) {
    return;
  }

  // Request script asynchronously.
  $.getScript(tabDemandbase.settings.ipScript);

  // Kick-off the Demandbase form behaviors.
  // Wait for db_company object to be available, then process it.
  // db_company is a custom triggered event.
  $(document).one('db_company', function (e, db_company) {
    var enabledCountries = Drupal.settings.tableau_demandbase_integration.enabledCountries,
        isEnabledCountry;

    if (typeof db_company !== 'object') {
      return;
    }

    // Developer overrides.
    Tabia.util.cookieOverride(db_company, 'db_override');

    Tabia.debug('db_company object received', {
      type: 'demandbase', data: {db_company: db_company}
    });

    if (!db_company.isp) {
      window.db_source = 'ip';
      // Determine and apply values to the reg form.
      tabDemandbase.useData(db_company, {userFacing: true, geoOnly: false});
    }
    else {
      window.db_source = 'ip_isp';
      // Apply just geo data for ISP-based reg values.
      tabDemandbase.useData(db_company, {userFacing: true, geoOnly: true});
    }

    // Determine if we should enable or disable further Demandbase behaviors.
    isEnabledCountry = $.inArray(db_company.country || db_company.registry_country_code, enabledCountries) !== -1;
    tabDemandbase.setEnabled(isEnabledCountry);
  });
});
;
(function ($, win) {

Drupal.behaviors.hideSubmitBlockit = {
  attach: function(context) {
    var timeoutId = null;
    $('form', context).once('hideSubmitButton', function () {
      var $form = $(this);

      // Bind to input elements.
      $('input.form-submit', $form).click(function (e) {
        var el = $(this);
        el.after('<input type="hidden" name="' + el.attr('name') + '" value="' + el.attr('value') + '" />');
        return true;
      });

      // Bind to form submit.
      $form.submit(function (e) {
        var settings = Drupal.settings.hide_submit;
        var $inp;
        if (!e.isPropagationStopped()) {
          if (settings.hide_submit_method == 'disable') {
            $('input.form-submit', $form).attr('disabled', 'disabled').each(function (i) {
              var $button = $(this);
              if (settings.hide_submit_css) {
                $button.addClass(settings.hide_submit_css);
              }
              if (settings.hide_submit_abtext) {
                $button.val($button.val() + ' ' + settings.hide_submit_abtext);
              }
              $inp = $button;
            });

            if ($inp && settings.hide_submit_atext) {
              $inp.after('<span class="hide-submit-text">' + Drupal.checkPlain(settings.hide_submit_atext) + '</span>');
            }
          }
          else {
            var pdiv = '<div class="hide-submit-text' + (settings.hide_submit_hide_css ? ' ' + Drupal.checkPlain(settings.hide_submit_hide_css) + '"' : '') + '>' + Drupal.checkPlain(settings.hide_submit_hide_text) + '</div>';
            if (settings.hide_submit_hide_fx) {
              $('input.form-submit', $form).addClass(settings.hide_submit_css).fadeOut(100).eq(0).after(pdiv);
              $('input.form-submit', $form).next().fadeIn(100);
            }
            else {
              $('input.form-submit', $form).addClass(settings.hide_submit_css).hide().eq(0).after(pdiv);
            }
          }
          // Add a timeout to rerset the buttons (if needed).
          if (settings.hide_submit_reset_time) {
            timeoutId = window.setTimeout(function() {
              hideSubmitResetButtons(null, $form);
            }, settings.hide_submit_reset_time);
          }
        }
        return true;
      });
    });

    // Bind to clientsideValidationFormHasErrors to support clientside validation.
    $(document).bind('clientsideValidationFormHasErrors', function(event, form) {
      //hideSubmitResetButtons(event, form.form);
    });

    // Reset all buttons.
    function hideSubmitResetButtons(event, form) {
      // Clear timer.
      window.clearTimeout(timeoutId);
      timeoutId = null;

      var settings = Drupal.settings.hide_submit;
      if (settings.hide_submit_method == 'disable') {
        $('input.' + Drupal.checkPlain(settings.hide_submit_css), form)
          .removeClass(Drupal.checkPlain(settings.hide_submit_hide_css))
          .removeAttr('disabled');
        $('.hide-submit-text', form).remove();
      }
      else {
        $('input.' + Drupal.checkPlain(settings.hide_submit_css), form)
          .stop()
          .removeClass(Drupal.checkPlain(settings.hide_submit_hide_css))
          .show();
        $('.hide-submit-text', form).remove();
      }
    }
  }
};

})(jQuery, window);

;
