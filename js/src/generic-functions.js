// OutSystems Tracking  Object, encapsulating third-party tools
var osAnalytics = window.osAnalytics = window.osAnalytics || [];
osAnalytics._useSegment = false;
osAnalytics._initialized = false;
osAnalytics._loaded = false;
osAnalytics._requestQueue = [];
osAnalytics._identifyInIntercom = false;

// Performs the initialization and processes the queue, it is be called after declaring the used library in the AddScript wb
osAnalytics.intializeTracking = function(){
    osAnalytics._initialized = true;
    
    for(var i in osAnalytics._requestQueue){
      osAnalytics._requestQueue[i].f(osAnalytics._requestQueue[i].params[0], osAnalytics._requestQueue[i].params[1], osAnalytics._requestQueue[i].params[2], osAnalytics._requestQueue[i].params[3]);
  }

  osAnalytics._requestQueue = [];
}

// Helper function to format properties for KissMetrics, adding the user identifier as one of the properties
osAnalytics.getKMProperties = function(props, impersonate) {
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

// Function that attaches the same trackEvent hook on all elements matching the supplied jQuery selector
osAnalytics.registerEventTracker = function(selector, eventName, properties, impersonate){
    try{
        if ($(selector).length) {
            $(selector).on(
                'click',
                function(){
                    osAnalytics.trackEvent(eventName, properties, impersonate);
                });
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("RegisterTrackEvent Error: " + e);
        } 
    }
}

// Function to track events performed by a user, with a generic set of properties. Supports queueing
osAnalytics.trackEvent = function(eventName, properties, impersonate){
    try{
        if (osAnalytics._initialized) {
            osAnalytics.trackEventInternal(eventName, properties, impersonate);
        }
        else {
            osAnalytics._requestQueue.push({f:osAnalytics.trackEventInternal, params:[eventName, properties, impersonate]});
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("TrackEvent Error: " + e);
        } 
    }
}

// Internal function to track events performed by a user, with a generic set of properties
osAnalytics.trackEventInternal = function(eventName, properties, impersonate){
    try{

        if (typeof console != "undefined") {
            console.log("TrackEvent: " + eventName + " # " + properties + " # " + impersonate);
        } 

        if (!(!impersonate)) {
            if(osAnalytics._useSegment){
                analytics.identify(impersonate);
            }
            else{
                properties = osAnalytics.getKMProperties(properties, impersonate)
            }
        }

        if(properties != null){
            if(osAnalytics._useSegment){
                analytics.track(eventName, properties);
            }
            else{
                _kmq.push(['record', eventName, properties]);
                Intercom('trackEvent', eventName, properties);
            }
        }
        else{
            if(osAnalytics._useSegment){
                analytics.track(eventName);
            }
            else {
                _kmq.push(['record', eventName]);
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


// Function to identify a user, with the optional name, email and osId traits. Supports queueing
osAnalytics.identifyUser = function(userName, name, email, osId){
    try{
        if (osAnalytics._initialized) {
            osAnalytics.identifyUserInternal(userName, name, email, osId);
        }
        else {
            osAnalytics._requestQueue.push({f:osAnalytics.identifyUserInternal, params:[userName, name, email, osId]});
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("IdentifyUser Error: " + e);
        } 
    }
}


// Function to identify a user, with the optional name, email and osId traits
osAnalytics.identifyUserInternal = function(userName, name, email, osId){
    try{
        if (typeof console != "undefined") {
            console.log("IdentifyUser: " + userName);
        } 
        
        if(osAnalytics._useSegment){
            //we only want to identify newcomers in Intercom due to pricing
            if(osAnalytics._identifyInIntercom){
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

// Function to combine two previously unassociated user identities. New newUserId is aliased to a previously known (previousUserId) user
osAnalytics.aliasUser = function(newUserId, previousUserId){
    try{
        if (osAnalytics._initialized){
            osAnalytics.aliasUserInternal(newUserId, previousUserId);
        }
        else{
            osAnalytics._requestQueue.push({f:osAnalytics.aliasUserInternal, params:[newUserId, previousUserId]});
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("AliasUser Error: " + e);
        } 
    }
}

// Internal function to combine two previously unassociated user identities. New newUserId is aliased to a previously known (previousUserId) user
osAnalytics.aliasUserInternal = function(newUserId, previousUserId){
    try{
        if (typeof console != "undefined") {
            console.log("AliasUser: " + newUserId);
        }

        if (osAnalytics._useSegment){
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

// Function to add the currently identified or anonymous User, to a Group with a generic set of Properties. Supports queueing
osAnalytics.addToGroup = function(group, properties){
    try{
        if (osAnalytics._initialized) {
            osAnalytics.addToGroupInternal(group, properties);
        }
        else {
            osAnalytics._requestQueue.push({f:osAnalytics.addUserToGroupInternal, params:[group, properties]});
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("addToGroup Error: " + e);
        } 
    }
}

// Internal function to add the currently identified or anonymous User, to a Group with a generic set of Properties
osAnalytics.addToGroupInternal = function(group, properties){
    try{

        if (typeof console != "undefined") {
            console.log("addToGroup: " + group + " # " + properties + " # ");
        } 

        if(properties != null){
            if(osAnalytics._useSegment){
                analytics.group(group, properties);
            }
            else{
                // Mimic Segment's behavior
                _kmq.push(['set', osAnalytics.getKMGroupProperties(properties, group)]);
            }
        }
        else{
            if(osAnalytics._useSegment){
                analytics.group(group);
            }
            else {
                // Mimic Segment's behavior
                _kmq.push(['set', osAnalytics.getKMGroupProperties(properties, group)]);
            }
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("addToGroup Error: " + e);
        } 
    }
}

// Helper function to format Group Properties for KissMetrics, adding the group identifier as a prefix of each property and capitalizing the first letter
osAnalytics.getKMGroupProperties = function(props, group) {
    var copy = {};
    for(var x in props) {
        if (props.hasOwnProperty(x)) {
            copy['Group - ' +  x.charAt(0).toUpperCase() + x.slice(1)] = props[x];
        }
    };
    if(group != null && group != ""){
        copy['Group - id'] = group;
    }
    return copy;
}

/*
function getLinkURLWithIdentity(url){
    try{
        if (typeof console != "undefined") {
            console.log("getLinkURLWithIdentity: " + url);
        } 

        var identity;

        if(osAnalytics._useSegment){
            identity = analytics.user().anonymousId();
        }
        else{
            identity = KM.i();
        }

        return insertParam(url, 'teId', identity)
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("getLinkURLWithIdentity Error: " + e);
        } 
    }
}

function insertParam(url, key, value)
{
    key = encodeURI(key); value = encodeURI(value);

    var url = url.substr(0).split('?');
    var params = [];
    if (url.length > 1) {
        params = url[1].split('&');

        var i=params.length; var x; while(i--) 
        {
            x = params[i].split('=');

            if (x[0]==key)
            {
                x[1] = value;
                params[i] = x.join('=');
                break;
            }
        }
    }

    params.push([key,value].join('='));

    //this will reload the page, it's likely better to store this until finished
    var queryString = params.join('&');
    url[1] = queryString;
    return url.join('?');
}
*/


// Allows execution of callbacks to be triggered when the tracking script completes loading
osAnalytics.ready = function(callback){
    try{
        if (osAnalytics._loaded) {
            callback;
        }
        else {
            if(osAnalytics._useSegment){
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


//------------------------------------------------------------------------------------
// Static function stubs, to support legacy code
//------------------------------------------------------------------------------------


// Function to track events performed by a user, with a generic set of properties. Supports queueing
function trackEvent(eventName, properties, impersonate){
    osAnalytics.trackEvent(eventName, properties, impersonate);
}

// Function to identify a user, with the optional name, email and osId traits. Supports queueing
function identifyUser(userName, name, email, osId){
    osAnalytics.identifyUser(userName, name, email, osId);
}