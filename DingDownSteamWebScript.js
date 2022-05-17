// ==UserScript==
// @name         叮当公共库收录情况（测试）
// @homepage     https://github.com/Smiorld/DingDownSteamWebScript
// @namespace    https://github.com/Smiorld
// @version      0.9.8
// @description  在steam网页中浏览游戏页面时，在标题后追加显示其在叮当公共库的收录情况。
// @author       Smiorld
// @match        https://store.steampowered.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atomicobject.com
// @grant        GM_xmlhttpRequest
// @connect      ddapi.133233.xyz
// @updateURL    https://github.com/Smiorld/DingDownSteamWebScript/blob/main/DingDownSteamWebScript.js
// @downloadURL  https://github.com/Smiorld/DingDownSteamWebScript/blob/main/DingDownSteamWebScript.js
// @license MIT
// ==/UserScript==

window.addEventListener("load", function () {
    if (window.location == 'https://store.steampowered.com/') {
        let tab_newreleases_content = document.querySelector('#tab_newreleases_content'); //the box for searching result. each child in it is an <a>.
        let children = tab_newreleases_content.children;

        //restore all appid
        let appid=[];
        let childrenLength=children.length;
        for (let i = 1; i < childrenLength;i++ ){
            let tmpchild=children[i];
            if (tmpchild.href.split('/')[3] == 'app') {
                let title = tmpchild.children[2].children[0];
                if(!title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app'){
                    title.setAttribute("dingPost", "dingPost");
                    appid.push(tmpchild.href.split('/')[4]);
                }
            }
        }

        //send post request to server
        if(appid.length!=0){
            let data={"Ids":appid.join()};
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://ddapi.133233.xyz/CheckIds",
                data: JSON.stringify(data),
                timeout: 20000,
                responseType: "json",
                ontimeout: function () {
                    console.log("post request time out");
                },
                onload: function (response) {
                    console.log("got response for "+response.response.Data.Total+" appid" );
                    //prefix all titles
                    for (let i = 1; i < childrenLength;i++ ){
                        let tmpchild=children[i];
                        if (tmpchild.href.split('/')[3] == 'app') {
                            let title = tmpchild.children[2].children[0];
                            let thisid =tmpchild.href.split('/')[4];
                            if( !title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a=>a==thisid) ){
                                if(response.response.Data.AppInfo[thisid]){
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                }
                                else{
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                }
                                appid.splice(appid.indexOf(thisid),1);
                                title.setAttribute("dingPrefix","dingPrefix");
                            }
                        }
                        else if (tmpchild.href.split('/')[3] == 'bundle') {
                            let title = tmpchild.children[2].children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                            }
                        }
                        else if (tmpchild.href.split('/')[3] == 'sub') {
                            let title = tmpchild.children[2].children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                            }
                        }
                    }
                }
            });
        }



    }

    else if (window.location.pathname.split('/')[1] == 'app') {
        let data = {
            Id: window.location.pathname.split('/')[2]
        };
        let title = document.getElementById("appHubAppName");
        if (!title.getAttribute("dingPost")) {
            title.setAttribute("dingPost", "dingPost");
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://ddapi.133233.xyz/CheckId",
                data: JSON.stringify(data),
                timeout: 20000,
                responseType: "json",
                ontimeout: function () {
                    console.log("post request time out");
                },
                onload: function (response) {
                    console.log("got response");
                    if (response.response.Data.Id == "0") {
                        title.innerHTML += " ----- 公共库未收录"
                    }
                    else {
                        title.innerHTML += " <br> 已收录，提交者：" + response.response.Data.NickName + "，入库时间：" + response.response.Data.Date;
                    }
                    title.setAttribute("dingPrefix", "dingPrefix");
                }
            });
        }
    }

    else if (window.location.pathname.split('/')[1] == 'search') {
        let tmp_script = document.querySelector('#responsive_page_template_content').children[0].innerHTML;
        let position = tmp_script.search(/"infiniscroll"/);
        let infiniscroll = tmp_script[position + 15]; //为0时没有无限下滚，为1时有。这个决定了整个页面变化的div如何定位。经过实测，如果无限下滚，则不需要onload的时候触发一次。
        if (infiniscroll == 0) {
            let searching_result = document.querySelector('#search_resultsRows'); //the box for searching result. each child in it is an <a>.
            let children = searching_result.children;

            //restore all appid
            let appid=[];
            let childrenLength = children.length;
            for (let i = 0; i < childrenLength;i++ ){
                let tmpchild=children[i];
                if (tmpchild.href.split('/')[3] == 'app') {
                    let title = tmpchild.children[1].children[0].children[0];
                    if(!title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app'){
                        title.setAttribute("dingPost", "dingPost");
                        appid.push(tmpchild.href.split('/')[4]);
                    }
                }
            }
            //send post request to server
            if(appid.length!=0){
                let data={"Ids":appid.join()};
                GM_xmlhttpRequest({
                    method: "POST",
                    url: "https://ddapi.133233.xyz/CheckIds",
                    data: JSON.stringify(data),
                    timeout: 20000,
                    responseType: "json",
                    ontimeout: function () {
                        console.log("post request time out");
                    },
                    onload: function (response) {
                        console.log("got response for "+response.response.Data.Total+" appid" );
                        //prefix all titles
                        for (let i = 0; i < childrenLength;i++ ){
                            let tmpchild=children[i];
                            if (tmpchild.href.split('/')[3] == 'app') {
                                let title = tmpchild.children[1].children[0].children[0];
                                let thisid =tmpchild.href.split('/')[4];
                                if( !title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a=>a==thisid) ){
                                    if(response.response.Data.AppInfo[thisid]){
                                        title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                    }
                                    else{
                                        title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                    }
                                    appid.splice(appid.indexOf(thisid),1);
                                    title.setAttribute("dingPrefix","dingPrefix");
                                }
                            }
                            else if (tmpchild.href.split('/')[3] == 'bundle') {
                                let title = tmpchild.children[1].children[0].children[0];
                                if (!title.getAttribute("dingPrefix")) {
                                    title.setAttribute("dingPrefix", "dingPrefix");
                                    title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                                }
                            }
                            else if (tmpchild.href.split('/')[3] == 'sub') {
                                let title = tmpchild.children[1].children[0].children[0];
                                if (!title.getAttribute("dingPrefix")) {
                                    title.setAttribute("dingPrefix", "dingPrefix");
                                    title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                                }
                            }
                        }
                    }
                });
            }

        }
    }
})

//mutation检测是否在搜索结果内部分有变化。若有，触发脚本

//主页. xxx1是服务于类搜索结果的部分的.
if (window.location == 'https://store.steampowered.com/') {
    let targetNode1 = document.querySelector('#last_tab');
    let config = {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true
    };

    let callback1 = mutations => {
        let tags = targetNode1.getAttribute("value");
        let display = document.querySelector('#' + tags); //the box for searching result. each child in it is an <a>.
        let children = display.children;
        //restore all appid
        let appid=[];
        let childrenLength = children.length;
        for (let i = 1; i < childrenLength;i++ ){
            let tmpchild=children[i];
            if (tmpchild.href.split('/')[3] == 'app') {
                let title = tmpchild.children[2].children[0];
                if(!title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app'){
                    title.setAttribute("dingPost", "dingPost");
                    appid.push(tmpchild.href.split('/')[4]);
                }
            }
        }

        //send post request to server
        if(appid.length!=0){
            let data={"Ids":appid.join()};
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://ddapi.133233.xyz/CheckIds",
                data: JSON.stringify(data),
                timeout: 20000,
                responseType: "json",
                ontimeout: function () {
                    console.log("post request time out");
                },
                onload: function (response) {
                    console.log("got response for "+response.response.Data.Total+" appid" );
                    //prefix all titles
                    for (let i = 1; i < childrenLength;i++ ){
                        let tmpchild=children[i];
                        if (tmpchild.href.split('/')[3] == 'app') {
                            let title = tmpchild.children[2].children[0];
                            let thisid =tmpchild.href.split('/')[4];
                            if( !title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a=>a==thisid) ){
                                if(response.response.Data.AppInfo[thisid]){
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                }
                                else{
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                }
                                appid.splice(appid.indexOf(thisid),1);
                                title.setAttribute("dingPrefix","dingPrefix");
                            }
                        }
                        else if (tmpchild.href.split('/')[3] == 'bundle') {
                            let title = tmpchild.children[2].children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                            }
                        }
                        else if (tmpchild.href.split('/')[3] == 'sub') {
                            let title = tmpchild.children[2].children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                            }
                        }
                    }
                }
            });
        }

    }

    const observer1 = new MutationObserver(callback1);
    observer1.observe(targetNode1, config);
}

//搜索页面
else if (window.location.pathname.split('/')[1] == 'search') {
    let targetNode = document.querySelector('#search_results');
    let config;

    config = {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true
    };


    let callback = mutations => {
        mutations.forEach(mutation => {
            let searching_result = document.querySelector('#search_resultsRows'); //the box for searching result. each child in it is an <a>.
            let children = searching_result.children;

            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (child.href.split('/')[3] == 'app') {

                    let data = {
                        Id: child.href.split('/')[4]
                    };
                    let title = child.children[1].children[0].children[0];
                    if (!title.getAttribute("dingPost")) {
                        title.setAttribute("dingPost", "dingPost");
                        GM_xmlhttpRequest({
                            method: "POST",
                            url: "https://ddapi.133233.xyz/CheckId",
                            data: JSON.stringify(data),
                            timeout: 20000,
                            responseType: "json",
                            ontimeout: function () {
                                console.log("post request time out");
                            },
                            onload: function (response) {
                                console.log("got response");
                                if (response.response.Data.Id == "0") {
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                }
                                else {
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                }
                                title.setAttribute("dingPrefix","dingPrefix");
                            }
                        });
                    }
                }
                else if (child.href.split('/')[3] == 'bundle') {
                    let title = child.children[1].children[0].children[0];
                    if (!title.getAttribute("dingPrefix")) {
                        title.setAttribute("dingPrefix", "dingPrefix");
                        title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                    }
                }
                else if (child.href.split('/')[3] == 'sub') {
                    let title = child.children[1].children[0].children[0];
                    if (!title.getAttribute("dingPrefix")) {
                        title.setAttribute("dingPrefix", "dingPrefix");
                        title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                    }
                }
            }
        });
    }

    const observer = new MutationObserver(callback);

    observer.observe(targetNode, config);
}

//全局。目前主要是global_hover_content.
let targetNode0 = document.querySelector('body');
let config = {
    subtree: true,
    attributes: true,
    childList: true,
    characterData: true
};
let callback0 = mutations => {
    mutations.forEach(mutation => {
        try {
            let global_hover_content = document.getElementById('global_hover_content');
            let children = global_hover_content.children;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                let data = {
                    Id: child.id.slice(10)
                };
                if (!child.getAttribute("dingPost")) {
                    child.setAttribute("dingPost", "dingPost");
                    GM_xmlhttpRequest({
                        method: "POST",
                        url: "https://ddapi.133233.xyz/CheckId",
                        data: JSON.stringify(data),
                        timeout: 20000,
                        responseType: "json",
                        ontimeout: function () {
                            console.log("post request time out");
                        },
                        onload: function (response) {
                            console.log("got response");
                            if (response.response.Data.Id == "0") {
                                child.children[1].innerHTML = "<span style='color:red;'>（未收录）</span>" + child.children[1].innerHTML;
                            }
                            else {
                                child.children[1].innerHTML = "<span style='color:green;'>（已收录）</span>" + child.children[1].innerHTML;
                            }
                            child.setAttribute("dingPrefix","dingPrefix");
                        }
                    });
                }
            }
        }
        catch (e) {
            //exception handle;
        }
    })
}
const observer0 = new MutationObserver(callback0);
observer0.observe(targetNode0, config);
