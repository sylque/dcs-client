!function(){"use strict";const e={inIFrame:()=>{try{return window.self!==window.top}catch(e){return!0}}};e.dom={onDOMReady:()=>new Promise(e=>{"loading"!==document.readyState?e():document.addEventListener("DOMContentLoaded",e)}),forEach(e,t,i){const n=[...e];for(let e=0;e<n.length;e++)t.call(i||window,n[e],e)},wrap:(e,t)=>(e.parentNode.insertBefore(t,e),t.appendChild(e),t),wrapAll(e,t){if(e&&e.length){const i=Array.prototype.slice.call(e);i[0].parentNode.insertBefore(t,i[0]),i.forEach(e=>t.appendChild(e))}return t},createElement(e){const t=document.createElement("div");return t.innerHTML=e.trim(),t.firstChild}};var t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},i=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},n=function(){function e(e,t){for(var i=0;i<t.length;i++){var n=t[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,i,n){return i&&e(t.prototype,i),n&&e(t,n),t}}(),o=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t},s=function(){function e(){i(this,e),this._listeners={}}return n(e,[{key:"on",value:function(e,t){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;this._listeners[e]||(this._listeners[e]=[]),t._priority=parseInt(i)||0,-1===this._listeners[e].indexOf(t)&&(this._listeners[e].push(t),this._listeners[e].length>1&&this._listeners[e].sort(this.listenerSorter))}},{key:"listenerSorter",value:function(e,t){return e._priority-t._priority}},{key:"off",value:function(e,t){if(void 0!==this._listeners[e])if(void 0!==t){var i=this._listeners[e].indexOf(t);-1<i&&this._listeners[e].splice(i,1)}else delete this._listeners[e]}},{key:"trigger",value:function(e){var i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if("string"==typeof e&&(e={type:e,data:"object"===(void 0===i?"undefined":t(i))&&null!==i?i:{}}),void 0!==this._listeners[e.type])for(var n=this._listeners[e.type].length-1;n>=0;n--)this._listeners[e.type][n](e)}},{key:"destroy",value:function(){this._listeners={}}}]),e}(),r=function(e){function r(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:100*Math.random()|0;i(this,r);var t=o(this,(r.__proto__||Object.getPrototypeOf(r)).call(this));return t.id="BELLHOP:"+e,t.connected=!1,t.isChild=!0,t.connecting=!1,t.origin="*",t._sendLater=[],t.iframe=null,t.receive=t.receive.bind(t),t}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(r,s),n(r,[{key:"receive",value:function(e){if(this.target===e.source)if("connected"===e.data)this.onConnectionReceived(e.data);else{var i=e.data;if("string"==typeof i)try{i=JSON.parse(i)}catch(e){console.error("Bellhop error: ",e)}this.connected&&"object"===(void 0===i?"undefined":t(i))&&i.type&&this.trigger(i)}}},{key:"onConnectionReceived",value:function(e){this.connecting=!1,this.connected=!0,this.isChild||this.target.postMessage(e,this.origin);for(var t=0;t<this._sendLater.length;t++){var i=this._sendLater[t],n=i.type,o=i.data;this.send(n,o)}this._sendLater.length=0,this.trigger("connected")}},{key:"connect",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"*";this.connecting||(this.disconnect(),this.connecting=!0,e instanceof HTMLIFrameElement&&(this.iframe=e),this.isChild=void 0===e,this.supported=!0,this.isChild&&(this.supported=window!=e),this.origin=t,window.addEventListener("message",this.receive),this.isChild&&(window===this.target?this.trigger("failed"):this.target.postMessage("connected",this.origin)))}},{key:"disconnect",value:function(){this.connected=!1,this.connecting=!1,this.origin=null,this.iframe=null,this.isChild=!0,this._sendLater.length=0,window.removeEventListener("message",this.receive)}},{key:"send",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if("string"!=typeof e)throw"The event type must be a string";var i={type:e,data:t};this.connecting?this._sendLater.push(i):this.target.postMessage(JSON.stringify(i),this.origin)}},{key:"fetch",value:function(e,t){var i=this,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},o=arguments.length>3&&void 0!==arguments[3]&&arguments[3];if(!this.connecting&&!this.connected)throw"No connection, please call connect() first";this.on(e,function e(n){o&&i.off(n.type,e),t(n)}),this.send(e,n)}},{key:"respond",value:function(e){var t=this,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=arguments.length>2&&void 0!==arguments[2]&&arguments[2];this.on(e,function o(s){n&&t.off(s.type,o),t.send(e,"function"==typeof i?i():i)})}},{key:"destroy",value:function(){(function e(t,i,n){null===t&&(t=Function.prototype);var o=Object.getOwnPropertyDescriptor(t,i);if(void 0===o){var s=Object.getPrototypeOf(t);return null===s?void 0:e(s,i,n)}if("value"in o)return o.value;var r=o.get;return void 0!==r?r.call(n):void 0})(r.prototype.__proto__||Object.getPrototypeOf(r.prototype),"destroy",this).call(this),this.disconnect(),this._sendLater.length=0}},{key:"target",get:function(){return this.isChild?window.parent:this.iframe.contentWindow}}]),r}();const c=new class{constructor(){this._bellhop=new r,this._timer=null,this._onConnected=null,this._bellhop.on("connected",()=>{this._timer&&(clearTimeout(this._timer),this._timer=null),this._onConnected&&this._onConnected()})}connect({discourseOrigin:t,onConnected:i,timeout:n,onTimeout:o}){if(!e.inIFrame())throw new Error("comToPlugin must be used in an iframe");this.disconnect(),this._onConnected=i,this._timer=n?setTimeout(()=>{o&&o()},n):null,this._bellhop.connect(void 0,t)}disconnect(){this._timer&&(clearTimeout(this._timer),this._timer=null),this._bellhop.disconnect()}isConnected(){return this._bellhop.connected}onDiscourseRoutePushed(e){this._bellhop.on("m2",t=>e(t.data))}onCountsChanged(e){this._bellhop.on("m3",t=>e(t.data))}postSetDiscourseRoute({route:e,mode:t,clientContext:i}){this._bellhop.send("m4",arguments[0])}postSetHash({hash:e,mode:t}){this._bellhop.send("m5",arguments[0])}postSetRouteProps({category:e,discourseTitle:t,error:i}){this._bellhop.send("m6",arguments[0])}postSetRedirects(e){this._bellhop.send("m7",e)}};function l(e){const t=e.getBoundingClientRect();t.top<window.innerHeight&&t.bottom>=0||(e.scrollIntoView(),window.scrollBy(0,-50))}const d=new class{constructor(){this.selTriggerNode=null,this.resizeTimer=null,c.onDiscourseRoutePushed(this._onDiscourseRoutePushed.bind(this)),c.onCountsChanged(({counts:e})=>console.log("counts: ",e))}connect({discourseOrigin:e,timeout:t}){return new Promise((i,n)=>{this.resolveInit=i,c.connect({discourseOrigin:e,timeout:t,onTimeout:()=>n("timeout")})})}parseDom({descr:t,pageName:i,discourseUrl:n,counts:o}){const s=t.staticPages.find(e=>e.name===i).url,r=new URL(n).origin;return e.dom.onDOMReady().then(()=>{e.dom.forEach(document.getElementsByTagName("a"),e=>{if(!e.href||"#"===e.href||e.href.startsWith("javascript:"))return;const i=e.getAttribute("href").trim();if(i.startsWith("DISCOURSE/")?e.href=r+i.substring("DISCOURSE/".length-1):e.href=new URL(i,s),"_parent"!==e.target&&"_top"!==e.target||delete e.target,e.origin===r)return void(e.onclick=(t=>{t.preventDefault(),t.stopPropagation(),c.postSetDiscourseRoute({route:{layout:"FULL_DISCOURSE",url:e.href},mode:"PUSH",clientContext:!0})}));const n=e.href.split("#")[0];if(e.hash&&n===s.split("#")[0])return void(e.onclick=(()=>{c.postSetHash({hash:e.hash,mode:"REPLACE"})}));const o=t.staticPages.find(e=>e.url.split("#")[0]===n);o?(e.href=r+"/docuss/"+o.name+e.hash,e.target&&"_self"!==e.target||(e.onclick=(e=>{e.preventDefault(),e.stopPropagation(),c.postSetDiscourseRoute({route:{layout:"FULL_CLIENT",pageName:o.name},mode:"PUSH",clientContext:!0})}))):e.target&&"_self"!==e.target||(e.target="_parent")});const n=document.getElementsByClassName("dcs-trigger"),o={};e.dom.forEach(n,e=>{const t=e.dataset.dcsTriggerId,i=o[t]||!!e.dataset.dcsHighlightable;o[t]=i});const d=Object.keys(o).filter(e=>!o[e]).map(e=>({src:{layout:"WITH_SPLIT_BAR",triggerId:e,showRight:!1},dest:{layout:"FULL_CLIENT"}}));c.postSetRedirects(d),e.dom.forEach(document.querySelectorAll(".dcs-icons, .dcs-trigger.dcs-no-balloon .dcs-trigger-span, .dcs-trigger.dcs-no-balloon.dcs-no-span"),e=>{e.onclick=(e=>{if(window.getSelection().toString())return;const t=e.target.closest(".dcs-trigger"),n=t.dataset.dcsTriggerId;this._selectTriggers(n),c.postSetDiscourseRoute({route:{layout:"WITH_SPLIT_BAR",pageName:t.dataset.dcsPageName||i,triggerId:n,interactMode:t.dataset.dcsInteractMode,showRight:!0},mode:"PUSH",clientContext:!0}),e.stopPropagation()})}),this.runReady=!0,window.addEventListener("click",()=>{this.selTriggerNode&&this.selTriggerNode.dataset.dcsHighlightable&&(this._selectTriggers(null),c.postSetDiscourseRoute({route:{layout:"FULL_CLIENT",pageName:i},mode:"PUSH",clientContext:!0}))}),window.addEventListener("resize",e=>{null!==this.resizeTimer&&clearTimeout(this.resizeTimer),this.resizeTimer=setTimeout(()=>{this.resizeTimer=null,this.selTriggerNode&&l(this.selTriggerNode)},100)}),this.delayedRoute&&this._onDiscourseRoutePushed({route:this.delayedRoute})})}_onDiscourseRoutePushed({route:e,descr:t,counts:i,clientContext:n}){if(this.resolveInit)return this.resolveInit({descr:t,pageName:e.pageName,discourseUrl:e.url,counts:i}),delete this.resolveInit,this.runReady=!1,void(this.delayedRoute=e);if(this.runReady){if("WITH_SPLIT_BAR"===e.layout){const t=e.triggerId&&document.querySelector(`.dcs-trigger[data-dcs-trigger-id="${e.triggerId}"]`),i=t&&t.dataset.dcsCategory||document.documentElement.dataset.dcsCategory,n=t&&t.dataset.dcsDiscourseTitle||document.documentElement.dataset.dcsDiscourseTitle;c.postSetRouteProps({category:i,discourseTitle:n})}n||this._selectTriggers(e.triggerId)}else this.delayedRoute=e}_selectTriggers(t){if(!this.runReady)throw new Error("should be ready");if(this.selTriggerNode=null,e.dom.forEach(document.getElementsByClassName("dcs-highlighted"),e=>e.classList.remove("dcs-highlighted")),!t)return;const i=document.querySelectorAll(`.dcs-trigger[data-dcs-trigger-id="${t}"]`);i.length?(e.dom.forEach(i,e=>{if(e.dataset.dcsHighlightable){e.classList.add("dcs-highlighted");const t=e.closest(".dcs-subsec");t&&t.classList.add("dcs-highlighted")}}),this.selTriggerNode=i[0],setTimeout(()=>l(this.selTriggerNode),700)):c.postSetRouteProps({error:error})}};d.connect({discourseOrigin:"*",timeout:1e4}).then(e=>{d.parseDom(e)},e=>logError("Unable to connect to dcs-discourse-plugin2",e))}();
//# sourceMappingURL=dcs-html-based.js.map
