// OutSystems Tracking  Object, encapsulating third-party tools
var osAnalytics = (function ($) {

    var myOsAnalytics = {},
        _useSegment = false,
        _useIntercom = false,
        _identifyInIntercom = false,
        _initialized = false,
        _loaded = false,
        _requestQueue = [];


    // Performs the initialization and processes the queue, it is be called after declaring the used library in the AddScript wb
    myOsAnalytics.setOptions = function(options){
        _useSegment = options.useSegment,
        _useIntercom = options.useIntercom,
        _identifyInIntercom = options.identifyInIntercom;
    }

    // Performs the initialization and processes the queue, it is be called after declaring the used library in the AddScript wb
    myOsAnalytics.initializeTracking = function(){
        _initialized = true;
        
        for(var i in _requestQueue){
          _requestQueue[i].f(_requestQueue[i].params[0], _requestQueue[i].params[1], _requestQueue[i].params[2], _requestQueue[i].params[3]);
      }

      _requestQueue = [];
    }


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
    myOsAnalytics.trackEvent = function(eventName, properties, impersonate){
        try{
            if (_initialized) {
                _trackEventInternal(eventName, properties, impersonate);
            }
            else {
                _requestQueue.push({f:_trackEventInternal, params:[eventName, properties, impersonate]});
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("TrackEvent Error: " + e);
            } 
        }
    }

     // Function to identify a user, with the optional name, email and osId traits. Supports queueing
    myOsAnalytics.identifyUser = function(userName, name, email, osId){
        try{
            if (_initialized) {
                _identifyUserInternal(userName, name, email, osId);
            }
            else {
                _requestQueue.push({f:_identifyUserInternal, params:[userName, name, email, osId]});
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("IdentifyUser Error: " + e);
            } 
        }
    }

    // Function to combine two previously unassociated user identities. New newUserId is aliased to a previously known (previousUserId) user
    myOsAnalytics.aliasUser = function(newUserId, previousUserId){
        try{
            if (_initialized){
                _aliasUserInternal(newUserId, previousUserId);
            }
            else{
                _requestQueue.push({f:_aliasUserInternal, params:[newUserId, previousUserId]});
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("AliasUser Error: " + e);
            } 
        }
    }

    // Function to add the currently identified or anonymous User, to a Group with a generic set of Properties. Supports queueing
    myOsAnalytics.addToGroup = function(group, properties){
        try{
            if (_initialized) {
                addToGroupInternal(group, properties);
            }
            else {
                _requestQueue.push({f:_addUserToGroupInternal, params:[group, properties]});
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("addToGroup Error: " + e);
            } 
        }
    }

    // Allows execution of callbacks to be triggered when the tracking script completes loading
    myOsAnalytics.ready = function(callback){
        try{
            if (_loaded) {
                callback;
            }
            else {
                if(_useSegment){
                    analytics.ready(callback);
                }
                else {
                    _kmq.push(callback);
                }
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("ready Error: " + e);
            } 
        }
    }



    // Decorates the given url with the utm tags present in the current window url, supports optionally setting the utm tags in urchkin/google analytics classic utmz format
    myOsAnalytics.decorateURL = function(url, includeUtmz=true) {
    /**
     * Based on https://gist.github.com/primozcigler/32082baf12753b3d36ed
    */
        // from: https://support.google.com/analytics/answer/1033867?hl=en
        var utmParams = [ {key:'utm_source', utmz:'utmcsr'}, {key:'utm_medium', utmz:'utmcmd'}, {key:'utm_term', utmz:null}, {key:'utm_content', utmz:null}, {key:'utm_campaign', utmz:'utmccn'} ];
        
        var urlAppend = [];
        var urlAppendUtmz = [];

        for (i = 0; i < utmParams.length; i++) {
            var utmParamVal = _getURLParameterByName( utmParams[i].key );
            if ( utmParamVal ) {
                urlAppend.push( utmParams[i].key + '=' + utmParamVal );
                if (includeUtmz && utmParams[i].utmz) {
                    urlAppendUtmz.push( utmParams[i].utmz + '=' + utmParamVal );
                }
            }
        }
        
        if (urlAppend.length > 0) {
            urlAppend = urlAppend.join( '&' );
            if (includeUtmz) {
                urlAppendUtmz = urlAppendUtmz.join( '|' );    
            }
            
            var a = document.createElement('a');
            a.href = url;

            var prepend = a.search.length > 0 ? '&' : '?';
            
            url = url + prepend + urlAppend;
            if (includeUtmz) {
                url = url + '&__utmz=.' + urlAppendUtmz;
            }
        }
        return url;
    }
    
//****************** Internal Functions ******************/

   // Internal function to track events performed by a user, with a generic set of properties
   var _trackEventInternal = function(eventName, properties, impersonate){
        try{

            if (typeof console != "undefined") {
                console.log("TrackEvent: " + eventName + " # " + properties + " # " + impersonate);
            } 

            if (!(!impersonate)) {
                if(_useSegment){
                    analytics.identify(impersonate);
                }
                else{
                    properties = _getKMProperties(properties, impersonate)
                }
            }

            if(properties != null){
                if(_useSegment){
                    analytics.track(eventName, properties);
                }
                else{
                    _kmq.push(['record', eventName, properties]);
                }

                if(_useIntercom){
                    Intercom('trackEvent', eventName, properties);
                }
            }
            else{
                if(_useSegment){
                    analytics.track(eventName);
                }
                else {
                    _kmq.push(['record', eventName]);
                }

                if(_useIntercom){
                    Intercom('trackEvent', eventName);
                }
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("TrackEvent Error: " + e);
            } 
        }
    }

    // Function to identify a user, with the optional name, email and osId traits
    var _identifyUserInternal = function(userName, name, email, osId){
        try{
            if (typeof console != "undefined") {
                console.log("IdentifyUser: " + userName);
            } 
            
            if(_useSegment){
                //we only want to identify newcomers in Intercom due to pricing
                if(_identifyInIntercom){
                    if (!(!userName)) {
                        if (!(!name)) {
                            if (!(!email)) {
                                if (!(!osId)) {
                                    analytics.identify(userName, {name: name, email: email, osId: osId});
                                }
                                else {
                                    analytics.identify(userName, {name: name, email: email});
                                }
                            }
                            else {
                                if (!(!osId)) {
                                    analytics.identify(userName, {name: name, osId: osId});
                                }
                                else {
                                    analytics.identify(userName, {name: name});
                                }
                            }
                        }
                        else {
                            if (!(!email)) {
                                if (!(!osId)) {
                                    analytics.identify(userName, {email: email, osId: osId});
                                }
                                else {
                                    analytics.identify(userName, {email: email});
                                }
                            }
                            else {
                                if (!(!osId)) {
                                    analytics.identify(userName, {osId: osId});
                                }
                                else {
                                    analytics.identify(userName);
                                }
                            }
                        }
                    }
                }else{
                    var integrations = {'Intercom': false};
                    if (!(!userName)) {
                        if (!(!name)) {
                            if (!(!email)) {
                                if (!(!osId)) {
                                    analytics.identify(userName, {name: name, email: email, osId: osId}, {integrations: integrations});
                                }
                                else {
                                    analytics.identify(userName, {name: name, email: email}, {integrations: integrations});
                                }
                            }
                            else {
                                if (!(!osId)) {
                                    analytics.identify(userName, {name: name, osId: osId}, {integrations: integrations});
                                }
                                else {
                                    analytics.identify(userName, {name: name}, {integrations: integrations});
                                }
                            }
                        }
                        else {
                            if (!(!email)) {
                                if (!(!osId)) {
                                    analytics.identify(userName, {email: email, osId: osId}, {integrations: integrations});
                                }
                                else {
                                    analytics.identify(userName, {email: email}, {integrations: integrations});
                                }
                            }
                            else {
                                if (!(!osId)) {
                                    analytics.identify(userName, {osId: osId}, {integrations: integrations});
                                }
                                else {
                                    analytics.identify(userName, {integrations: integrations});
                                }
                            }
                        }
                    }   
                }
            }
            else{
                _kmq.push(['identify', userName]);
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("IdentifyUser Error: " + e);
            } 
        }
    }
    
    // Internal function to combine two previously unassociated user identities. New newUserId is aliased to a previously known (previousUserId) user
    var _aliasUserInternal = function(newUserId, previousUserId){
        try{
            if (typeof console != "undefined") {
                console.log("AliasUser: " + newUserId);
            }

            if (_useSegment){
                if(newUserId != previousUserId){
                    if (!(!newUserId)){
                        if (!(!previousUserId)){
                            analytics.alias(newUserId, previousUserId);
                        }
                        else{
                            analytics.alias(newUserId);
                        }
                    }
                }
            }
            else{
                if (!(!newUserId)){
                    if (!(!previousUserId)){
                        _kmq.push(['alias', newUserId, previousUserId]);
                    }
                }
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("AliasUser Error: " + e);
            } 
        }
    }

    // Internal function to add the currently identified or anonymous User, to a Group with a generic set of Properties
    var _addToGroupInternal = function(group, properties){
        try{

            if (typeof console != "undefined") {
                console.log("addToGroup: " + group + " # " + properties + " # ");
            } 

            if(properties != null){
                if(_useSegment){
                    analytics.group(group, properties);
                }
                else{
                    // Mimic Segment's behavior
                    _kmq.push(['set', _getKMGroupProperties(properties, group)]);
                }
            }
            else{
                if(_useSegment){
                    analytics.group(group);
                }
                else {
                    // Mimic Segment's behavior
                    _kmq.push(['set', _getKMGroupProperties(properties, group)]);
                }
            }
        }
        catch(e){
            if (typeof console != "undefined") {
                console.error("addToGroup Error: " + e);
            } 
        }
    }

//****************** Helper Functions ******************/

    // Helper function to format properties for KissMetrics, adding the user identifier as one of the properties
    var _getKMProperties = function(props, impersonate) {
        var copy = {};
        for(var x in props) {
            if (props.hasOwnProperty(x)) {
                copy[x] = props[x];
            }
        };
        if(impersonate != null && impersonate != ""){
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


    return myOsAnalytics;
}(jQuery));