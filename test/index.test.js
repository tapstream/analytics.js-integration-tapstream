var Analytics = require('analytics.js-core').constructor;
var clearEnv = require('clear-env');
var tester = require('analytics.js-integration-tester');
var TapstreamIntegration = require('../lib/');

var ACCOUNT_NAME = 'sdktest';

describe('Tapstream', function() {
  var analytics;
  var tapstream;
  var options = {
    accountName: ACCOUNT_NAME
  };

  beforeEach(function() {
    analytics = new Analytics();
    tapstream = new TapstreamIntegration(options);
    analytics.use(TapstreamIntegration);
    analytics.use(tester);
    analytics.add(tapstream);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    tapstream.reset();
    clearEnv();
    window._tsq = null;
  });

  it('should create _tsq', function() {
    analytics.assert(!window._tsq);
    analytics.initialize();
    analytics.page();
    analytics.assert(window._tsq);
  });

  describe('Initialization', function() {
    beforeEach(function() {
      window._tsq = [];
      analytics.stub(window._tsq, 'push');
    });

    it('should initialize the account name', function(ready) {
      analytics.once('ready', ready);
      analytics.initialize();

      analytics.calledOnce(window._tsq.push);
      analytics.called(window._tsq.push, ['setAccountName', ACCOUNT_NAME]);
    });

    it('should initialize the page url if provided', function(ready) {
      var pageUrl = 'http://example.com/page/url';
      tapstream.options.pageUrl = pageUrl;

      analytics.once('ready', ready);
      analytics.initialize();

      analytics.calledTwice(window._tsq.push);
      analytics.called(window._tsq.push, ['setAccountName', ACCOUNT_NAME]);
      analytics.called(window._tsq.push, ['setPageUrl', pageUrl]);
    });

    it('should disable store link rewriting if requested', function(ready) {
      tapstream.options.storeLinkRewriting = false;

      analytics.once('ready', ready);
      analytics.initialize();

      analytics.calledTwice(window._tsq.push);
      analytics.called(window._tsq.push, ['setAccountName', ACCOUNT_NAME]);
      analytics.called(window._tsq.push, ['setStoreLinkRewriting', false]);
    });

    it('should allow multiple custom parameters', function(ready) {
      tapstream.options.customParameters = {
        myPar1: 'myPar1Value',
        myPar2: 'myPar2Value'
      };

      analytics.once('ready', ready);
      analytics.initialize();

      analytics.assert(window._tsq.push.args.length === 3);
      analytics.called(window._tsq.push, ['setAccountName', ACCOUNT_NAME]);
      analytics.called(window._tsq.push, ['addCustomParameter', 'myPar1', 'myPar1Value']);
      analytics.called(window._tsq.push, ['addCustomParameter', 'myPar2', 'myPar2Value']);
    });
  });

  describe('Loading', function() {
    it('should load', function(done) {
      analytics.load(tapstream, done);
    });
  });

  describe('Usage', function() {
    beforeEach(function(done) {
      analytics.once('ready', function() {
        analytics.stub(window._tsq, 'push');
        done();
      });
      analytics.initialize();
    });

    it('should fire pageviews', function() {
      analytics.page();
      analytics.called(window._tsq.push, ['fireHit', '']);
    });

    it('should track hits', function() {
      analytics.track('hello');
      analytics.called(window._tsq.push, ['fireHit', 'hello']);
    });
  });

  describe('Usage (post-load)', function() {
    beforeEach(function(done) {
      analytics.initialize();
      analytics.assert(!window._tsq.executeItem);
      analytics.load(tapstream, function() {
        analytics.stub(window._tsq, 'push');
        done();
      });
    });

    it('should replace window._tsq with a CommandBuffer', function() {
      analytics.assert(!!window._tsq.executeItem);
    });
  });
});
