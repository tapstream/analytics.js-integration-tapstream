var integration = require('analytics.js-integration');

var TapstreamIntegration = module.exports = integration('Tapstream')
  .global('tapstream')
  .option('accountName', null)
  .option('pageUrl', null)
  .option('customParameters', {})
  .option('storeLinkRewriting', true)
  .readyOnInitialize()
  .tag('<script src="https://cdn.tapstream.com/static/js/tapstream.js"></script>');

/**
 * Tapstream uses an internal command queue called `_tsq`.
 *
 * When the js is loaded, it replaces said queue with an object that
 * executes commands when `.push` is called, and executes the queued
 * commands.
 *
 * @api public
 */

TapstreamIntegration.prototype.initialize = function() {
  window._tsq = window._tsq || [];
  window._tsq.push(['setAccountName', this.options.accountName]);

  for (var k in this.options.customParameters) {
    if (this.options.customParameters.hasOwnProperty(k)) {
      window._tsq.push(['addCustomParameter', k, this.options.customParameters[k]]);
    }
  }

  if (this.options.pageUrl) {
    window._tsq.push(['setPageUrl', this.options.pageUrl]);
  }

  if (!this.options.storeLinkRewriting) {
    window._tsq.push(['setStoreLinkRewriting', false]);
  }

  this.load(this.ready);
};

/*
 * Tapstream is loaded when _tsq is replaced with the CommandBuffer object,
 * which has an executeItem method
 */
TapstreamIntegration.prototype.loaded = function() {
  return !!(window._tsq || []).executeItem;
};

TapstreamIntegration.prototype.page = function() {
  window._tsq.push(['fireHit', '']);
};

TapstreamIntegration.prototype.track = function(it) {
  window._tsq.push(['fireHit', it.event()]);
};
