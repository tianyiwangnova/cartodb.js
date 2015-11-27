/**
 * @namespace core
 */

var _ = require('underscore');
var Backbone = require('backbone');
var Profiler = require('cdb.core.Profiler');
var templates = require('cdb.templates');

/**
 * Allowed options for {@link core.View} constructor.
 * @typedef {Object} core.ViewOptions
 * @property {String} template     **TODO Document**
 */

/**
 * @classdesc Base View for all CartoDB views.
 * DO NOT USE `Backbone.View` directly !!!
 *
 * @class core.View
 * @name core.View
 * @extends Backbone.View
 *
 * @param {core.ViewOptions} options Options
 */
var View = Backbone.View.extend(/** @lends core.View.prototype */ {

  // TODO: Where this is used ?
  classLabel: 'cdb.core.View',

  /**
   * Backbone's constructor
   */
  constructor: function(options) {
    this.options = _.defaults(options, this.options);
    this._models = [];
    this._subviews = {};
    Backbone.View.call(this, options);
    View.viewCount++;
    View.views[this.cid] = this;
    this._created_at = new Date();
    Profiler.new_value('total_views', View.viewCount);
  },

  /**
   * Attach a model to this view.
   * @param  {Model} m Model reference
   */
  add_related_model: function(m) {
    if(!m) throw "added non valid model"
    this._models.push(m);
  },

  /**
   * Attach a subview to this view.
   * @param  {View} v View reference
   */
  addView: function(v) {
    this._subviews[v.cid] = v;
    v._parent = this;
  },

  /**
   * Removes the given view from the subviews lists.
   * @param  {View} v View reference
   */
  removeView: function(v) {
    delete this._subviews[v.cid];
  },

  /**
   * Remove all subviews.
   */
  clearSubViews: function() {
    _(this._subviews).each(function(v) {
      v.clean();
    });
    this._subviews = {};
  },

  /**
   * This methid clean removes the view and clean and events associated.
   * Call it when the view is not going to be used anymore.
   */
  clean: function() {
    var self = this;
    this.trigger('clean');
    this.clearSubViews();
    // remove from parent
    if(this._parent) {
      this._parent.removeView(this);
      this._parent = null;
    }
    this.remove();
    this.unbind();
    // remove this model binding
    if (this.model && this.model.unbind) this.model.unbind(null, null, this);
    // remove model binding
    _(this._models).each(function(m) {
      m.unbind(null, null, self);
    });
    this._models = [];
    View.viewCount--;
    delete View.views[this.cid];
    return this;
  },

  /**
   * utility methods
   */

  getTemplate: function(tmpl) {
    if(this.options.template) {
      return  _.template(this.options.template);
    }
    return templates.getTemplate(tmpl);
  },

  /**
   * Shows the view.
   */
  show: function() {
      this.$el.show();
  },

  /**
   * Hides the view.
   */
  hide: function() {
      this.$el.hide();
  },

  /**
  * Listen for an event on another object and triggers on itself, with the same name or a new one
  *
  * @param {String} ev event who triggers the action
  * @param {Object} obj object where the event happens
  * @param {Object} [retrigEvent] name of the retriggered event
  */
  retrigger: function(ev, obj, retrigEvent) {
    if(!retrigEvent) {
      retrigEvent = ev;
    }
    var self = this;
    obj.bind && obj.bind(ev, function() {
      self.trigger(retrigEvent);
    }, self)
    // add it as related model//object
    this.add_related_model(obj);
  },

  /**
  * Captures an event and prevents the default behaviour and stops it from bubbling
  *
  * @param event {Event}
  */
  killEvent: function(ev) {
    if(ev && ev.preventDefault) {
      ev.preventDefault();
    };
    if(ev && ev.stopPropagation) {
      ev.stopPropagation();
    };
  },

  /**
  * Removes all the tipsy tooltips from the document
  */
  cleanTooltips: function() {
    this.$('.tipsy').remove();
  }

}, /** @lends core.View */ {

  viewCount: 0,
  views: {},

  /**
   * when a view with events is inherit and you want to add more events
   * this helper can be used:
   * var MyView = new core.View({
   *  events: View.extendEvents({
   *      'click': 'fn'
   *  })
   * });
   */
  extendEvents: function(newEvents) {
    return function() {
      return _.extend(newEvents, this.constructor.__super__.events);
    };
  },

  /**
   * search for views in a view and check if they are added as subviews
   */
  runChecker: function() {
    _.each(View.views, function(view) {
      _.each(view, function(prop, k) {
        if( k !== '_parent' &&
            view.hasOwnProperty(k) &&
            prop instanceof View &&
            view._subviews[prop.cid] === undefined) {
          console.log("=========");
          console.log("untracked view: ");
          console.log(prop.el);
          console.log('parent');
          console.log(view.el);
          console.log(" ");
        }
      });
    });
  }
});

module.exports = View;
