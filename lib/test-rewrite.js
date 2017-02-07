'use strict';

var url = require('url');

module.exports = function testRewrite(options) {
  options = options || {};
  var logger = options.debug ? console.log : function() {};
  return function(req, res, next) {
    var headers = req.headers;
    if (req.method !== 'GET') {
      return next();
    } else if (!headers || typeof headers.accept !== 'string') {
      return next();
    } else if (headers.accept.indexOf('application/json') === 0) {
      return next();
    } else if (!acceptsHtml(headers.accept, options)) {
      return next();
    }

    var parsedUrl = url.parse(req.url);
    var rewriteTarget;
    options.rewrites = options.rewrites || [];
    for (var i = 0; i < options.rewrites.length; i++) {
      var rewrite = options.rewrites[i];
      var match = parsedUrl.pathname.match(rewrite.from);
      if (match !== null) {
        rewriteTarget = rewriteRule(parsedUrl, match, rewrite.to);
        logger('Rewriting', req.method, req.url, 'to', rewriteTarget);
        req.url = rewriteTarget;
        return next();
      }
    }

    if (parsedUrl.pathname.indexOf('.') !== -1 && options.disableDotRule !== true) {
      return next();
    }

    rewriteTarget = options.index;
    if (!!rewriteTarget) {
      logger('Rewriting', req.method, req.url, 'to', rewriteTarget);
      req.url = rewriteTarget;
    }
    next();
  }
}

function rewriteRule(parsedUrl, match, rule) {
  if (typeof rule === 'string') {
    return rule;
  } else if (typeof rule === 'function'){
    return rule({
      parsedUrl: parsedUrl,
      match: match
    })
  } else {
    throw new Error('Rewrite rule can only be of type string of function.')
  }
}

function acceptsHtml(header, options) {
  options.htmlAcceptHeaders = options.htmlAcceptHeaders || ['text/html', '*/*'];
  for (var i = 0; i < options.htmlAcceptHeaders.length; i++) {
    if (header.indexOf(options.htmlAcceptHeaders[i]) !== -1) {
      return true;
    }
  }
  return false;
}
