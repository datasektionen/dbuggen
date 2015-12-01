/*
 * For font license information, see the CSS file loaded by this JavaScript.
 */
if(!window.Typekit)window.Typekit={};window.Typekit.config={"a":"585171","c":[".tk-rooney-web","\"rooney-web\",sans-serif",".tk-futura-pt","\"futura-pt\",sans-serif"],"f":"//use.typekit.net/c/a505b5/1w;futura-pt,2,SH9:R:i4,SHB:R:n3,Y5K:R:n4,SH3:R:n5,SH5:R:n7;rooney-web,7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191,Q8d:R:i4,Q8j:R:i7,Q8Z:R:n3,Q8c:R:n4,Q8h:R:n7,Q8k:R:n8,Q8m:R:n9/{format}{/extras*}?3bb2a6e53c9684ffdc9a9bfe1d5b2a622b4c22dc410c939a8701751a4802e083d29e9344b41f77472fc4568d60b3aad4722f22a536e89af2abb65cd47a9af16e64a1150882f873b39310a237f0100ca18f2fd9fe8e61d74d49c9a3634474ac800a9c6ea845d1886ed2aa3884d1e245c37a4be575b0a0706fe199b99514656d4707743548d3762f1b175b01ba2f7f9d53b3122bd1404a9e7938bb748bcc4c8701940d7c4a931307c59bb6d3998a0185897fb2b46c2d7bb0bedc8087","fi":[7951,7952,7953,7954,7955,7959,7961,10879,10881,10884,10885,10886],"fn":["futura-pt",["i4","n3","n4","n5","n7"],"rooney-web",["i4","i7","n3","n4","n7","n8","n9"]],"ht":"tk","js":"1.12.0","k":"//use.typekit.net/{id}.js","kt":"gsq0orq","p":"//p.typekit.net/p.gif?s=1&k=gsq0orq&ht=tk&h={host}&f=7951.7952.7953.7954.7955.7959.7961.10879.10881.10884.10885.10886&a=585171&_={_}","ps":1,"w":"gsq0orq"};
/*{"k":"1.12.0","auto_updating":true}*/
;(function(window,document,undefined){
function aa(a,b,c){return a.call.apply(a.bind,arguments)}function ba(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function g(a,b,c){g=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?aa:ba;return g.apply(null,arguments)}var ca=Date.now||function(){return+new Date};
function da(a,b){this.na=a;this.W=b||a;this.H=this.W.document}da.prototype.createElement=function(a,b,c){a=this.H.createElement(a);if(b)for(var d in b)b.hasOwnProperty(d)&&("style"==d?a.style.cssText=b[d]:a.setAttribute(d,b[d]));c&&a.appendChild(this.H.createTextNode(c));return a};function ea(a,b,c){a=a.H.getElementsByTagName(b)[0];a||(a=document.documentElement);a&&a.lastChild&&a.insertBefore(c,a.lastChild)}function fa(a,b){function c(){a.H.body?b():setTimeout(c,0)}c()}
function l(a,b,c){b=b||[];c=c||[];for(var d=a.className.split(/\s+/),e=0;e<b.length;e+=1){for(var f=!1,h=0;h<d.length;h+=1)if(b[e]===d[h]){f=!0;break}f||d.push(b[e])}b=[];for(e=0;e<d.length;e+=1){f=!1;for(h=0;h<c.length;h+=1)if(d[e]===c[h]){f=!0;break}f||b.push(d[e])}a.className=b.join(" ").replace(/\s+/g," ").replace(/^\s+|\s+$/,"")}function ga(a,b){for(var c=a.className.split(/\s+/),d=0,e=c.length;d<e;d++)if(c[d]==b)return!0;return!1}
function ha(a){if("string"===typeof a.qa)return a.qa;var b=a.W.location.protocol;"about:"==b&&(b=a.na.location.protocol);return"https:"==b?"https:":"http:"}function ia(a,b){/^http(s)?:$/.test(b)&&(a.qa=b)}function ja(a){return a.W.location.hostname||a.na.location.hostname}function ka(a,b,c){b=a.createElement("link",{rel:"stylesheet",href:b});var d=!1;b.onload=function(){d||(d=!0,c&&c(null))};b.onerror=function(){d||(d=!0,c&&c(Error("Stylesheet failed to load")))};ea(a,"head",b)}
function la(a,b,c){var d=a.H.getElementsByTagName("head")[0];if(d){var e=a.createElement("script",{src:b}),f=!1;e.onload=e.onreadystatechange=function(){f||this.readyState&&"loaded"!=this.readyState&&"complete"!=this.readyState||(f=!0,c&&c(null),e.onload=e.onreadystatechange=null,"HEAD"==e.parentNode.tagName&&d.removeChild(e))};d.appendChild(e);window.setTimeout(function(){f||(f=!0,c&&c(Error("Script load timeout")))},5E3)}}function m(a){this.ua=a}
function n(a,b,c,d){this.l=null!=a?a:null;this.p=null!=b?b:null;this.O=null!=c?c:null;this.h=null!=d?d:null}var ma=/^([0-9]+)(?:[\._-]([0-9]+))?(?:[\._-]([0-9]+))?(?:[\._+-]?(.*))?$/;n.prototype.compare=function(a){return this.l>a.l||this.l===a.l&&this.p>a.p||this.l===a.l&&this.p===a.p&&this.O>a.O?1:this.l<a.l||this.l===a.l&&this.p<a.p||this.l===a.l&&this.p===a.p&&this.O<a.O?-1:0};function q(a,b){return-1===a.compare(b)}function s(a,b){return 0===a.compare(b)||1===a.compare(b)}
function u(a,b){return 0===a.compare(b)}n.prototype.toString=function(){return[this.l,this.p||"",this.O||"",this.h||""].join("")};function v(a){a=ma.exec(a);var b=null,c=null,d=null,e=null;a&&(null!==a[1]&&a[1]&&(b=parseInt(a[1],10)),null!==a[2]&&a[2]&&(c=parseInt(a[2],10)),null!==a[3]&&a[3]&&(d=parseInt(a[3],10)),null!==a[4]&&a[4]&&(e=/^[0-9]+$/.test(a[4])?parseInt(a[4],10):a[4]));return new n(b,c,d,e)}
function y(a,b,c,d,e,f,h,k){this.X=a;this.v=b;this.I=c;this.S=d;this.m=e;this.g=f;this.ba=h;this.A=k}y.prototype.getName=function(){return this.X};function na(a,b){this.b=a;this.R=b}var oa=new y("Unknown",new n,"Unknown",new n,"Unknown",new n,void 0,new m(!1));
na.prototype.parse=function(){var a;if(-1!=this.b.indexOf("MSIE")||-1!=this.b.indexOf("Trident/")){a=z(this);var b=v(A(this)),c=null,d=null,e=null,e=B(this.b,/Trident\/([\d\w\.]+)/,1),f=C(this.R),c=-1!=this.b.indexOf("MSIE")?v(B(this.b,/MSIE ([\d\w\.]+)/,1)):v(B(this.b,/rv:([\d\w\.]+)/,1));""!=e?(d="Trident",e=v(e)):(d="Unknown",e=new n);a=new y("MSIE",c,d,e,a,b,f,new m(!1))}else if(-1!=this.b.indexOf("Opera"))a:if(a="Unknown",b=v(B(this.b,/Presto\/([\d\w\.]+)/,1)),c=v(A(this)),d=C(this.R),null!==
b.l?a="Presto":(-1!=this.b.indexOf("Gecko")&&(a="Gecko"),b=v(B(this.b,/rv:([^\)]+)/,1))),-1!=this.b.indexOf("Opera Mini/"))f=v(B(this.b,/Opera Mini\/([\d\.]+)/,1)),a=new y("OperaMini",f,a,b,z(this),c,d,new m(!1));else{if(-1!=this.b.indexOf("Version/")&&(f=v(B(this.b,/Version\/([\d\.]+)/,1)),null!==f.l)){a=new y("Opera",f,a,b,z(this),c,d,new m(!1));break a}f=v(B(this.b,/Opera[\/ ]([\d\.]+)/,1));a=null!==f.l?new y("Opera",f,a,b,z(this),c,d,new m(!1)):new y("Opera",new n,a,b,z(this),c,d,new m(!1))}else/OPR\/[\d.]+/.test(this.b)?
a=pa(this):/AppleWeb(K|k)it/.test(this.b)?a=pa(this):-1!=this.b.indexOf("Gecko")?(a="Unknown",b=new n,c=v(A(this)),-1!=this.b.indexOf("Firefox")?(a="Firefox",b=v(B(this.b,/Firefox\/([\d\w\.]+)/,1))):-1!=this.b.indexOf("Mozilla")&&(a="Mozilla"),d=v(B(this.b,/rv:([^\)]+)/,1)),a=new y(a,b,"Gecko",d,z(this),c,C(this.R),new m(!1))):a=oa;return a};
function z(a){var b=B(a.b,/(iPod|iPad|iPhone|Android|Windows Phone|BB\d{2}|BlackBerry)/,1);if(""!=b)return/BB\d{2}/.test(b)&&(b="BlackBerry"),b;a=B(a.b,/(Linux|Mac_PowerPC|Macintosh|Windows|CrOS|PlayStation|CrKey)/,1);return""!=a?("Mac_PowerPC"==a?a="Macintosh":"PlayStation"==a&&(a="Linux"),a):"Unknown"}
function A(a){var b=B(a.b,/(OS X|Windows NT|Android) ([^;)]+)/,2);if(b||(b=B(a.b,/Windows Phone( OS)? ([^;)]+)/,2))||(b=B(a.b,/(iPhone )?OS ([\d_]+)/,2)))return b;if(b=B(a.b,/(?:Linux|CrOS|CrKey) ([^;)]+)/,1))for(var b=b.split(/\s/),c=0;c<b.length;c+=1)if(/^[\d\._]+$/.test(b[c]))return b[c];return(a=B(a.b,/(BB\d{2}|BlackBerry).*?Version\/([^\s]*)/,2))?a:"Unknown"}
function pa(a){var b=z(a),c=v(A(a)),d=v(B(a.b,/AppleWeb(?:K|k)it\/([\d\.\+]+)/,1)),e="Unknown",f=new n,f="Unknown";/OPR\/[\d.]+/.test(a.b)?e="Opera":-1!=a.b.indexOf("Chrome")||-1!=a.b.indexOf("CrMo")||-1!=a.b.indexOf("CriOS")?e="Chrome":/Silk\/\d/.test(a.b)?e="Silk":"BlackBerry"==b||"Android"==b?e="BuiltinBrowser":-1!=a.b.indexOf("PhantomJS")?e="PhantomJS":-1!=a.b.indexOf("Safari")?e="Safari":-1!=a.b.indexOf("AdobeAIR")?e="AdobeAIR":-1!=a.b.indexOf("PlayStation")&&(e="BuiltinBrowser");"BuiltinBrowser"==
e?f="Unknown":"Silk"==e?f=B(a.b,/Silk\/([\d\._]+)/,1):"Chrome"==e?f=B(a.b,/(Chrome|CrMo|CriOS)\/([\d\.]+)/,2):-1!=a.b.indexOf("Version/")?f=B(a.b,/Version\/([\d\.\w]+)/,1):"AdobeAIR"==e?f=B(a.b,/AdobeAIR\/([\d\.]+)/,1):"Opera"==e?f=B(a.b,/OPR\/([\d.]+)/,1):"PhantomJS"==e&&(f=B(a.b,/PhantomJS\/([\d.]+)/,1));f=v(f);return new y(e,f,"AppleWebKit",d,b,c,C(a.R),new m(536>d.l||536==d.l&&11>d.p))}function B(a,b,c){return(a=a.match(b))&&a[c]?a[c]:""}function C(a){if(a.documentMode)return a.documentMode}
function qa(a){this.Da=a||"-"}qa.prototype.h=function(a){for(var b=[],c=0;c<arguments.length;c++)b.push(arguments[c].replace(/[\W_]+/g,"").toLowerCase());return b.join(this.Da)};function ra(a,b){this.e=a;this.s=a.W.document.documentElement;this.Z=b;this.o="wf";this.n=new qa("-");this.ya=!1!==b.events;this.D=!1!==b.classes}function sa(a){if(a.D){var b=ga(a.s,a.n.h(a.o,"active")),c=[],d=[a.n.h(a.o,"loading")];b||c.push(a.n.h(a.o,"inactive"));l(a.s,c,d)}D(a,"inactive")}
function D(a,b,c){if(a.ya&&a.Z[b])if(c)a.Z[b](c.getName(),E(c));else a.Z[b]()}function F(a,b){this.X=a;this.da=4;this.Y="n";var c=(b||"n4").match(/^([nio])([1-9])$/i);c&&(this.Y=c[1],this.da=parseInt(c[2],10))}F.prototype.getName=function(){return this.X};function E(a){return a.Y+a.da}function G(a,b){this.e=a;this.M=b;this.u=this.e.createElement("span",{"aria-hidden":"true"},this.M)}function ta(a){ea(a.e,"body",a.u)}
function ua(a){var b;b=[];for(var c=a.X.split(/,\s*/),d=0;d<c.length;d++){var e=c[d].replace(/['"]/g,"");-1==e.indexOf(" ")?b.push(e):b.push("'"+e+"'")}b=b.join(",");c="normal";"o"===a.Y?c="oblique":"i"===a.Y&&(c="italic");return"display:block;position:absolute;top:-999px;left:-999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:"+b+";"+("font-style:"+c+";font-weight:"+(a.da+"00")+";")}
G.prototype.remove=function(){var a=this.u;a.parentNode&&a.parentNode.removeChild(a)};function va(a,b,c,d,e,f,h,k){this.ea=a;this.Ca=b;this.e=c;this.w=d;this.M=k||"BESbswy";this.A=e;this.N={};this.ca=f||3E3;this.oa=h||null;this.L=this.K=null;a=new G(this.e,this.M);ta(a);for(var p in H)H.hasOwnProperty(p)&&(b=new F(H[p],E(this.w)),b=ua(b),a.u.style.cssText=b,this.N[H[p]]=a.u.offsetWidth);a.remove()}var H={Qa:"serif",Pa:"sans-serif",Ma:"monospace"};
va.prototype.start=function(){this.K=new G(this.e,this.M);ta(this.K);this.L=new G(this.e,this.M);ta(this.L);this.Ha=ca();var a=new F(this.w.getName()+",serif",E(this.w)),a=ua(a);this.K.u.style.cssText=a;a=new F(this.w.getName()+",sans-serif",E(this.w));a=ua(a);this.L.u.style.cssText=a;wa(this)};function xa(a,b,c){for(var d in H)if(H.hasOwnProperty(d)&&b===a.N[H[d]]&&c===a.N[H[d]])return!0;return!1}
function wa(a){var b=a.K.u.offsetWidth,c=a.L.u.offsetWidth;b===a.N.serif&&c===a.N["sans-serif"]||a.A.ua&&xa(a,b,c)?ca()-a.Ha>=a.ca?a.A.ua&&xa(a,b,c)&&(null===a.oa||a.oa.hasOwnProperty(a.w.getName()))?ya(a,a.ea):ya(a,a.Ca):za(a):ya(a,a.ea)}function za(a){setTimeout(g(function(){wa(this)},a),25)}function ya(a,b){a.K.remove();a.L.remove();b(a.w)}function Aa(a,b,c,d){this.e=b;this.B=c;this.aa=0;this.ta=this.ma=!1;this.ca=d;this.A=a.A}
Aa.prototype.za=function(a){var b=this.B;b.D&&l(b.s,[b.n.h(b.o,a.getName(),E(a).toString(),"active")],[b.n.h(b.o,a.getName(),E(a).toString(),"loading"),b.n.h(b.o,a.getName(),E(a).toString(),"inactive")]);D(b,"fontactive",a);this.ta=!0;Ba(this)};
Aa.prototype.Aa=function(a){var b=this.B;if(b.D){var c=ga(b.s,b.n.h(b.o,a.getName(),E(a).toString(),"active")),d=[],e=[b.n.h(b.o,a.getName(),E(a).toString(),"loading")];c||d.push(b.n.h(b.o,a.getName(),E(a).toString(),"inactive"));l(b.s,d,e)}D(b,"fontinactive",a);Ba(this)};function Ba(a){0==--a.aa&&a.ma&&(a.ta?(a=a.B,a.D&&l(a.s,[a.n.h(a.o,"active")],[a.n.h(a.o,"loading"),a.n.h(a.o,"inactive")]),D(a,"active")):sa(a.B))}function I(){this.F=this.P=-1}I.prototype.now=function(){return(new Date).getTime()};
I.prototype.start=function(){this.P=this.now();this.F=-1};I.prototype.stop=function(){this.F=this.now()};function Ca(){var a=[{name:"font-family",value:J.c[K+1]}];this.Fa=[J.c[K]];this.ha=a}function Da(a){for(var b=a.Fa.join(","),c=[],d=0;d<a.ha.length;d++){var e=a.ha[d];c.push(e.name+":"+e.value+";")}return b+"{"+c.join("")+"}"}function Ea(a){this.e=a}Ea.prototype.toString=function(){return encodeURIComponent(ja(this.e))};function Fa(a,b){this.q=a;this.r=b}
Fa.prototype.toString=function(){for(var a=[],b=0;b<this.r.length;b++)for(var c=this.r[b],d=c.C(),c=c.C(this.q),e=0;e<d.length;e++){var f;a:{for(f=0;f<c.length;f++)if(d[e]===c[f]){f=!0;break a}f=!1}a.push(f?1:0)}a=a.join("");a=a.replace(/^0+/,"");b=[];for(d=a.length;0<d;d-=4)b.unshift(parseInt(a.slice(0>d-4?0:d-4,d),2).toString(16));return b.join("")};function L(a){this.Ja=a}
L.prototype.h=function(a,b){var c=b||{},d=this.Ja.replace(/\{\/?([^*}]*)(\*?)\}/g,function(a,b,d){return d&&c[b]?"/"+c[b].join("/"):c[b]||""});d.match(/^\/\//)&&(d=(a?"https:":"http:")+d);return d.replace(/\/*\?*($|\?)/,"$1")};function Ga(a,b){for(var c=[],d=0;d<b.length;d++)c.push(b[d].toString());return{format:a,extras:c}}function Ha(a,b){this.J=a;this.U=b;this.ja={};this.ia={}}Ha.prototype.C=function(a){return a?(this.ja[a]||this.U).slice(0):this.U.slice(0)};
function Ia(a,b,c){for(var d=[],e=a.J.split(",")[0].replace(/"|'/g,""),f=a.C(),h,k=[],p={},r=0;r<f.length;r++)h=f[r],0<h.length&&!p[h]&&(p[h]=!0,k.push(h));c=c.ra?c.ra(e,k,d):k;a.ja[b]=c;a.ia[b]=d}function Ja(a,b){for(var c=a.C(b),d=a.ia[b]||[],e=[],f=0;f<c.length;f++)e.push(new F(a.J,c[f]));for(f=0;f<d.length;f++)if(c=d[f].J,c!==a.J)for(var h=d[f].C(),k=0;k<h.length;k++)e.push(new F(c,h[k]));return e}function La(a,b){this.J=a;this.U=b}La.prototype.C=function(){return this.U};
function Ma(a,b,c,d,e){this.Ga=a;this.Ba=b;this.T=c||[];this.wa=d||null;this.Ia=e||null}
Ma.prototype.send=function(a,b,c){var d=new L("//p.typekit.net/p.gif?s={service}&k={token}&app={app}&ht={hosting}&h={host}&f={variations}&a={account}&sl={stylesheetLoadTime}&fl={fontLoadTime}&_={_}"),e=encodeURIComponent((window.__adobewebfontsappname__||"").toString().substr(0,20)),f=encodeURIComponent(ja(a)),h=[],k=[];window.Typekit.fonts||(window.Typekit.fonts=[]);for(var k=window.Typekit.fonts,p=0;p<this.T.length;p++){for(var r=!1,x=0;x<k.length;x++)if(this.T[p]===k[x]){r=!0;break}r||(h.push(this.T[p]),
k.push(this.T[p]))}h.length&&Na(d.h("https:"===ha(a),{service:this.Ga,token:this.Ia,app:e,hosting:this.Ba,host:f,variations:h.join("."),account:this.wa,stylesheetLoadTime:b,fontLoadTime:c,_:(+new Date).toString()}))};function Na(a){var b=new Image(1,1),c=!1;b.src=a;b.onload=function(){c=!0;b.onload=null};setTimeout(function(){c||(b.src="about:blank",b.onload=null)},3E3)}function Oa(){this.fa=this.va=this.G=this.V=this.la=!0}function M(a){return"Windows"===a.m}
function N(a){return M(a)&&u(a.g,new n(5,1))||M(a)&&u(a.g,new n(5,2))||M(a)&&u(a.g,new n(6,0))||M(a)&&s(a.g,new n(6,1))}function O(a){return"Macintosh"===a.m&&(s(a.g,new n(10,4))||null===a.g.l)}function Pa(a,b){return b.la&&("iPhone"===a.m||"iPod"===a.m)}function Qa(a,b){return Pa(a,b)&&s(a.g,new n(4,2))&&q(a.g,new n(5))}function Ra(a,b){return b.V&&"iPad"===a.m&&s(a.g,new n(4,2))&&q(a.g,new n(5))}function P(a,b){return b.G&&"Android"===a.m}
function Sa(a,b){return P(a,b)&&s(a.g,new n(2,2))&&q(a.g,new n(3,1))}function Ta(a,b){return P(a,b)&&s(a.g,new n(3,1))&&q(a.g,new n(4,1))}function Q(a){return"Linux"===a.m||"Ubuntu"===a.m}function Ua(a){return"Safari"===a.getName()&&"AppleWebKit"===a.I||"Unknown"===a.getName()&&"AppleWebKit"===a.I&&("iPhone"===a.m||"iPad"===a.m||"iPod"===a.m)}function Va(a){return"BuiltinBrowser"===a.getName()}function Wa(a){this.ra=a}function Xa(a,b){return b}
var S={Na:"a",Ra:"d",La:"i",Oa:"j",Ka:"k",NONE:"x"},T={a:function(a,b){return"Safari"===a.getName()&&"AppleWebKit"===a.I&&s(a.S,new n(525,13))&&q(a.S,new n(534,50))&&(N(a)||O(a))||Va(a)&&(Sa(a,b)||P(a,b)&&s(a.g,new n(4,1)))||b.G&&"Silk"===a.getName()&&q(a.v,new n(2))&&(Sa(a,b)||O)||b.G&&"Silk"===a.getName()&&s(a.v,new n(2))&&P(a,b)&&s(a.g,new n(4,1))||Ua(a)&&(Ra(a,b)||Qa(a,b))||"Chrome"===a.getName()&&s(a.v,new n(6))&&(Ra(a,b)||Qa(a,b))||"AdobeAIR"===a.getName()&&s(a.v,new n(2,5))&&(M(a)&&null===
a.g.l||Q(a)||O(a))},d:function(a,b){return"Chrome"===a.getName()&&s(a.v,new n(6))&&(N(a)||Q(a)||O(a)||P(a,b)||"CrOS"===a.m||"CrKey"===a.m||b.V&&"iPad"===a.m&&s(a.g,new n(5))||Pa(a,b)&&s(a.g,new n(5)))||"Gecko"===a.I&&1===a.S.compare(new n(1,9,1))&&(N(a)||Q(a)||O(a)||P(a,b))||"Safari"===a.getName()&&"AppleWebKit"===a.I&&s(a.S,new n(534,50))&&(N(a)||O(a))||Ua(a)&&(b.V&&"iPad"===a.m&&s(a.g,new n(5))||Pa(a,b)&&s(a.g,new n(5)))||"Opera"===a.getName()&&s(a.v,new n(11,10))&&(N(a)||Q(a)||O(a)||P(a,b))||"MSIE"===
a.getName()&&9<=a.ba&&(M(a)&&s(a.g,new n(6,1))||M(a)&&u(a.g,new n(6,0)))||"MSIE"===a.getName()&&b.va&&"Windows Phone"===a.m&&s(a.g,new n(8))||Va(a)&&(b.fa&&"BlackBerry"===a.m&&s(a.g,new n(10))||Q(a))},j:function(a,b){return Va(a)&&Ta(a,b)||b.G&&"Silk"===a.getName()&&s(a.v,new n(2))&&(Ta(a,b)||Q(a))},i:function(a){return"MSIE"===a.getName()&&s(a.v,new n(6,0))&&(void 0===a.ba||9>a.ba)&&N(a)},x:function(){return!1}},Ya={};
Ya.i=new Wa(function(a,b,c){for(var d=0;d<b.length;d+=1){var e=b[d],f;f=e;f=a.replace(/(-1|-2)$/,"").slice(0,28)+"-"+f;c.push(new La(f,[e]))}a={};for(e=0;e<b.length;e++)c=b[e],d=c.charAt(1),(a[d]||(a[d]=[])).push(c);c=[[4,3,2,1,5,6,7,8,9],[7,8,9,6,5,4,3,2,1]];d=[];for(e=0;e<c.length;e++){f=c[e];for(var h=0;h<f.length;h++){var k=f[h];if(a[k]){d=d.concat(a[k]);break}}}c=d;d={};a=[];for(e=0;e<c.length;e++)f=c[e],d[f]||(d[f]=!0,a.push(f));c=[];for(d=0;d<b.length;d++)for(e=b[d],f=0;f<a.length;f++)h=a[f],
h==e&&c.push(h);return c});var U={};U.a=U.d=U.j=function(){return[]};U.i=function(a,b,c){return[new Ea(a),new Fa(b,c)]};U.k=function(a){return[new Ea(a)]};function Za(a,b,c){return U[b](a,b,c)}function V(a){this.e=a;this.q="x";this.ga=this.b=null;this.r=[];this.Q=[];this.ka=this.$=null}V.prototype.supportsConfiguredBrowser=function(){return"x"!==this.q};
V.prototype.init=function(){if(0<this.Q.length){for(var a=[],b=0;b<this.Q.length;b++)a.push(Da(this.Q[b]));var b=this.e,a=a.join(""),c=this.e.createElement("style");c.setAttribute("type","text/css");c.styleSheet?c.styleSheet.cssText=a:c.appendChild(document.createTextNode(a));ea(b,"head",c)}};
V.prototype.load=function(a,b,c){function d(){}var e=this,f=c||{},h=f.contextPath||".",k=f.hostname||this.ka;a=f.timeout;c=!1!==f.events;var p=null,r=new I,x=new I;f.active&&(d=f.active);f.active=function(){x.stop();e.pa&&e.pa.send(e.e,-1!==r.P&&-1!==r.F?r.F-r.P:-1,-1!==x.P&&-1!==x.F?x.F-x.P:-1);d()};p=new ra(this.e,f);if(this.q){for(var f=Ya[this.q]||new Wa(Xa),w=0;w<this.r.length;w++)Ia(this.r[w],this.q,f);this.$&&(f=Za(this.e,this.q,this.r),f=Ga(this.q,f),f.contextPath=h,k&&(f.hostname=k),h=this.$.h("https:"===
ha(this.e),f),r.start(),ka(this.e,h,function(){r.stop();x.start()}));if(c){for(var R=[],Ka={},t=new Aa(this.b,this.e,p,a),w=0;w<this.r.length;w++)R=R.concat(Ja(this.r[w],this.q));for(w=0;w<R.length;w++)Ka[R[w].getName()]="BESbswy\ue000\ue001\ue002\ue003\ue004\ue005\ue006";fa(this.e,function(){var a=R,c={},d=Ka||{};if(0===a.length&&b)sa(t.B);else{t.aa+=a.length;b&&(t.ma=b);for(var e=0;e<a.length;e++){var f=a[e],h=d[f.getName()],k=t.B,p=f;k.D&&l(k.s,[k.n.h(k.o,p.getName(),E(p).toString(),"loading")]);
D(k,"fontloading",p);k=null;k=new va(g(t.za,t),g(t.Aa,t),t.e,f,t.A,t.ca,c,h);k.start()}}})}}};V.prototype.performOptionalActions=function(){};function $a(a,b,c,d){this.Ea=a;this.e=b;this.b=c;this.s=d;this.t=[]}$a.prototype.xa=function(a){this.t.push(a)};
$a.prototype.load=function(a,b){var c=a,d=b||{};"string"==typeof c?c=[c]:c&&c.length||(d=c||{},c=[]);d.protocol&&ia(this.e,d.protocol);if(c.length)for(var e=this,f=c.length,h=0;h<c.length;h++)ab(this,c[h],function(){0==--f&&bb(e,d)});else bb(this,d)};function ab(a,b,c){b=a.Ea.h("https:"===ha(a.e),{id:encodeURIComponent(b)});la(a.e,b,c)}
function bb(a,b){if(0!=a.t.length){for(var c=new ra(a.e,b),d=!1,e=0;e<a.t.length;e++)a.t[e].init(),d=d||a.t[e].supportsConfiguredBrowser();if(d)for(c.D&&l(c.s,[c.n.h(c.o,"loading")]),D(c,"loading"),c=0;c<a.t.length;c++)d=a.t[c],d.supportsConfiguredBrowser()&&d.load(null,c==a.t.length-1,b);else sa(c);a.t=[]}}var cb=(new na(navigator.userAgent,document)).parse(),db=new da(window);window.Typekit||(window.Typekit={});
if(!window.Typekit.load){var eb=window.Typekit.config||{},fb=null;eb.k&&(fb=new L(eb.k));var W=new $a(fb,db,cb,document.documentElement);window.Typekit.load=function(){W.load.apply(W,arguments)};window.Typekit.addKit=function(){W.xa.apply(W,arguments)}}var gb,X,Y,J=window.Typekit.config||{};Y=new V(db);Y.pa=new Ma(J.ps,J.ht,J.fi,J.a,J.kt);X=new Oa;X.la=!J.si;X.V=!J.st;X.G=!J.sa;X.va=!J.sw;X.fa=!J.sb;Y.ga=X;J.f&&(gb=new L(J.f),Y.$=gb);J.hn&&(Y.ka=J.hn);var K;
if(J.fn)for(K=0;K<J.fn.length;K+=2)Y.r.push(new Ha(J.fn[K],J.fn[K+1]));if(J.c)for(K=0;K<J.c.length;K+=2)Y.Q.push(new Ca);Y.b=cb;var Z;a:{var hb=Y.b,ib=new Oa,jb=Y.ga||ib,kb;for(kb in S){var $=S[kb];if(T[$]&&T[$](hb,jb)){Z=$;break a}}for(kb in S)if($=S[kb],T[$]&&T[$](hb,ib)){Z="x";break a}Z="k"}Y.q=Z;window.Typekit.addKit(Y);if(window.WebFont)try{window.Typekit.load()}catch(lb){};
})(this,document);
