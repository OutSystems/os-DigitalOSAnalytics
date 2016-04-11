// OutSystems Tracking  Object, encapsulating third-party tools
var osAnalytics = (function($) {

	var myOsAnalytics = {},
		_useSegment = false,
		_useIntercom = false,
		_identifyInIntercom = false,
		_decorateIframeURLWithGA = true,
		/*_trackInMarketo = false,*/
		_initialized = false,
		_loaded = false,
		_complete = false,
		_requestQueue = [],
		_readyCallbackQueue = [];


	// Performs the initialization and processes the queue, it is be called after declaring the used library in the AddScript wb
	myOsAnalytics.initialize = function(options) {
		_useSegment = options.useSegment,
		_useIntercom = options.useIntercom,
		_identifyInIntercom = options.identifyInIntercom/*,
		_trackInMarketo = options.trackInMarketo*/;

		if (typeof options.useGoogleAnalyticsDecorator !== 'undefined') {
			_decorateIframeURLWithGA = options.useGoogleAnalyticsDecorator;
		}
		
		if (_useSegment) {
			_loadSegment(options.key, _trackerReadyCallback);
		} else {
			if (_useIntercom) {
				_loadKM(options.key);
				_loadIntercom(options.key, _trackerReadyCallback);
			} else {
				_loadKM(options.intercomKey, _trackerReadyCallback);
			}
		}

		_initialized = true;
		_processQueue();
	}

	// Allows execution of callbacks to be triggered when the tracking script completes loading
	myOsAnalytics.ready = function(callback) {
		try {
			if (_initialized) { // we're always ready to go, since we aren't asynchronously loading the script (yet)
				callback();
			} else {
				_readyCallbackQueue.push(callback);
			}
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("ready Error: " + e);
			}
		}
	}

	//****************** BEGIN: Public Tracking Functions ******************/

	// Function that attaches the same trackEvent hook on all elements matching the supplied jQuery selector
	myOsAnalytics.registerEventTracker = function(selector, eventName, properties, impersonate) {
		$(document).ready(function() {
			try {
				if ($(selector).length) {
					$(selector).bind(
						'click',
						function() {
							myOsAnalytics.trackEvent(eventName, properties, impersonate);
						});
				}
			} catch (e) {
				if (typeof console != "undefined") {
					console.error("RegisterTrackEvent Error: " + e);
				}
			}
		});
	}

	// Function to track events performed by a user, with a generic set of properties. Supports queueing
	myOsAnalytics.trackEvent = function(eventName, properties, impersonate) {
		try {
			if (_initialized) {
				_trackEventInternal(eventName, properties, impersonate);
			} else {
				_requestQueue.push({
					f: _trackEventInternal,
					params: [eventName, properties, impersonate]
				});
			}
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("TrackEvent Error: " + e);
			}
		}
	}

	// Function to identify a user, with the optional name, email and osId traits. Supports queueing
	myOsAnalytics.identifyUser = function(userName, name, email, osId) {
		try {
			if (_initialized) {
				_identifyUserInternal(userName, name, email, osId);
			} else {
				_requestQueue.push({
					f: _identifyUserInternal,
					params: [userName, name, email, osId]
				});
			}
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("IdentifyUser Error: " + e);
			}
		}
	}

	// Function to combine two previously unassociated user identities. New newUserId is aliased to a previously known (previousUserId) user
	myOsAnalytics.aliasUser = function(newUserId, previousUserId) {
		try {
			if (_initialized) {
				_aliasUserInternal(newUserId, previousUserId);
			} else {
				_requestQueue.push({
					f: _aliasUserInternal,
					params: [newUserId, previousUserId]
				});
			}
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("AliasUser Error: " + e);
			}
		}
	}

	// Function to add the currently identified or anonymous User, to a Group with a generic set of Properties. Supports queueing
	myOsAnalytics.addToGroup = function(group, properties) {
		try {
			if (_initialized) {
				addToGroupInternal(group, properties);
			} else {
				_requestQueue.push({
					f: _addUserToGroupInternal,
					params: [group, properties]
				});
			}
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("addToGroup Error: " + e);
			}
		}
	}

	//****************** END: Public Tracking Functions ******************/

	//****************** BEGIN: Public Utility Functions ******************/

	// Decorates the given url with the utm tags present in the current window url, supports optionally setting the utm tags in urchkin/google analytics classic utmz format
	myOsAnalytics.decorateURL = function(url, includeUtmz = true) { /* In minified use "b.decorateURL=function(a,b=!0)" */
		/**
		 * Based on https://gist.github.com/primozcigler/32082baf12753b3d36ed
		 */
		// from: https://support.google.com/analytics/answer/1033867?hl=en
		var utmParams = [{key: 'utm_source',utmz: 'utmcsr'}, {key: 'utm_campaign',utmz: 'utmccn'}, {key: 'utm_medium',utmz: 'utmcmd'}, {key: 'utm_term',utmz: 'utmctr'}, {key: 'utm_content',utmz: 'utmcct'}];

		var urlAppend = [];
		var urlAppendUtmz = [];

		for (i = 0; i < utmParams.length; i++) {
			var utmParamVal = _getURLParameterByName(utmParams[i].key);
			if (utmParamVal) {
				urlAppend.push(utmParams[i].key + '=' + utmParamVal);
				if (includeUtmz && utmParams[i].utmz) {
					urlAppendUtmz.push(utmParams[i].utmz + '=' + utmParamVal);
				}
			}
		}

		if (includeUtmz && urlAppendUtmz.length > 0) {
			urlAppendUtmz = urlAppendUtmz.join('|');
			urlAppend.push('__utmz=.' + urlAppendUtmz);
		}

		return _appendParamsToURL(url, urlAppend)
	}

	myOsAnalytics.setIframeURL = function(iframeId, url) {
		// Get iframe
		var iframe = document.getElementById(iframeId);

		if(iframe != null) {
			try {
				if(_decorateIframeURLWithGA) {
					var _gaq = window._gaq = window._gaq || [];
					_gaq.push(function() {
							var pageTracker = _gat._getTrackerByName();
							iframe.src = pageTracker._getLinkerUrl(url);
						});
					}
					else {
						// Create fallback to set the source url of the iframe if the osAnalytics.ready doesn't trigger in 500ms
						var fallback = setTimeout(
							// Closure to allow passing the iframe reference to the function to be executed when the timeout elapses
							(function(iframe) {
								return function() {
									iframe.src = url;
								}
							})(iframe), 500);

						// Closure to allow passing the iframe and setTimeout references to the function that will ensure that the url decoration is executed
						(function(iframe, fallback) {
							return myOsAnalytics.ready(function() {
								try {
									iframe.src = myOsAnalytics.decorateURL(url);
									clearTimeout(fallback);
								} catch (e) {
									// if something fails, use simple url
									iframe.src = url;
								}
							})
						})(iframe, fallback);
					}
				} catch (e) {
					// if something fails, use simple url
					iframe.src = url;
				}
			}
			else {
				console.log('osAnalytics.setIframeURL: unable to find iframe with id [' + iframeId + ']');
			}
		}

	//****************** END: Public Utility Functions ******************/

	//****************** BEGIN: Internal Tracking Functions ******************/

	// Internal function to track events performed by a user, with a generic set of properties
	var _trackEventInternal = function(eventName, properties, impersonate) {
		try {

			if (typeof console != "undefined") {
				console.log("TrackEvent: " + eventName + " # " + properties + " # " + impersonate);
			}

			if (!(!impersonate)) {
				_identifyUserInternal(impersonate);
			}

			if (properties != null) {
				if (_useSegment) {
					analytics.track(eventName, properties);
				} else {
					_kmq.push(['record', eventName, properties]);
				}

				if (_useIntercom) {
					Intercom('trackEvent', eventName, properties);
				}
			} else {
				if (_useSegment) {
					analytics.track(eventName);
				} else {
					_kmq.push(['record', eventName]);
				}

				if (_useIntercom) {
					Intercom('trackEvent', eventName);
				}
			}

			// Send to Marketo
			/*
			if (_trackInMarketo) {
				if (window.Munchkin != null) {
					Munchkin.munchkinFunction('visitWebPage', {
						url: _createEventBaseUrl(eventName), params: _convertPropertiesToURLParameters(properties)
					});
				} else {
					if (typeof console !== "undefined" && console !== null) {
						console.log("Could not send data to marketo because Munchkin is not defined.");
					}
				}
			}*/
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("TrackEvent Error: " + e);
			}
		}
	}

	// Function to identify a user, with the optional name, email and osId traits
	var _identifyUserInternal = function(userName, name, email, osId) {
		try {
			if (typeof console != "undefined") {
				console.log("IdentifyUser: " + userName);
			}

			if (_useSegment) {
				//we only want to identify newcomers in Intercom due to pricing
				if (!_identifyInIntercom) {
					var integrations = {
						'Intercom': false
					};
				}

				if (!(!userName)) {
					if (!(!name)) {
						if (!(!email)) {
							if (!(!osId)) {
								analytics.identify(userName, {
									name: name,
									email: email,
									osId: osId
								}, {
									integrations: integrations
								});
							} else {
								analytics.identify(userName, {
									name: name,
									email: email
								}, {
									integrations: integrations
								});
							}
						} else {
							if (!(!osId)) {
								analytics.identify(userName, {
									name: name,
									osId: osId
								}, {
									integrations: integrations
								});
							} else {
								analytics.identify(userName, {
									name: name
								}, {
									integrations: integrations
								});
							}
						}
					} else {
						if (!(!email)) {
							if (!(!osId)) {
								analytics.identify(userName, {
									email: email,
									osId: osId
								}, {
									integrations: integrations
								});
							} else {
								analytics.identify(userName, {
									email: email
								}, {
									integrations: integrations
								});
							}
						} else {
							if (!(!osId)) {
								analytics.identify(userName, {
									osId: osId
								}, {
									integrations: integrations
								});
							} else {
								analytics.identify(userName, {
								}, {
									integrations: integrations
								});
							}
						}
					}
				}
			} else {
				_kmq.push(['identify', userName]);
			}
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("IdentifyUser Error: " + e);
			}
		}
	}

	// Internal function to combine two previously unassociated user identities. New newUserId is aliased to a previously known (previousUserId) user
	var _aliasUserInternal = function(newUserId, previousUserId) {
		try {
			if (typeof console != "undefined") {
				console.log("AliasUser: " + newUserId);
			}

			if (_useSegment) {
				if (newUserId != previousUserId) {
					if (!(!newUserId)) {
						if (!(!previousUserId)) {
							analytics.alias(newUserId, previousUserId);
						} else {
							analytics.alias(newUserId);
						}
					}
				}
			} else {
				if (!(!newUserId)) {
					if (!(!previousUserId)) {
						_kmq.push(['alias', newUserId, previousUserId]);
					}
				}
			}
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("AliasUser Error: " + e);
			}
		}
	}

	// Internal function to add the currently identified or anonymous User, to a Group with a generic set of Properties
	var _addToGroupInternal = function(group, properties) {
		try {

			if (typeof console != "undefined") {
				console.log("addToGroup: " + group + " # " + properties + " # ");
			}

			if (properties != null) {
				if (_useSegment) {
					analytics.group(group, properties);
				} else {
					// Mimic Segment's behavior
					_kmq.push(['set', _getKMGroupProperties(properties, group)]);
				}
			} else {
				if (_useSegment) {
					analytics.group(group);
				} else {
					// Mimic Segment's behavior
					_kmq.push(['set', _getKMGroupProperties(properties, group)]);
				}
			}
		} catch (e) {
			if (typeof console != "undefined") {
				console.error("addToGroup Error: " + e);
			}
		}
	}

	//****************** END: Internal Tracking Functions ******************/


	//****************** BEGIN: Helper Functions ******************/

	// Snippet for loading Segment
	var _loadSegment = function(key, callback) {
		var analytics = window.analytics = window.analytics || [];
		if (!analytics.initialize)
			if (analytics.invoked)
				window.console && console.error && console.error("Segment snippet included twice.");
			else {
				analytics.invoked = !0;
				analytics.methods = ["trackSubmit", "trackClick", "trackLink", "trackForm", "pageview", "identify", "reset", "group", "track", "ready", "alias", "page", "once", "off", "on"];
				analytics.factory = function(t) {
					return function() {
						var e = Array.prototype.slice.call(arguments);
						e.unshift(t);
						analytics.push(e);
						return analytics
					}
				};
				for (var t = 0; t < analytics.methods.length; t++) {
					var e = analytics.methods[t];
					analytics[e] = analytics.factory(e)
				}
				analytics.load = function(t) {
					var e = document.createElement("script");
					e.type = "text/javascript";
					e.async = !0;
					e.src = ("https:" === document.location.protocol ? "https://" : "http://") + "cdn.segment.com/analytics.js/v1/" + t + "/analytics.min.js";
					var n = document.getElementsByTagName("script")[0];
					n.parentNode.insertBefore(e, n)
				};
				analytics.SNIPPET_VERSION = "3.1.0";
				analytics.load(key);
				analytics.page();
				if (callback) {
					analytics.ready(callback);
				}
			}
	}


	// Snippet for loading KM
	var _loadKM = function(key, callback) {
		var _kmq = window._kmq = window._kmq || [];
		var _kmk = _kmk || key;

		function _kms(u) {
			setTimeout(function() {
				var d = document,
					f = d.getElementsByTagName('script')[0],
					s = d.createElement('script');
				s.type = 'text/javascript';
				s.async = true;
				s.src = u;
				f.parentNode.insertBefore(s, f);
			}, 1);
		}
		_kms('//i.kissmetrics.com/i.js');
		_kms('//doug1izaerwt3.cloudfront.net/' + _kmk + '.1.js');

		if (callback) {
			_kmq.push(callback);
		}
	}

	// Snippet for loading Intercom
	var _loadIntercom = function(key, callback) {
		var w = window;
		var ic = w.Intercom;
		if (typeof ic === "function") {
			ic('reattach_activator');
			ic('update', intercomSettings);
		} else {
			var d = document;
			var i = function() {
				i.c(arguments)
			};
			i.q = [];
			i.c = function(args) {
				i.q.push(args)
			};
			w.Intercom = i;

			function l() {
				var s = d.createElement('script');
				s.type = 'text/javascript';
				s.async = true;
				s.src = 'https://widget.intercom.io/widget/' + key;
				var x = d.getElementsByTagName('script')[0];
				x.parentNode.insertBefore(s, x);
			}
			if (w.attachEvent) {
				w.attachEvent('onload', l);
			} else {
				w.addEventListener('load', l, false);
			}
		}
		if (callback) {
			callback;
		}
	}

	// Helper function to format properties for KissMetrics, adding the user identifier as one of the properties
	var _getKMProperties = function(props, impersonate) {
		var copy = {};
		for (var x in props) {
			if (props.hasOwnProperty(x)) {
				copy[x] = props[x];
			}
		};
		if (impersonate != null && impersonate != "") {
			copy["_p"] = impersonate;
		}
		return copy;
	}

	/**
	 * Helper function for getting parameter by name
	 * @see  http://stackoverflow.com/a/901144
	 * @param  {string} name
	 * @return {string}
	 */
	var _getURLParameterByName = function(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	var _appendParamsToURL = function(url, params) {
		if (params.length > 0) {
			params = params.join('&');

			var a = document.createElement('a');
			a.href = url;

			var prepend = a.search.length > 0 ? '&' : '?';

			url = url + prepend + params;
		}
		return url;
	}

	var _convertPropertiesToURLParameters = function(properties, encode = false) /* encode=!1 */ {
		var parameters = [];
		for (var propertyName in properties) {
			if (encode) {
				parameters.push(encodeURI(propertyName) + '=' + encodeURI(properties[propertyName]));
			} else {
				parameters.push(propertyName + '=' + properties[propertyName]);
			}
		}

		return parameters.join('&');
	}

	var _createEventBaseUrl = function(eventName) {
		return 'http://segment.io/event/' + eventName.replace(/\s/g, '-');
	}

	var _trackerReadyCallback = function() {
		_complete = true;
	}

	// Performs the initialization and processes the queue, it is be called after declaring the used library in the AddScript wb
	var _processQueue = function() {
		_loaded = true;

		// Process Ready callbacks
		for (var i in _readyCallbackQueue) {
			_readyCallbackQueue[i]();
		}
		_readyCallbackQueue = [];

		// Process pending tracking requests
		for (var i in _requestQueue) {
			_requestQueue[i].f(_requestQueue[i].params[0], _requestQueue[i].params[1], _requestQueue[i].params[2], _requestQueue[i].params[3]);
		}
		_requestQueue = [];
	}

	//****************** END: Helper Functions ******************/

	return myOsAnalytics;
}(jQuery));

//------------------------------------------------------------------------------------
// Static function stubs, to support legacy code
//------------------------------------------------------------------------------------


// Function to track events performed by a user, with a generic set of properties. Supports queueing
function trackEvent(eventName, properties, impersonate) {
	osAnalytics.trackEvent(eventName, properties, impersonate);
}

// Function to identify a user, with the optional name, email and osId traits. Supports queueing
function identifyUser(userName, name, email, osId) {
	osAnalytics.identifyUser(userName, name, email, osId);
}