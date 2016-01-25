var ost_useSegment = false;
var ost_initialized = false;
var ost_trackRequestQueue = [];

// Performs the initialization and processes the queue, it is be called after declaring the used library in the AddScript wb
function intializeTracking(){
    ost_initialized = true;
    
    for(var i in ost_trackRequestQueue){
      ost_trackRequestQueue[i].f(ost_trackRequestQueue[i].params[0], ost_trackRequestQueue[i].params[1], ost_trackRequestQueue[i].params[2], ost_trackRequestQueue[i].params[3]);
    }
    
    ost_trackRequestQueue = [];
}

// Helper function to format properties for KissMetrics, adding the user identifier as one of the properties
function getKMProperties(props, impersonate) {
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
function registerEventTracker(selector, eventName, properties, impersonate){
    try{
        if ($(selector).length) {
            $(selector).on('click', function(){
                                trackEvent(eventName, properties, impersonate);
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
function trackEvent(eventName, properties, impersonate){
    try{
        if (ost_initialized) {
            trackEventInternal(eventName, properties, impersonate);
        }
        else {
            ost_trackRequestQueue.push({f:trackEventInternal, params:[eventName, properties, impersonate]});
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("TrackEvent Error: " + e);
        } 
    }
}

// Internal function to track events performed by a user, with a generic set of properties
function trackEventInternal(eventName, properties, impersonate){
    try{

        if (typeof console != "undefined") {
            console.log("TrackEvent: " + eventName + " # " + properties + " # " + impersonate);
        } 

        if (!(!impersonate)) {
            if(ost_useSegment){
                analytics.identify(impersonate);
            }
            else{
                properties = getKMProperties(properties, impersonate)
            }
        }

        if(properties != null){
            if(ost_useSegment){
                analytics.track(eventName, properties);
            }
            else{
                _kmq.push(['record', eventName, properties]);
            }
        }
        else{
            if(ost_useSegment){
                analytics.track(eventName);
            }
            else {
                _kmq.push(['record', eventName]);
            }
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("TrackEvent Error: " + e);
        } 
    }
}

// Deprecated
function signupUser(userName, name, userEmail, osId){
    try{
        if (typeof console != "undefined") {
            console.log("SignupUser: " + userName);
        } 
        
        identifyUser(userName, name, userEmail, osId);

    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("SignupUser Error: " + e);
        } 
    }
}


// Function to identify a user, with the optional name, email and osId traits. Supports queueing
function identifyUser(userName, name, email, osId){
    try{
        if (ost_initialized) {
            identifyUserInternal(userName, name, email, osId);
        }
        else {
            ost_trackRequestQueue.push({f:identifyUserInternal, params:[userName, name, email, osId]});
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("IdentifyUser Error: " + e);
        } 
    }
}


// Function to identify a user, with the optional name, email and osId traits
function identifyUserInternal(userName, name, email, osId){
    try{
        if (typeof console != "undefined") {
            console.log("IdentifyUser: " + userName);
        } 
        
        if(ost_useSegment){
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



// Function to add the currently identified or anonymous User, to a Group with a generic set of Properties. Supports queueing
function addToGroup(group, properties){
    try{
        if (ost_initialized) {
            addToGroupInternal(group, properties);
        }
        else {
            ost_trackRequestQueue.push({f:addUserToGroupInternal, params:[group, properties]});
        }
    }
    catch(e){
        if (typeof console != "undefined") {
            console.error("addToGroup Error: " + e);
        } 
    }
}

// Internal function to add the currently identified or anonymous User, to a Group with a generic set of Properties
function addToGroupInternal(group, properties){
    try{

        if (typeof console != "undefined") {
            console.log("addToGroup: " + group + " # " + properties + " # ");
        } 

        if(properties != null){
            if(ost_useSegment){
                analytics.group(group, properties);
            }
            else{
                // Mimic Segment's behavior
                _kmq.push(['set', getKMGroupProperties(properties, group)]);
            }
        }
        else{
            if(ost_useSegment){
                analytics.group(group);
            }
            else {
                // Mimic Segment's behavior
                _kmq.push(['set', getKMGroupProperties(properties, group)]);
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
function getKMGroupProperties(props, group) {
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

        if(ost_useSegment){
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