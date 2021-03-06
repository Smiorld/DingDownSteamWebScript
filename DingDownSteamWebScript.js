// ==UserScript==
// @name         叮当公共库收录情况（适配油猴tampermoneky与Steam++）
// @homepage     https://github.com/Smiorld/DingDownSteamWebScript
// @namespace    https://github.com/Smiorld
// @version      1.0.18
// @description  在steam网页中浏览游戏页面时，在标题后追加显示其在叮当公共库的收录情况。
// @author       Smiorld
// @match        https://store.steampowered.com/*
// @match        https://steamcommunity.com/*
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

function DingDownLoginForm(callback,username,password){
    //如果网络问题重试,则无需再次输入账号密码. @Ding
    Swal.fire({
        html: '<div class="swal2-html-container" id="swal2-html-container" style="display: block;">叮当登录</div>'+
            '<input id="swal-input1" class="swal2-input" autocomplete="off" placeholder="叮当账号..." maxlength="16" value="'+ (typeof username !== 'undefined' ? username : '') +'">' +
            '<input id="swal-input2" class="swal2-input" autocomplete="new-password" readonly onfocus="this.removeAttribute(\'readonly\');this.setAttribute(\'type\',\'password\');" onblur="this.readOnly=true;" placeholder="叮当密码..." maxlength="32" value="'+ (typeof password !== 'undefined' ? password+' "type="password"' : '" type="text"') +'>',
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: '登录',
        cancelButtonText: '取消',
        preConfirm: function () {
            return new Promise(function (resolve) {
                // Validate input
                if (!username && typeof username === 'undefined'){
                    username=document.getElementById("swal-input1").value;
                }
                if (!password && typeof password === 'undefined'){
                    password=document.getElementById("swal-input2").value;
                }
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
                let CkVal  = document.getElementById("swal-input2").value;
                if (CkVal && CkVal !== "" && (event.keyCode === 9 || event.key === "Tab")) {
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
    let timerInterval
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
                //text: '退出中...(至多等待10s)',
                html: '尝试注销中,等待倒计时 <b></b> 毫秒.',
                icon: 'question',
                timer: 10000,
                timerProgressBar: true,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showConfirmButton: false,
                didOpen: () => {
                Swal.showLoading()
                const b = Swal.getHtmlContainer().querySelector('b')
                timerInterval = setInterval(() => {
                  b.textContent = Swal.getTimerLeft()
                }, 100)
              },
              willClose: () => {
                clearInterval(timerInterval);
              }
            })
            .then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    Swal.fire({
                        title:'注销超时，请检查网络后重试',
                        icon:'error',
                        text:'注销超时，请检查网络后重试',
                        confirmButtonText: '确定'
                    });
                }
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
    //增加倒计时 @Ding
    let timerInterval
    Swal.fire({
        title: '登录中...',
        html: '尝试登陆中,等待倒计时 <b></b> 毫秒.',
        timer: 10000,
        icon: 'question',
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading()
            const b = Swal.getHtmlContainer().querySelector('b')
            timerInterval = setInterval(() => {
              b.textContent = Swal.getTimerLeft()
            }, 100)
          },
          willClose: () => {
            clearInterval(timerInterval);
          }
    })
    .then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
            Swal.fire({
                title:'登录超时，请检查网络后重试',
                icon:'error',
                text:'登录超时，请检查网络后重试',
                confirmButtonText: '确定'
            }).then(result=>{DingDownLoginForm(result,username,password);});
        }
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
        head.insertAdjacentHTML("beforeend", '<script src="https://ddapi.133233.xyz/npm/sweetalert2@11.4.11/dist/sweetalert2.all.min.js"></script>');
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

//is script running on a third-party web browser or steam client?
function isWebBrowser(){
    let logo=document.querySelector("#logo_holder");
    if(logo){
        return true;
    }
    else{
        return false;
    }
}

function addStyle(styleString) {
    const style = document.createElement('style');
    style.textContent = styleString;
    document.head.append(style);
}

window.addEventListener("load", function () {
    //login entry inject 
    let SessionId = getCookie('SessionId');
    if (SessionId === "") {
        let cart_status_data = document.querySelector("#cart_status_data");
        let dingdown_login_a = document.getElementById("dingdown_login_a");
        if (cart_status_data && !dingdown_login_a) {
            cart_status_data.insertAdjacentHTML("beforeend",
                '<div class="store_header_btn_green store_header_btn" id="dingdown_login" >' +
                '<div class="store_header_btn_caps store_header_btn_leftcap"></div>' +
                '<div class="store_header_btn_caps store_header_btn_rightcap"></div>' +
                '<a id="dingdown_login_a" class="store_header_btn_content" href="javascript:void(0);">' +
                '叮当登录' +
                '</a>' +
                '</div>'
            );
        }
        const dingdown_login = document.getElementById("dingdown_login");
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
        const dingdown_logout = document.getElementById("dingdown_logout");
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
                            if (response.response.Data.AppInfo.find(a=>a==thisid)) {
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
                                if (response.response.Data.AppInfo.find(a=>a==thisid)) {
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
                            if (response.response.Data.AppInfo.find(a=>a==thisid)) {
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
                            if (response.response.Data.AppInfo.find(a=>a==thisid)) {
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
        if (!title.getAttribute("dingPost")) {
            title.setAttribute("dingPost", "dingPost");
            T2Post(
                "https://ddapi.133233.xyz/CheckId",
                data,
                function (response) {
                    console.log("got response");
                    var CheckIdResponse = {'is_recorded':null,'sharer':null};
                    if (response.response.Data.Id == "0") {
                        CheckIdResponse = {'is_recorded':false,'sharer':null};
                        title.innerHTML += " ----- 公共库未收录";
                    } else {
                        let NickName=response.response.Data.NickName;
                        if (!NickName || NickName.length === 0 || NickName === ""){
                            NickName = "系统/匿名";
                        }
                        CheckIdResponse = {'is_recorded':true,'sharer':NickName};
                        title.innerHTML += " <br> 已收录，提交者：" + NickName + "，入库时间：" + response.response.Data.Date;
                    }
                    title.setAttribute("dingPrefix", "dingPrefix");
                    //only if the response is received, then add subscribe/download button.

                    //自己提交的(判断CheckId返回的昵称?)/免费游戏/分享者为“系统/匿名”/未收录的,不再请求CheckSub 
                    //add a button for DingDownloadcost_credit
                    if (getCookie("SessionId")) {
                        //if logged in
                        let queueBtnFollow = document.querySelector('#queueBtnFollow');
                        let checkSubData = { "SessionId": getCookie("SessionId"), "AppId": appid };

                        if (queueBtnFollow) {
                            // if this page is an app instead of dlc
                            const freeGameBtn = document.querySelector('#freeGameBtn');// is this a free game?
                            if (CheckIdResponse.is_recorded ===true && CheckIdResponse.sharer!==getCookie("NickName") && !freeGameBtn && CheckIdResponse.sharer!=="系统/匿名") {
                                //only if the game is recorded 
                                //and the sharer is not the current user 
                                //and the game is not free.
                                //and the sharer is not "系统/匿名"
                                T2Post(
                                    "https://ddapi.133233.xyz/AjaxCheckSub",
                                    checkSubData,
                                    function (response) {
                                        if (response.response.Data.Credit) {
                                            setCookie("Credit", response.response.Data.Credit, 30);
                                        }
                                        if (response.response.Data.Status > 0) {
                                            //if not subscribed
                                            let cost_credit = response.response.Data.Status;
                                            queueBtnFollow.insertAdjacentHTML('beforeend', '<div id="dingdown_subscribe" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当订阅此游戏"><span>叮当订阅：-' + cost_credit + '分</span></a></div>');
                                            let dingdown_subscribe = document.getElementById("dingdown_subscribe");
                                            dingdown_subscribe.addEventListener("click", function () {
                                                let subData = { "SessionId": getCookie("SessionId"), "AppId": appid };
                                                Swal.fire({
                                                    title: '确认订阅？',
                                                    text: '订阅后将会消耗' + cost_credit + '分，确认订阅吗？',
                                                    type: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonText: '确认订阅',
                                                    cancelButtonText: '取消',
                                                })
                                                    .then(
                                                        function (result) {
                                                            if (result.value) {
                                                                Swal.fire({
                                                                    title: '订阅中...',
                                                                    html: '尝试订阅中,等待倒计时 <b></b> 毫秒.',
                                                                    icon: 'question',
                                                                    timer: 10000,
                                                                    timerProgressBar: true,
                                                                    allowOutsideClick: false,
                                                                    allowEscapeKey: false,
                                                                    allowEnterKey: false,
                                                                    showConfirmButton: false,
                                                                    didOpen: () => {
                                                                    Swal.showLoading()
                                                                    const b = Swal.getHtmlContainer().querySelector('b')
                                                                    timerInterval = setInterval(() => {
                                                                    b.textContent = Swal.getTimerLeft()
                                                                    }, 100)
                                                                },
                                                                willClose: () => {
                                                                    clearInterval(timerInterval);
                                                                }
                                                                })
                                                                .then((result) => {
                                                                    if (result.dismiss === Swal.DismissReason.timer) {
                                                                        Swal.fire({
                                                                            title:'订阅超时，请检查网络后重试',
                                                                            icon:'error',
                                                                            text:'订阅超时，请检查网络后重试',
                                                                            confirmButtonText: '确定'
                                                                        });
                                                                    }
                                                                });
                                                                T2Post(
                                                                    "https://ddapi.133233.xyz/AjaxSubApp",
                                                                    subData,
                                                                    function (response) {
                                                                        if (response.response.Data.Status === 0) {
                                                                            if (response.response.Data.Credit !== 2147483647) {
                                                                                setCookie("Credit", response.response.Data.Credit, 30);                                                                             
                                                                            }
                                                                            Swal.fire({
                                                                                title: '订阅成功',
                                                                                text: '订阅成功，剩余' + getCookie('Credit') + '分',
                                                                                type: 'success',
                                                                                confirmButtonText: '确定',

                                                                            }).then(function () { window.location.reload(); });
                                                                            
                                                                        }
                                                                        else if (response.response.Data.Status === -2) {
                                                                            setCookie("SessionId", "", -1);
                                                                            setCookie("Credit", "", -1);
                                                                            setCookie("NickName", "", -1);
                                                                            Swal.fire({
                                                                                title: '订阅失败',
                                                                                text: response.response.Data.Message,
                                                                                type: 'error',
                                                                                confirmButtonText: '确定',

                                                                            }).then(function () { window.location.reload(); });
                                                                        }
                                                                        else {
                                                                            Swal.fire({
                                                                                title: '订阅失败',
                                                                                text: '订阅失败，' + response.response.Data.Message,
                                                                                type: 'error',
                                                                                confirmButtonText: '确定',

                                                                            }).then(function () { window.location.reload(); });
                                                                        }
                                                                    }
                                                                );
                                                            }
                                                        }
                                                    );

                                            });
                                        }
                                        else if (response.response.Data.Status === 0) {
                                            //0 this game hasn't been recorded yet
                                            //do nothing so far
                                        }
                                        else if(response.response.Data.Status === -200){
                                            //-200 this is a dlc and is recorded.
                                            //do nothing so far
                                        }
                                        else if (response.response.Data.Status === -20 || response.response.Data.Status === -30 || response.response.Data.Status === -100) {
                                            //-20 the user is the sharer. -30 the user has subscribed. -100 the game is free or recorded by anonymous users. All means the user do not need to pay credit for this game.
                                            queueBtnFollow.insertAdjacentHTML('beforeend', '<div id="dingdown_download" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当软件下载&启动游戏"><span>叮当试玩</span></a></div>');
                                            const dingdown_download = document.getElementById("dingdown_download");
                                            dingdown_download.addEventListener("click", function () {
                                                if (isWebBrowser()) {
                                                    window.open("ding://install/" + appid);
                                                }
                                                else {
                                                    window.open("steam://openurl_external/https://ddapi.133233.xyz/install/" + appid);
                                                }
                                            });
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
                                            }).then(function () { window.location.reload(); });
                                        }
                                        else {
                                            console.log("error" + response.response.Data.Status + ',' + response.response.Data.Message);
                                        }
                                    }
                                );
                            }
                            else if(CheckIdResponse.is_recorded ===false ){
                                //not recorded, 
                                //未收录的判断网页内容是否有启动steam,有的话证明可入库.
                                const game_area_already_owned = document.getElementsByClassName("game_area_already_owned");
                                if (game_area_already_owned) {
                                    //add a share button TODO
                                }
                            }
                            else if(CheckIdResponse.sharer===getCookie("NickName") || freeGameBtn || CheckIdResponse.sharer==="系统/匿名"){
                                //user can download this game
                                queueBtnFollow.insertAdjacentHTML('beforeend', '<div id="dingdown_download" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当软件下载&启动游戏"><span>叮当试玩</span></a></div>');
                                const dingdown_download = document.getElementById("dingdown_download");
                                dingdown_download.addEventListener("click", function () {
                                    if (isWebBrowser()) {
                                        window.open("ding://install/" + appid);
                                    }
                                    else {
                                        window.open("steam://openurl_external/https://ddapi.133233.xyz/install/" + appid);
                                    }
                                });
                            }
                        } else{
                            //if dlc
                            const game_area_dlc_bubble = document.querySelector(".game_area_dlc_bubble");
                            let game_appid;
                            if (game_area_dlc_bubble) {
                                game_appid = game_area_dlc_bubble.children[0].children[1].children[0].href.split('/')[4];
                            }
                            //if this dlc is not recorded: do nothing
                            if(CheckIdResponse.is_recorded===true){
                            //check parent game
                                T2Post(
                                    "https://ddapi.133233.xyz/AjaxCheckSub",
                                    {"SessionId":getCookie("SessionId"),"AppId": game_appid},
                                    function (response) {
                                        if (response.response.Data.Credit) {
                                            setCookie("Credit", response.response.Data.Credit, 30);
                                        }
                                        if (response.response.Data.Status > 0) {
                                            //if not subscribed
                                            //请先叮当订阅游戏本体
                                            const ignoreBtn = document.querySelector("#ignoreBtn");
                                            if (ignoreBtn) {
                                                ignoreBtn.insertAdjacentHTML("beforebegin",'<div id="queueBtnFollow" class="queue_control_button queue_btn_follow" style="flex-grow: 0;"><div id="dingdown_need_game_subscribed" class="queue_control_button" style="flex-grow: 0;"><a href="http://store.steampowered.com/app/'+game_appid+'" class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="请在使用叮当订阅dlc前先订阅游戏本体"><span>请先叮当订阅本体（点击跳转本体）</span></a></div></div>')
                                            }
                                        }
                                        else if (response.response.Data.Status === 0) {
                                            //0 this game hasn't been recorded yet
                                            const ignoreBtn = document.querySelector("#ignoreBtn");
                                            if (ignoreBtn) {
                                                ignoreBtn.insertAdjacentHTML("beforebegin",'<div id="queueBtnFollow" class="queue_control_button queue_btn_follow" style="flex-grow: 0;"><div id="dingdown_need_game_recorded" class="queue_control_button" style="flex-grow: 0;"><a href="http://store.steampowered.com/app/'+game_appid+'" class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="本地未收录，无法订阅本dlc"><span>叮当尚未收录本体（点击跳转本体）</span></a></div></div>')
                                            }
                                        }
                                        else if(response.response.Data.Status === -200){
                                            //-200 this is a dlc and is recorded.
                                            //this condition is not needed. no dlc's parent is another dlc.
                                        }
                                        else if (response.response.Data.Status === -20 || response.response.Data.Status === -30 || response.response.Data.Status === -100) {
                                            //-20 the user is the sharer. -30 the user has subscribed. -100 the game is free or recorded by anonymous users. All means the user do not need to pay credit for this game.
                                            const ignoreBtn = document.querySelector("#ignoreBtn");
                                            console.log(ignoreBtn);
                                            if (ignoreBtn) {
                                                ignoreBtn.insertAdjacentHTML("beforebegin",'<div id="queueBtnFollow" class="queue_control_button queue_btn_follow" style="flex-grow: 0;"><div id="dingdown_download" class="queue_control_button" style="flex-grow: 0;"><a href="javascript:void(0);" class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当软件下载本dlc"><span>叮当试玩</span></a></div></div>')
                                                const dingdown_download = document.getElementById("dingdown_download");
                                                dingdown_download.addEventListener("click", function () {
                                                    if (isWebBrowser()) {
                                                        window.open("ding://install/" + appid);
                                                    }
                                                    else {
                                                        window.open("steam://openurl_external/https://ddapi.133233.xyz/install/" + appid);
                                                    }
                                                });
                                            }
                                
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
                                            }).then(function () { window.location.reload(); });
                                        }
                                        else {
                                            console.log("error" + response.response.Data.Status + ',' + response.response.Data.Message);
                                        }
                                    }
                                )
                            }
                        }

                    }


                }
            );
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
                                    if (response.response.Data.AppInfo.find(a=>a==thisid)) {
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
    } else if ( (window.location.pathname.split('/')[1] == 'workshop'|| window.location.pathname.split('/')[1] == 'sharedfiles') && window.location.pathname.split('/')[2]=='filedetails'){
        //if the page is workshop/filedetails
        const SubscribeItemBtn = document.querySelector('#SubscribeItemBtn');
        if(SubscribeItemBtn){
            //console.log("is_mod");
            let modid = window.location.href.split('/')[5].slice(4);
            let appid = document.querySelector('[name="appid"]').value;

            //same logic as showing dingdownload button
            if(getCookie("SessionId")){
                T2Post(
                    "https://ddapi.133233.xyz/CheckId",
                    {"Id" : appid},
                    function (response) {
                        console.log("got response");
                        var CheckIdResponse = {'is_recorded':null,'sharer':null};
                        if (response.response.Data.Id == "0") {
                            CheckIdResponse = {'is_recorded':false,'sharer':null};
                        } else {
                            let NickName=response.response.Data.NickName;
                            if (!NickName || NickName.length === 0 || NickName === ""){
                                NickName = "系统/匿名";
                            }
                            CheckIdResponse = {'is_recorded':true,'sharer':NickName};
                        }
    
                        //无需请求的情况下,不再请求CheckSub 
                        //可以叮当下载的前提下，显示叮当订阅按钮，否则显示未订阅游戏信息
                        let queueBtnFollow = document.querySelector('#queueBtnFollow');
                        let checkSubData = { "SessionId": getCookie("SessionId"), "AppId": appid };

                        const freeGameBtn = document.querySelector('#freeGameBtn');// is this a free game?
                        if (CheckIdResponse.is_recorded === true && CheckIdResponse.sharer !== getCookie("NickName") && !freeGameBtn && CheckIdResponse.sharer !== "系统/匿名") {
                            //if the game is recorded 
                            //and the sharer is not the current user 
                            //and the game is not free.
                            //and the sharer is not "系统/匿名"
                            T2Post(
                                "https://ddapi.133233.xyz/AjaxCheckSub",
                                checkSubData,
                                function (response) {
                                    if (response.response.Data.Credit) {
                                        setCookie("Credit", response.response.Data.Credit, 30);
                                    }
                                    if (response.response.Data.Status > 0) {
                                        //if not subscribed
                                        //show information tell the user that he needs to subscribe the game first
                                        SubscribeItemBtn.parentElement.insertAdjacentHTML('beforeend',
                                            '<a id="DingDownUnsubscribeModBtn" style="position: relative;" class="btnv6_lightblue_blue btn_border_2px btn_medium ">' +
                                            '    <div class="subscribeIcon"></div>' +
                                            '    <span class="subscribeText">' +
                                            '        叮当订阅需已订阅游戏本体！' +
                                            '    </span>' +
                                            '</a>'
                                        );

                                    }
                                    else if (response.response.Data.Status === 0 || response.response.Data.Status === -200) {
                                        //0 this game hasn't been recorded yet, -200 this is not game but dlc
                                        //do nothing so far
                                    }
                                    else if (response.response.Data.Status === -20 || response.response.Data.Status === -30 || response.response.Data.Status === -100) {
                                        //-20 the user is the sharer. -30 the user has subscribed. -100 the game is free or recorded by anonymous users. 
                                        //All means the user do not need to pay credit for this game.
                                        SubscribeItemBtn.parentElement.insertAdjacentHTML('beforeend',
                                            '<a id="DingDownSubscribeModBtn" style="position: relative;" class="btnv6_lightblue_blue btn_border_2px btn_medium ">' +
                                            '    <div class="subscribeIcon"></div>' +
                                            '    <span class="subscribeText">' +
                                            '        叮当订阅' +
                                            '    </span>' +
                                            '</a>'
                                        );
                                        const DingDownSubscribeModBtn = document.querySelector('#DingDownSubscribeModBtn');
                                        DingDownSubscribeModBtn.addEventListener('click', function () {
                                            if(isWebBrowser()){
                                                window.open("ding://install/"+appid+"/"+modid);
                                            }
                                            else{
                                                window.open("steam://openurl_external/https://ddapi.133233.xyz/install/"+appid+"/"+modid);
                                            }
                                        });
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
                                        }).then(function () { window.location.reload(); });
                                    }
                                    else {
                                        console.log("error" + response.response.Data.Status + ',' + response.response.Data.Message);
                                    }
                                }
                            );
                        }
                        else if (CheckIdResponse.is_recorded === false) {
                            //not recorded, 
                            //do nothing
                        }
                        else if (CheckIdResponse.sharer === getCookie("NickName") || freeGameBtn || CheckIdResponse.sharer === "系统/匿名") {
                            //user can download this game
                            SubscribeItemBtn.parentElement.insertAdjacentHTML('beforeend',
                                '<a id="DingDownSubscribeModBtn" style="position: relative;" class="btnv6_lightblue_blue btn_border_2px btn_medium ">' +
                                '    <div class="subscribeIcon"></div>' +
                                '    <span class="subscribeText">' +
                                '        叮当订阅' +
                                '    </span>' +
                                '</a>'
                            );
                            const DingDownSubscribeModBtn = document.querySelector('#DingDownSubscribeModBtn');
                            DingDownSubscribeModBtn.addEventListener('click', function () {
                                if (isWebBrowser()) {
                                    window.open("ding://install/" + appid + "/" + modid);
                                }
                                else {
                                    window.open("steam://openurl_external/https://ddapi.133233.xyz/install/" + appid + "/" + modid);
                                }
                            });
                        }
    
    
    
                    }
                );
            } else {
                //if not loged in
                //show login button
                SubscribeItemBtn.parentElement.insertAdjacentHTML('beforeend',
                    '<a id="dingdown_login" style="position: relative;" class="btnv6_lightblue_blue btn_border_2px btn_medium ">' +
                    '    <span class="subscribeText">' +
                    '        叮当登录' +
                    '    </span>' +
                    '</a>'
                );
                const dingdown_login = document.getElementById("dingdown_login");
                if (dingdown_login) {
                    dingdown_login.addEventListener("click", DingDownLoginForm);
                }
            }

            

        }
        else{
            //console.log("not_mod")
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
                                if (response.response.Data.AppInfo.find(a=>a==thisid)) {
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
                                if (response.response.Data.AppInfo.find(a=>a==thisid)) {
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