// ==UserScript==
// @name         叮当公共库收录情况（测试）
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在steam网页中浏览游戏页面时，在标题后追加显示其在叮当公共库的收录情况。
// @author       Julius
// @match        https://store.steampowered.com/app/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atomicobject.com
// @grant        GM_xmlhttpRequest
// @connect      ruku.ga
// @updateURL    https://github.com/Smiorld/DingDownSteamWebScript/blob/main/DingDownSteamWebScript.js
// @downloadURL  https://github.com/Smiorld/DingDownSteamWebScript/blob/main/DingDownSteamWebScript.js
// ==/UserScript==

(function() {
    'use strict';
    let data = {Id: window.location.pathname.split('/')[2]};
    let title = document.getElementById("appHubAppName");
    GM_xmlhttpRequest ( {
    method:     "POST",
    url:        "https://ruku.ga/CheckId",
    data:       JSON.stringify(data),
    timeout:    20000,
    responseType:"json",
    ontimeout:  function (){
        console.log ("post request time out");
    },
    onload:     function (response) {
        console.log ("got response");
        console.log (response.response.Data);
        if (response.response.Data.Id == "0"){
            title.innerHTML += " ----- 公共库未收录"
        }
        else{
            title.innerHTML += " <br> 已收录，提交者："+response.response.Data.NickName+"，入库时间："+response.response.Data.Date;
        }
    }
} );
})();
