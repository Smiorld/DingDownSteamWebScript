// ==UserScript==
// @name         叮当公共库收录情况（适配油猴tampermoneky与Steam++）
// @homepage     https://github.com/Smiorld/DingDownSteamWebScript
// @namespace    https://github.com/Smiorld
// @version      1.0.8
// @description  在steam网页中浏览游戏页面时，在标题后追加显示其在叮当公共库的收录情况。
// @author       Smiorld
// @match        https://store.steampowered.com/*
// @match        https://steamcommunity.com/profiles/*
// @match        https://steamcommunity.com/id/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atomicobject.com
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @connect      ddapi.133233.xyz
// @updateURL    https://ddapi.133233.xyz/gh/Smiorld/DingDownSteamWebScript/DingDownSteamWebScript.js
// @downloadURL  https://ddapi.133233.xyz/gh/Smiorld/DingDownSteamWebScript/DingDownSteamWebScript.js
// @require      https://ddapi.133233.xyz/npm/sweetalert2@11.4.11/dist/sweetalert2.all.min.js
// @license MIT
// ==/UserScript==

function DD_xmlhttpRequest(option) {
    if (String(option) !== '[object Object]') return undefined
    option.method = option.method ? option.method.toUpperCase() : 'GET'
    if (option.method === 'GET' && option.data != null && option.data.length > 0) {
        option.url += location.search.length === 0 ? ''.concat('?', option.data) : ''.concat('&', option.data)
    }
    var xhr = new XMLHttpRequest();
    xhr.timeout = option.timeout;
    xhr.responseType = option.responseType || 'text'
    xhr.onerror = option.onerror;
    xhr.ontimeout = option.ontimeout;
    xhr.open(option.method, option.url, true);
    xhr.setRequestHeader('dd_org', window.location.origin);
    if (option.headers) {
        Object.keys(option.headers).forEach(function (key) {
            try {
                xhr.setRequestHeader(key, option.headers[key]);
            } catch { }
        });
    }
    if (option.responseType == 'json') {
        xhr.setRequestHeader('Content-Type', 'application/json; charset=' + document.charset)
    }
    xhr.onload = (e) => {
        //console.log(e)
        if (option.onload && typeof option.onload === 'function') {
            option.onload(e.target)
        }
    };
    xhr.withCredentials = true;
    xhr.send(option.method === 'POST' ? option.data : null)
}

function T2_xmlhttpRequest(option) {
    if (typeof (GM_info) =="object") {
        //tampermoneky userscript
        GM_xmlhttpRequest(option);
    }
    else {
        //steam++ userscript
        DD_xmlhttpRequest(option);
    }
}

function T2Post(url, data, onload) {
    T2_xmlhttpRequest({
        method: "POST",
        url: url,
        data: JSON.stringify(data),
        timeout: 10000,
        responseType: "json",
        ontimeout: function () {
            console.log("post request time out");
        },
        onload: onload
    });
}

function DingDownLoginForm(){
    Swal.fire({
        html: '<div class="swal2-html-container" id="swal2-html-container" style="display: block;">叮当登录</div>'+
            '<input id="swal-input1" class="swal2-input" autocomplete="off" placeholder="叮当账号..." maxlength="16">' +
            '<input id="swal-input2" class="swal2-input" autocomplete="new-password" readonly onfocus="this.removeAttribute(\'readonly\');this.setAttribute(\'type\',\'password\');" onblur="this.readOnly=true;" placeholder="叮当密码..." type="text" maxlength="32">',
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: '登录',
        cancelButtonText: '取消',
        preConfirm: function () {
            return new Promise(function (resolve) {
                // Validate input
                let username=document.getElementById("swal-input1").value;
                let password=document.getElementById("swal-input2").value;
                if (username == '' || password == '' || username.length >16 || password.length >32) {
                    swal.showValidationMessage("请输入有效的用户名和密码"); // Show error when validation fails.
                    swal.enableButtons(); // Enable the confirm button again.
                } else {
                    swal.resetValidationMessage(); // Reset the validation message.
                    resolve([
                        username,
                        password
                    ]);
                }
            })
        },
        didOpen: function () {
            document.getElementById("swal-input1").focus();
            const node = document.getElementById("swal-input2"); //enter key
            node.addEventListener("keyup", function(event) {
                if (event.keyCode === 13 || event.key === "Enter") {
                    swal.clickConfirm();
                }
            });
            node.addEventListener("keydown", function(event) {
                if (event.keyCode === 9 || event.key === "Tab") {
                    swal.clickConfirm();
                }
            });

        }
      })
      .then(function (result) {
          // If validation fails, the value is undefined. Break out here.
          if(typeof(result.value)=='undefined'){
            return false;
          }
          else{
            T2LoginPost(result.value[0],result.value[1]);
          }
      });
}

function DingDownLogout(){
    Swal.fire({
        title: '确定要注销账户吗？',
        text: "确定要注销叮当账户吗？",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: '注销',
        cancelButtonText: '取消'
      }).then((result) => {
        if (result.value) {
            Swal.fire({
                title: '退出中...',
                text: '退出中...(至多等待10s)',
                icon: 'info',
                timer: 10000,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showConfirmButton: false
            });
            T2LogoutPost();
        }
      })
}
function getMonth() {
    return new Date(new Date().getTime()+(parseInt(new Date().getTimezoneOffset()/60) + 8)*3600*1000).getMonth()+1;
}

//get a hex string.   e.g. digestMessage(text).then(result=>{console.log(result)})
async function digestMessage(data,sname,message) {
    const msgUint8 = new TextEncoder().encode(message);                         // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);         // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    data[sname]=hashHex;
    return hashHex;
  }



async function T2LoginPost(username,password){
    //prepare post data
    var UserAgent=window.navigator.userAgent;
    var data = {"Username":username,"Salt":undefined,"Hash":undefined};

    await digestMessage(data,"Salt",''+UserAgent+getMonth());
    await digestMessage(data,"Hash",''+password+data['Salt']);
    Swal.fire({
        title: '登录中...',
        text: '登陆中...(至多等待10秒)',
        timer: 10000,
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false
    })
    .then(function () {
        Swal.fire({
            title:'登录超时，请检查网络后重试',
            icon:'error',
            text:'登录超时，请检查网络后重试',
            confirmButtonText: '确定'
        })
    });
    T2Post(
       'https://ddapi.133233.xyz/AjaxLogin',
        data,
        function (response) {
            if (response.response.Data.Status === 0) {
                //login success
                setCookie('SessionId',response.response.Data.SessionId,30);
                setCookie('NickName',response.response.Data.NickName,30);
                setCookie("Credit",response.response.Data.Credit,30);
                Swal.fire({
                    title: '登录成功',
                    text: '登录成功(2s后自动刷新)',
                    icon: 'success',
                    confirmButtonText: '确定',
                    timer: 2000,
                }).then(function(){window.location.reload();});
                
            }
            else if(response.response.Data.Status === -3){
                //login failed
                Swal.fire({
                    title: '登录失败',
                    text: '用户名或密码错误',
                    icon: 'error',
                    confirmButtonText: '确定'
                }).then(result=>{DingDownLoginForm();});
            }
            else{
                //other failure
                Swal.fire({
                    title: '登录失败',
                    text: response.response.Data.Message,
                    icon: 'error',
                    confirmButtonText: '确定'
                }).then(result=>{DingDownLoginForm();});
            }
        }
    );
}

function T2LogoutPost(){
    var data = {"SessionId":getCookie('SessionId')};
    T2Post(
        'https://ddapi.133233.xyz/AjaxLogOut',
        data,
        function (response) {
            if (response.response.Data.Status === 0) {
                //logout success
                setCookie('SessionId','',-1);
                setCookie('NickName','',-1);
                setCookie("Credit",'',-1);
                Swal.fire({
                    title: '退出成功',
                    text: '退出成功(2s后自动刷新)',
                    icon: 'success',
                    confirmButtonText: '确定',
                    timer: 2000,
                }).then(function(){window.location.reload();});
            }
            else{
                //other failure
                setCookie('SessionId','',-1);
                setCookie('NickName','',-1);
                setCookie("Credit",'',-1);
                Swal.fire({
                    title: '退出失败',
                    text: response.response.Data.Message,
                    icon: 'error',
                    confirmButtonText: '确定',
                    timer: 2000,
                }).then(function(){window.location.reload();});
            }
        }
    );
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


if (document.readyState == "complete" || document.readyState == "loaded" || document.readyState == "interactive") {
    //console.log("Already Loaded");
} else {
    document.addEventListener("DOMContentLoaded", function(event) {
        //console.log("Just Loaded");
        let head = document.getElementsByTagName("head")[0];
        let inject_js_link = head.insertAdjacentHTML("beforeend", '<script src="https://ddapi.133233.xyz/npm/sweetalert2@11.4.11/dist/sweetalert2.all.min.js"></script>');
        let SessionId = getCookie('SessionId');
        if (SessionId === "") {
            let cart_status_data = document.querySelector("#cart_status_data");
            let dingdown_login_a = document.getElementById("dingdown_login_a");
            if (cart_status_data && !dingdown_login_a) {
                cart_status_data.insertAdjacentHTML("beforeend",
                    '<div class="store_header_btn_green store_header_btn" id="dingdown_login">' +
                    '<div class="store_header_btn_caps store_header_btn_leftcap"></div>' +
                    '<div class="store_header_btn_caps store_header_btn_rightcap"></div>' +
                    '<a id="dingdown_login_a" class="store_header_btn_content" href="javascript:void(0);">' +
                    '叮当登录' +
                    '</a>' +
                    '</div>'
                );
            }
            var dingdown_login = document.getElementById("dingdown_login");
            if (dingdown_login) {
                dingdown_login.addEventListener("click", DingDownLoginForm);
            }
        }
        else {
            let cart_status_data = document.querySelector("#cart_status_data");
            let dingdown_logout_a = document.getElementById("dingdown_logout_a");
            if (cart_status_data && !dingdown_logout_a) {
                cart_status_data.insertAdjacentHTML("beforeend",
                    '<div class="store_header_btn_green store_header_btn" id="dingdown_logout">' +
                    '<div class="store_header_btn_caps store_header_btn_leftcap"></div>' +
                    '<div class="store_header_btn_caps store_header_btn_rightcap"></div>' +
                    '<a id="dingdown_logout_a" class="store_header_btn_content" href="javascript:void(0);">' +
                    '注销（叮当昵称：' + getCookie("NickName") + ', 积分：' + getCookie("Credit") + '）' +
                    '</a>' +
                    '</div>'
                );
            }
            var dingdown_logout = document.getElementById("dingdown_logout");
            if (dingdown_logout) {
                dingdown_logout.addEventListener("click", DingDownLogout);
            }
        }
    });
}

window.addEventListener("load", function () {
    //login entry inject 
    let SessionId = getCookie('SessionId');
    if (SessionId === "") {
        let cart_status_data = document.querySelector("#cart_status_data");
        let dingdown_login_a = document.getElementById("dingdown_login_a");
        if (cart_status_data && !dingdown_login_a) {
            cart_status_data.insertAdjacentHTML("beforeend",
                '<div class="store_header_btn_green store_header_btn" id="dingdown_login">' +
                '<div class="store_header_btn_caps store_header_btn_leftcap"></div>' +
                '<div class="store_header_btn_caps store_header_btn_rightcap"></div>' +
                '<a id="dingdown_login_a" class="store_header_btn_content" href="javascript:void(0);">' +
                '叮当登录' +
                '</a>' +
                '</div>'
            );
        }
        var dingdown_login = document.getElementById("dingdown_login");
        if (dingdown_login) {
            dingdown_login.addEventListener("click", DingDownLoginForm);
        }
    }
    else {
        let cart_status_data = document.querySelector("#cart_status_data");
        let dingdown_logout_a = document.getElementById("dingdown_logout_a");
        if (cart_status_data && !dingdown_logout_a) {
            cart_status_data.insertAdjacentHTML("beforeend",
                '<div class="store_header_btn_green store_header_btn" id="dingdown_logout">' +
                '<div class="store_header_btn_caps store_header_btn_leftcap"></div>' +
                '<div class="store_header_btn_caps store_header_btn_rightcap"></div>' +
                '<a id="dingdown_login_out_a" class="store_header_btn_content" href="javascript:void(0);">' +
                '注销（叮当昵称：' + getCookie("NickName") + ', 积分：' + getCookie("Credit") + '）' +
                '</a>' +
                '</div>'
            );
        }
        var dingdown_logout = document.getElementById("dingdown_logout");
        if (dingdown_logout) {
            dingdown_logout.addEventListener("click", DingDownLogout);
        }
    }
    //page initial post
    if (window.location == 'https://store.steampowered.com/') {
        let tab_newreleases_content = document.querySelector('#tab_newreleases_content'); //the box for searching result. each child in it is an <a>.
        let children = tab_newreleases_content.children;

        //restore all appid
        let appid = [];
        let childrenLength = children.length;
        for (let i = 1; i < childrenLength; i++) {
            let tmpchild = children[i];
            if (tmpchild.href.split('/')[3] == 'app') {
                let title = tmpchild.children[2].children[0];
                if (!title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app') {
                    title.setAttribute("dingPost", "dingPost");
                    appid.push(tmpchild.href.split('/')[4]);
                }
            }
        }

        //send post request to server
        if (appid.length != 0) {
            let data = {
                "Ids": appid.join()
            };
            function onload(response){
                console.log("got response for " + response.response.Data.Total + " appid");
                //prefix all titles
                for (let i = 1; i < childrenLength; i++) {
                    let tmpchild = children[i];
                    if (tmpchild.href.split('/')[3] == 'app') {
                        let title = tmpchild.children[2].children[0];
                        let thisid = tmpchild.href.split('/')[4];
                        if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                            if (response.response.Data.AppInfo[thisid]) {
                                title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                            } else {
                                title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                            }
                            appid.splice(appid.indexOf(thisid), 1);
                            title.setAttribute("dingPrefix", "dingPrefix");
                        }
                    } else if (tmpchild.href.split('/')[3] == 'bundle') {
                        let title = tmpchild.children[2].children[0];
                        if (!title.getAttribute("dingPrefix")) {
                            title.setAttribute("dingPrefix", "dingPrefix");
                            title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                        }
                    } else if (tmpchild.href.split('/')[3] == 'sub') {
                        let title = tmpchild.children[2].children[0];
                        if (!title.getAttribute("dingPrefix")) {
                            title.setAttribute("dingPrefix", "dingPrefix");
                            title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                        }
                    }
                }
            }
            T2Post(
                "https://ddapi.133233.xyz/CheckIds",
                data,
                onload
            );
        }
    } else if (window.location.pathname.split('/')[1] == 'wishlist') {
        let wishlist_ctn = document.querySelector('#wishlist_ctn');
        let children = wishlist_ctn.children;
        let appid = [];
        let childrenLength = children.length;
        for (let i = 0; i < childrenLength; i++) {
            let tmpchild = children[i];
            if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'app') {
                let title = tmpchild.children[2].children[0];
                if (!title.getAttribute("dingPost") && title.href.split('/')[3] == 'app') {
                    title.setAttribute("dingPost", "dingPost");
                    appid.push(tmpchild.getAttribute("id").slice(13));
                }
            }
        }
        if (appid.length != 0) {
            let data = {
                "Ids": appid.join()
            };
            T2Post(
                "https://ddapi.133233.xyz/CheckIds",
                data,
                function(response){
                    console.log("got response for " + response.response.Data.Total + " appid");
                    //prefix all titles
                    for (let i = 0; i < childrenLength; i++) {
                        let tmpchild = children[i];
                        if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'app') {
                            let title = tmpchild.querySelector('.content').children[0];
                            let thisid = tmpchild.querySelector('.content').children[0].href.split('/')[4];
                            if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && title.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                if (response.response.Data.AppInfo[thisid]) {
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                } else {
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                }
                                appid.splice(appid.indexOf(thisid), 1);
                                title.setAttribute("dingPrefix", "dingPrefix");
                            }
                        } else if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'bundle') {
                            let title = tmpchild.querySelector('.content').children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                            }
                        } else if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'sub') {
                            let title = tmpchild.querySelector('.content').children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                            }
                        }
                    }
                }
            );
        }

    } else if ((window.location.pathname.split('/')[1] == 'profiles' || window.location.pathname.split('/')[1] == 'id') && window.location.pathname.split('/')[3] == 'games') {
        let games_list_rows = document.querySelector('#games_list_rows');
        let children = games_list_rows.children;
        let appid = [];
        let childrenLength = children.length;
        for (let i = 0; i < childrenLength; i++) {
            let tmpchild = children[i];
            let title = tmpchild.children[1].querySelector('.gameListRowItemTop').children[0].children[0];
            if (!title.getAttribute("dingPost")) {
                title.setAttribute("dingPost", "dingPost");
                appid.push(tmpchild.getAttribute('id').slice(5));
            }
        }
        if (appid.length != 0) {
            let data = {
                "Ids": appid.join()
            };
            T2Post(
                "https://ddapi.133233.xyz/CheckIds",
                data,
                function (response) {
                    console.log("got response for " + response.response.Data.Total + " appid");
                    //prefix all titles
                    for (let i = 0; i < childrenLength; i++) {
                        let tmpchild = children[i];
                        let title = tmpchild.children[1].querySelector('.gameListRowItemTop').children[0].children[0];
                        let thisid = tmpchild.getAttribute('id').slice(5);
                        if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && appid.find(a => a == thisid)) {
                            if (response.response.Data.AppInfo[thisid]) {
                                title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                            } else {
                                title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                            }
                            appid.splice(appid.indexOf(thisid), 1);
                            title.setAttribute("dingPrefix", "dingPrefix");
                        }
                    }
                }
            );
        }

    } else if ((window.location.pathname.split('/')[1] == 'profiles' || window.location.pathname.split('/')[1] == 'id') && window.location.pathname.split('/')[3] == 'followedgames') {
        let games_list_rows = document.querySelector('.games_list_rows');
        let children = games_list_rows.children;
        let appid = [];
        let childrenLength = children.length;
        for (let i = 0; i < childrenLength; i++) {
            let tmpchild = children[i];
            let title = tmpchild.children[1].children[0].children[0];
            if (!title.getAttribute("dingPost")) {
                title.setAttribute("dingPost", "dingPost");
                appid.push(tmpchild.getAttribute('data-appid'));
            }
        }
        if (appid.length != 0) {
            let data = {
                "Ids": appid.join()
            };
            T2Post(
                "https://ddapi.133233.xyz/CheckIds",
                data,
                function (response) {
                    console.log("got response for " + response.response.Data.Total + " appid");
                    //prefix all titles
                    for (let i = 0; i < childrenLength; i++) {
                        let tmpchild = children[i];
                        let title = tmpchild.children[1].children[0].children[0];
                        let thisid = tmpchild.getAttribute('data-appid');
                        if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && appid.find(a => a == thisid)) {
                            if (response.response.Data.AppInfo[thisid]) {
                                title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                            } else {
                                title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                            }
                            appid.splice(appid.indexOf(thisid), 1);
                            title.setAttribute("dingPrefix", "dingPrefix");
                        }
                    }
                }
            );
        }

    } else if (window.location.pathname.split('/')[1] == 'app') {
        let appid=window.location.pathname.split('/')[2];
        let data = {
            Id: appid
        };
        let title = document.getElementById("appHubAppName");
        let is_recorded={"is_recorded":true,"credit":0};
        if (!title.getAttribute("dingPost")) {
            title.setAttribute("dingPost", "dingPost");
            T2Post(
                "https://ddapi.133233.xyz/CheckId",
                data,
                function (response) {
                    console.log("got response");
                    if (response.response.Data.Id == "0") {
                        is_recorded.is_recorded=false;
                        title.innerHTML += " ----- 公共库未收录";
                    } else {
                        is_recorded.is_recorded=true;
                        is_recorded.credit=response.response.Data.Credit;
                        title.innerHTML += " <br> 已收录，提交者：" + response.response.Data.NickName + "，入库时间：" + response.response.Data.Date;
                        let DingDownSubscribeBtn = document.getElementById("dingdown_subscribe");
                    }
                    title.setAttribute("dingPrefix", "dingPrefix");
                }
            );
        }

        //add a button for DingDownload
        if(getCookie("SessionId")){
            //if logged in

            let queueBtnFollow = document.querySelector('#queueBtnFollow');
            let checkSubData = { "SessionId": getCookie("SessionId"), "AppId": appid };
            
            if (queueBtnFollow && is_recorded.is_recorded) {
                // if this page is an app instead of dlc, and someone has shared it.
                T2Post(
                    "https://ddapi.133233.xyz/AjaxCheckSub",
                    checkSubData,
                    function (response) {
                        if (response.response.Data.Status === 0) {
                            //if not subscribed
                            queueBtnFollow.insertAdjacentHTML('beforeend', '<div id="dingdown_subscribe" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_blue_hoverfade btn_medium queue_btn_inactive"  data-tooltip-text="使用叮当订阅此游戏"><span style="color:orange;font-weight: bold;">叮当订阅：-' + is_recorded.credit + '分</span></a></div>');
                            let dingdown_subscribe = document.getElementById("dingdown_subscribe");
                            dingdown_subscribe.addEventListener("click", function () {
                                let subData = { "SessionId": getCookie("SessionId"), "AppId": appid };
                                Swal.fire({
                                    title: '确认订阅？',
                                    text: '订阅后将会消耗' + is_recorded.credit + '分，确认订阅吗？',
                                    type: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: '确认订阅',
                                    cancelButtonText: '取消',
                                })
                                .then(
                                    function (result) {
                                        if (result.value) {
                                            Swal.fire({
                                                title: '订阅中',
                                                text: '正在订阅中，请稍后...(至多等待10s)',
                                                icon: 'info',
                                                timer: 10000,
                                                type: 'info',
                                                allowOutsideClick: false,
                                                allowEscapeKey: false,
                                                allowEnterKey: false,
                                                showConfirmButton: false

                                            });
                                            T2Post(
                                                "https://ddapi.133233.xyz/AjaxSubApp",
                                                subData,
                                                function (response) {
                                                    if (response.response.Data.Status === 0) {
                                                        setCookie("Credit", response.response.Data.Credit, 30);
                                                        Swal.fire({
                                                            title: '订阅成功',
                                                            text: '订阅成功，消耗' + is_recorded.credit + '分',
                                                            type: 'success',
                                                            confirmButtonText: '确定',
            
                                                        }).then(function(){window.location.reload();});
                                                    }
                                                    else if(response.response.Data.Status === -2){
                                                        setCookie("SessionId", "", -1);
                                                        setCookie("Credit", "", -1);
                                                        setCookie("NickName", "", -1);
                                                        Swal.fire({
                                                            title: '订阅失败',
                                                            text: response.response.Data.Message,
                                                            type: 'error',
                                                            confirmButtonText: '确定',
            
                                                        }).then(function(){window.location.reload();});
                                                    }
                                                    else
                                                    {
                                                        Swal.fire({
                                                            title: '订阅失败',
                                                            text: '订阅失败，'+response.response.Data.Message,
                                                            type: 'error',
                                                            confirmButtonText: '确定',
            
                                                        }).then(function(){window.location.reload();});
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                                
                            });
                        }
                        else if (response.response.Data.Status === 1) {
                            //if subscribed
                            queueBtnFollow.insertAdjacentHTML('beforeend', '<div id="dingdown_download" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_blue_hoverfade btn_medium queue_btn_inactive"  data-tooltip-text="使用叮当下载此游戏"><span style="color:orange;font-weight: bold;">叮当下载</span></a></div>');
                        }
                        else if (response.response.Data.Status === -2) {
                            //if not logged in
                            setCookie("SessionId", "", -1);
                            setCookie("Credit", "", -1);
                            setCookie("NickName", "", -1);
                            Swal.fire({
                                title: '您还没有登录，请先登录',
                                text: response.response.Data.Message,
                                icon: 'error',
                                confirmButtonText: '确定',
                                timer: 2000,
                            }).then(function(){window.location.reload();});
                        }
                        else{
                            console.log("Error: " + response.response.Data.Status+", Message:"+response.response.Data.Message);
                        }
                    }
                );
            }

        }

    } else if (window.location.pathname.split('/')[1] == 'search') {
        let tmp_script = document.querySelector('#responsive_page_template_content').children[0].innerHTML;
        let position = tmp_script.search(/"infiniscroll"/);
        let infiniscroll = tmp_script[position + 15]; //为0时没有无限下滚，为1时有。这个决定了整个页面变化的div如何定位。经过实测，如果无限下滚，则不需要onload的时候触发一次。
        if (infiniscroll == 0) {
            let searching_result = document.querySelector('#search_resultsRows'); //the box for searching result. each child in it is an <a>.
            let children = searching_result.children;

            //restore all appid
            let appid = [];
            let childrenLength = children.length;
            for (let i = 0; i < childrenLength; i++) {
                let tmpchild = children[i];
                if (tmpchild.href.split('/')[3] == 'app') {
                    let title = tmpchild.children[1].children[0].children[0];
                    if (!title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app') {
                        title.setAttribute("dingPost", "dingPost");
                        appid.push(tmpchild.href.split('/')[4]);
                    }
                }
            }
            //send post request to server
            if (appid.length != 0) {
                let data = {
                    "Ids": appid.join()
                };
                T2Post(
                    "https://ddapi.133233.xyz/CheckIds",
                    data,
                    function (response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i];
                            if (tmpchild.href.split('/')[3] == 'app') {
                                let title = tmpchild.children[1].children[0].children[0];
                                let thisid = tmpchild.href.split('/')[4];
                                if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                    if (response.response.Data.AppInfo[thisid]) {
                                        title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                    } else {
                                        title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                    }
                                    appid.splice(appid.indexOf(thisid), 1);
                                    title.setAttribute("dingPrefix", "dingPrefix");
                                }
                            } else if (tmpchild.href.split('/')[3] == 'bundle') {
                                let title = tmpchild.children[1].children[0].children[0];
                                if (!title.getAttribute("dingPrefix")) {
                                    title.setAttribute("dingPrefix", "dingPrefix");
                                    title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                                }
                            } else if (tmpchild.href.split('/')[3] == 'sub') {
                                let title = tmpchild.children[1].children[0].children[0];
                                if (!title.getAttribute("dingPrefix")) {
                                    title.setAttribute("dingPrefix", "dingPrefix");
                                    title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                                }
                            }
                        }
                    }
                );
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
        let appid = [];
        let childrenLength = children.length;
        for (let i = 1; i < childrenLength; i++) {
            let tmpchild = children[i];
            if (tmpchild.href.split('/')[3] == 'app') {
                let title = tmpchild.children[2].children[0];
                if (!title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app') {
                    title.setAttribute("dingPost", "dingPost");
                    appid.push(tmpchild.href.split('/')[4]);
                }
            }
        }

        //send post request to server
        if (appid.length != 0) {
            let data = {
                "Ids": appid.join()
            };
            T2Post(
                "https://ddapi.133233.xyz/CheckIds",
                data,
                function (response) {
                    console.log("got response for " + response.response.Data.Total + " appid");
                    //prefix all titles
                    for (let i = 1; i < childrenLength; i++) {
                        let tmpchild = children[i];
                        if (tmpchild.href.split('/')[3] == 'app') {
                            let title = tmpchild.children[2].children[0];
                            let thisid = tmpchild.href.split('/')[4];
                            if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                if (response.response.Data.AppInfo[thisid]) {
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                } else {
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                }
                                appid.splice(appid.indexOf(thisid), 1);
                                title.setAttribute("dingPrefix", "dingPrefix");
                            }
                        } else if (tmpchild.href.split('/')[3] == 'bundle') {
                            let title = tmpchild.children[2].children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                            }
                        } else if (tmpchild.href.split('/')[3] == 'sub') {
                            let title = tmpchild.children[2].children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                            }
                        }
                    }
                }
            );
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
                        T2Post(
                            "https://ddapi.133233.xyz/CheckId",
                            data,
                            function (response) {
                                console.log("got response");
                                if (response.response.Data.Id == "0") {
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                } else {
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                }
                                title.setAttribute("dingPrefix", "dingPrefix");
                            }
                        );
                    }
                } else if (child.href.split('/')[3] == 'bundle') {
                    let title = child.children[1].children[0].children[0];
                    if (!title.getAttribute("dingPrefix")) {
                        title.setAttribute("dingPrefix", "dingPrefix");
                        title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                    }
                } else if (child.href.split('/')[3] == 'sub') {
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

//愿望单
else if (window.location.pathname.split('/')[1] == 'wishlist') {
    let targetNode1 = document.querySelector('#filters_container');
    let targetNode2 = document.querySelector('#wishlist_ctn')
    let config = {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true
    };

    let callback1 = mutations => {
        let wishlist = document.querySelector('#wishlist_ctn')
        let children = wishlist.children;
        //restore all appid
        let appid = [];
        let childrenLength = children.length;
        for (let i = 0; i < childrenLength; i++) {
            let tmpchild = children[i];
            if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'app') {
                let title = tmpchild.querySelector('.content').children[0];
                if (!title.getAttribute("dingPost") && title.href.split('/')[3] == 'app') {
                    title.setAttribute("dingPost", "dingPost");
                    appid.push(tmpchild.getAttribute("id").slice(13));
                }
            }
        }
        if (appid.length != 0) {
            let data = {
                "Ids": appid.join()
            };
            T2Post(
                "https://ddapi.133233.xyz/CheckIds",
                data,
                function (response) {
                    console.log("got response for " + response.response.Data.Total + " appid");
                    //prefix all titles
                    for (let i = 0; i < childrenLength; i++) {
                        let tmpchild = children[i];
                        if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'app') {
                            let title = tmpchild.querySelector('.content').children[0];
                            let thisid = tmpchild.querySelector('.content').children[0].href.split('/')[4];
                            if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && title.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                if (response.response.Data.AppInfo[thisid]) {
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                } else {
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                }
                                appid.splice(appid.indexOf(thisid), 1);
                                title.setAttribute("dingPrefix", "dingPrefix");
                            }
                        } else if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'bundle') {
                            let title = tmpchild.querySelector('.content').children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                            }
                        } else if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'sub') {
                            let title = tmpchild.querySelector('.content').children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（礼包）</span>" + title.innerHTML;
                            }
                        }
                    }
                }
            );
        }

    }

    const observer1 = new MutationObserver(callback1);
    observer1.observe(targetNode1, config);
    observer1.observe(targetNode2, config);
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
                if (child.id.slice(6, 9) == "app") {
                    let data = {
                        Id: child.id.slice(10)
                    };
                    if (!child.getAttribute("dingPost")) {
                        child.setAttribute("dingPost", "dingPost");
                        T2Post(
                            "https://ddapi.133233.xyz/CheckId",
                            data,
                            function (response) {
                                console.log("got response");
                                if (response.response.Data.Id == "0") {
                                    child.children[1].innerHTML = "<span style='color:red;'>（未收录）</span>" + child.children[1].innerHTML;
                                } else {
                                    child.children[1].innerHTML = "<span style='color:green;'>（已收录）</span>" + child.children[1].innerHTML;
                                }
                                child.setAttribute("dingPrefix", "dingPrefix");
                            }
                        );
                    }
                } else if (child.id.slice(6, 12) == "bundle") {
                    if (!child.getAttribute("dingPost")) {
                        child.setAttribute("dingPost", "dingPost");
                        child.children[1].innerHTML = "<span style='color:orange;'>（合集）</span>" + child.children[1].innerHTML;
                        child.setAttribute("dingPrefix", "dingPrefix");
                    }
                } else if (child.id.slice(6, 9) == "sub") {
                    if (!child.getAttribute("dingPost")) {
                        child.setAttribute("dingPost", "dingPost");
                        child.children[1].innerHTML = "<span style='color:orange;'>（礼包）</span>" + child.children[1].innerHTML;
                        child.setAttribute("dingPrefix", "dingPrefix");
                    }
                }
            }
        } catch (e) {
            //exception handle;
        }
    })
}
const observer0 = new MutationObserver(callback0);
observer0.observe(targetNode0, config);
