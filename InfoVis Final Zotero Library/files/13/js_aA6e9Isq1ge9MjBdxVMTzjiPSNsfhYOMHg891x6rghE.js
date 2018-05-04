/**
 * Global, client-side behaviors for the TabWow theme.
 */

/**
 * Triggers a custom components:reattach event which can be used within Components to
 * re-bind to dynamically added DOM elements, with the given context (Element).
 */
Drupal.behave('tableauComponents', {only: false}).ready(function ($) {
  if (this.context !== document) {
    $(document).trigger('components:reattach', [this.context]);
  }
});


/**
 * Language Dropdown Reminder
 */
Drupal.behave('langDropdownReminder', {only: false}).ready(function ($) {
  if(Drupal.settings && Drupal.settings.lang_dropdown_remind && Drupal.settings.lang_dropdown_remind.prependto) {
    $(Drupal.settings.lang_dropdown_remind.prependto).bind('lang_dropdown_remind_ready', function () {
      var $languageDropdown = $('.global-footer__language'),
          $reminderTrigger = $('#trigger-langdropdown');

      // Navigate to the language dropdown element on the page and highlight it.
      $reminderTrigger.click(function (e) {
        // Smooth scroll to target.
        $('html, body').animate({
          scrollTop: $(document).height()
        }, 1000).promise().done(function(){
          // Highlight the element.
          $languageDropdown.sonarPulse();
        });
      });
    });
  }
});

/**
 * Auto-play first video when hash is #video
 */
Drupal.behave('autoPlayVideos').ready(function ($) {
  var $video,
      player;

  // Fast exit if #video isn't the window hash, or videojs isn't available.
  if (window.location.hash !== '#video' || !window.videojs) {
    return;
  }

  // Select the videos that should be auto played. Exit if none found.
  $video = $('.video-js:not(.reveal__content .video-js):not([autoplay])').first();
  if (!$video.length) {
    return;
  }

  // Get a videojs player from the element.
  player = window.videojs($video[0]);

  // Scroll to and play the first video once it's ready.
  Components.utils.smoothScrollTop($video, 500, 50);
  player.ready(function () {
    // Wait for scroll to finish, then play.
    setTimeout(function () {
      player.play();
    }, 500);
  });
});

/**
 * Alter the global navigation area.
 */
Drupal.behave('globalMobileTrialSwap').ready(function ($) {
  // Skip the trial page on mobile, go to email reminder.
  if (Tabia.mobileCheck()) {
    $('a[href*="/trial"], a[href*="/products/trial"]')
      .attr('href', '/' + Drupal.settings.pathPrefix + 'products/desktop/download');
  }
});

/**
 * Open the customer menu when the sonar is activated.
 */
Drupal.behave('customerMenuDemo').ready(function ($) {
  var $dropdownNav = $('.global-nav .dropdown-nav'),
      $dropdownNavBody = $dropdownNav.find('.dropdown-nav__body.sonar-pulse'),
      getDropdownNav = $.Deferred();

  // Bail if things don't exist.
  if (!$dropdownNav.length || !$dropdownNavBody.length) {
    return;
  }

  // Listen for sonar activate/deactivate events.
  $dropdownNavBody
  .on('sonar:activate', function () {
    getDropdownNav.then(function (dropdownNav) {
      dropdownNav.open();
    });
  })
  .on('sonar:deactivate', function () {
    getDropdownNav.then(function (dropdownNav) {
      dropdownNav.close();
    });
  });

  // Resolve on custom initialized event.
  $dropdownNav.on('initialized', function () {
    getDropdownNav.resolve(this.DropdownNav);
  });

  // Resolve if DropdownNav object already exists.
  if ($dropdownNav[0].DropdownNav) {
    getDropdownNav.resolve($dropdownNav[0].DropdownNav);
  }
});

/**
 * Initialize thumbnail colors on views load more pager for Resource Library.
 */
Drupal.behave('tableauComponentsThumbnail').ready(function ($) {
  $('.view-resource-library, .view-stories').on('views_load_more.new_content', function () {
    Components.thumbnail.ready($);
  });
});

/**
 * Unveil the lazyload images a little smarter. (e.g. when tab trigger is hovered)
 */
Drupal.behave('lazyLoadUnveil').ready(function ($) {
  $('.tabs__tab-link').on('mouseenter', function (e) {
    var $element = $(e.target),
        $content = $('#' + $element.data('tabContent'));

    $content.find('.lazyload').addClass('lazypreload');
  });
});
;
Drupal.behave("tableauBrightcoveAutoCaptions").ready(function($){var settings=this.settings.tableauBrightcove||{},prefixMatch=window.location.pathname.slice(1).match(/^(de-de|es-es|fr-fr|ja-jp|ko-kr|pt-br|zh-cn|ru-ru|it-it|ar-eg|pl-pl|nl-nl)/i),lang=prefixMatch?prefixMatch[1]:null;settings.autoCaptions&&(Tabia.debug("Brightcove auto-captions",{type:"tableauBrightcove",data:settings.autoCaptions}),window.addEventListener&&window.addEventListener("message",function(event){"boolean"==typeof event.data.brightcovePlaying&&(Tabia.debug("Brightcove player sent playing message",{type:"tableauBrightcove",data:{tabLang:lang}}),event.source.postMessage({tabLang:lang},"*"))}))}),Drupal.behave("tableauBrightcoveErrors").ready(function($){window.videojs&&($.getScript("/sites/all/libraries/tabia/brightcove-i18n.js"),$(".video-js").each(function(){this.player&&this.player.on("error",function(){var bcError=this.error();Tabia.warning("Brightcove player error",{type:"brightcove",data:{code:bcError.code,brightcoveErrorMessage:bcError.message}})})}))});;
