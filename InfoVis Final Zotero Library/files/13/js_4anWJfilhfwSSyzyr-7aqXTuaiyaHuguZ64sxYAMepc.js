/**
 * Recommendation front-end.
 */

/*jshint forin: false */

(function($, behavior) {

  /**
   * Adjust meta data sent from LiftIgniter.
   */
  behavior.transformBundle = function (data, key, done) {
    // See tableau_sitewide_tweaks_preprocess_page(), tableau_get_nice_type_names().
    var transforms = Drupal.settings.tableauSite.entityBundleNice;

    for (var i in data.items) {
      // Create a nice (translated) bundle name.
      // @todo The last condition can be removed later after indexing.
      if (data.items[i].bundle && (transforms.hasOwnProperty(data.items[i].bundle) || transforms.hasOwnProperty(data.items[i].bundle.replace(/_/g, ' ')))) {
        data.items[i].eyebrow = transforms[data.items[i].bundle];
      }

      // Set a default eyebrow and remove underscores.
      data.items[i].eyebrow = (data.items[i].eyebrow) ? data.items[i].eyebrow.replace(/_/g, ' ') : Drupal.t('page');
    }

    done();
  };

  /**
   * Append author and date information to the title.
   */
  behavior.transformDate = function (data, key, done) {
    var date;

    for (var i in data.items) {
      // Dates - ensure moment.js is loaded.
      if (typeof moment !== 'undefined') {
        // Publish date.
        if (data.items[i].published) {
          date = moment(data.items[i].published).locale(data.items[i].language);
          data.items[i].published = date.format('MMM, YYYY');
        }
      }
    }

    done();
  };

  /**
   * Provide icon when no thumbnail is provided.
   */
  behavior.loadThumbnailIcon = function (data, key, done) {
    var icons = {
      'event_ondemand_training': 'icon--online-classes',
      'webinar':                 'icon--webinar',
      'whitepaper':              'icon--whitepapers',
      'press_release':           'icon--press-release',
      'series':                  'icon--series',
      'default':                 'icon--standard-page'
    };

    for (var i in data.items) {
      // Use the cropped thumbnail when available.
      data.items[i].thumbnail = data.items[i].thumbnail_cropped || data.items[i].thumbnail;

      // Add an icon when no thumbnail is provided.
      if (!data.items[i].thumbnail) {
        data.items[i].thumbnail_modifier_class = 'thumbnail--color';
        data.items[i].icon = icons[data.items[i].bundle] || icons['default'];
      }
    }

    done();
  };

  /**
   * Add analysis params to links.
   */
  behavior.track = function (data, key, done) {
    var src;

    for (var i in data.items) {
      // Allow override source.
      src = data.items[i].src || 'liftigniter';
      data.items[i].url = data.items[i].url + '?__src=' + src + '&__widget=' + key;
    }

    done();
  };

  /**
   * Drupal main point of execution.
   *
   * @param context
   *  Drupal Context
   * @param settings
   *  Drupal settings.
   */
  behavior.attach = function (context, settings) {
    // Render thumbnail background colors.
    $(document).on('liftigniterWidgetRendered', function () {
      Components.thumbnail.ready($);
    });

    // Register transform functions (must happen during behavior attach).
    settings.liftIgniter = settings.liftIgniter || {transformCallbacks: []};
    settings.liftIgniter.transformCallbacks.unshift(
      behavior.transformBundle,
      behavior.transformDate,
      behavior.loadThumbnailIcon,
      behavior.track
    );
  };

})(jQuery, Drupal.behaviors.tabLiftIgniter = {});
;
