infer = {};
infer.getCookie = function(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}
infer.setCookie = function(cname, cvalue, exdays) { 
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    var path = "path=/";
    var host = location.host.split(".");
    while (host.length > 1) {
      var domain = "domain=." + host.join(".");
      document.cookie = cname + "=" + cvalue + "; " + expires + ";" + path + ";" + domain;
      host.shift();
    }
}
infer.hex32 = function() {
  function hex4() {
    return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
  }
  return hex4() + hex4() + hex4() + hex4() + hex4() + hex4() + hex4() + hex4();
}
infer.podid = infer.getCookie('podid');
if (infer.podid == '') {
  infer.podid = infer.hex32();
}
infer.setCookie('podid', infer.podid, 365);
infer.init = function(dimension_id) {
  var d = parseInt(dimension_id);
  if (d < 1 || d > 20) {
    console.error('infer.init takes an integer between 1 and 20 inclusive');
    return;
  }
  ga('set', 'dimension' + d.toString(), infer.podid);
  ga('send', 'event', 'Infer', 'Set custom dimension', {'nonInteraction': 1});
}
