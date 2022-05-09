// ==UserScript==
// @name         叮当公共库收录情况（测试）
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  在steam网页中浏览游戏页面时，在标题后追加显示其在叮当公共库的收录情况。
// @author       Julius
// @match        https://store.steampowered.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atomicobject.com
// @grant        GM_xmlhttpRequest
// @connect      ruku.ga
// @updateURL    https://github.com/Smiorld/DingDownSteamWebScript/blob/main/DingDownSteamWebScript.js
// @downloadURL  https://github.com/Smiorld/DingDownSteamWebScript/blob/main/DingDownSteamWebScript.js
// ==/UserScript==

'use strict';
window.addEventListener("load",function(){
    if(window.location=='https://store.steampowered.com/'){
        let tab_newreleases_content = document.querySelector('#tab_newreleases_content');//the box for searching result. each child in it is an <a>.
        let children = tab_newreleases_content.children;
        for(let i=1; i<children.length; i++){
            let child = children[i];
            if(child.href.split('/')[3]=='app'){

                let data = {Id: child.href.split('/')[4]};
                let title = child.children[2].children[0];
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
                            title.innerHTML = "<span style='color:red;'>（未收录）</span>"+title.innerHTML;
                        }
                        else{
                            title.innerHTML = "<span style='color:green;'>（已收录）</span>"+title.innerHTML;
                        }
                    }
                } );
            }
        }
    }

    else if(window.location.pathname.split('/')[1]=='app'){
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
    }

    else if(window.location.pathname.split('/')[1]=='search'){

        let searching_result = document.querySelector('#search_resultsRows');//the box for searching result. each child in it is an <a>.
        let children = searching_result.children;
        for(let i=0; i<children.length; i++){
            let child = children[i];
            if(child.href.split('/')[3]=='app'){

                let data = {Id: child.href.split('/')[4]};
                let title = child.children[1].children[0].children[0];
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
                            title.innerHTML = "<span style='color:red;'>（未收录）</span>"+title.innerHTML;
                        }
                        else{
                            title.innerHTML = "<span style='color:green;'>（已收录）</span>"+title.innerHTML;
                        }
                    }
                } );
            }
        }
    }
})

//mutation检测是否在搜索结果内部分有变化。若有，触发脚本
if(window.location.pathname.split('/')[1]=='search'){
    const targetNode = document.querySelector('#search_results');

    const config = {
        attributes: true,
        childList: true,
        characterData: true
    };

    const callback = mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                let searching_result = document.querySelector('#search_resultsRows');//the box for searching result. each child in it is an <a>.
                let children = searching_result.children;
                for(let i=0; i<children.length; i++){
                    let child = children[i];
                    if(child.href.split('/')[3]=='app'){

                        let data = {Id: child.href.split('/')[4]};
                        let title = child.children[1].children[0].children[0];
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
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>"+title.innerHTML;
                                }
                                else{
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>"+title.innerHTML;
                                }
                            }
                        } );
                    }
                }
            }
        });
    }

    const observer = new MutationObserver(callback);

    observer.observe(targetNode, config);
}
