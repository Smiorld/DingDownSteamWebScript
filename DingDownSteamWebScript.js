// ==UserScript==
// @name         叮当公共库收录情况（适配油猴tampermoneky与Steam++）
// @homepage     https://github.com/Smiorld/DingDownSteamWebScript
// @namespace    https://github.com/Smiorld
// @version      1.0.48
// @description  在steam网页中浏览游戏页面时，在标题后追加显示其在叮当公共库的收录情况。
// @author       Smiorld
// @match        https://store.steampowered.com/*
// @match        https://steamdb.info/*
// @match        https://steamcommunity.com/*
// @icon         https://gcore.jsdelivr.net/gh/Smiorld/DingDownSteamWebScript@latest/Project.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @connect      ddapi.133233.xyz
// @updateURL    https://gcore.jsdelivr.net/gh/Smiorld/DingDownSteamWebScript@latest/DingDownSteamWebScript.js
// @downloadURL  https://gcore.jsdelivr.net/gh/Smiorld/DingDownSteamWebScript@latest/DingDownSteamWebScript.js
// @require      https://gcore.jsdelivr.net/npm/sweetalert2@11.4.38/dist/sweetalert2.all.min.js
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
        Object.keys(option.headers).forEach(function(key) {
            try {
                xhr.setRequestHeader(key, option.headers[key]);
            } catch {}
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

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str));
}

function UnicodeDecodeB64(str) {
    return decodeURIComponent(atob(str));
}

function T2_xmlhttpRequest(option) {
    if (typeof(GM_info) == "object") {
        //tampermoneky userscript
        GM_xmlhttpRequest(option);
    } else {
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
        ontimeout: function() {
            console.log("post request time out");
        },
        onload: onload
    });
}

function DingDownLoginForm(callback, username, password) {
    //如果网络问题重试,则无需再次输入账号密码. @Ding
    Swal.fire({
        html: '<div class="swal2-html-container" id="swal2-html-container" style="display: block;">叮当登录</div>' +
        '<input id="swal-input1" class="swal2-input" autocomplete="off" placeholder="叮当账号..." maxlength="16" value="' + (typeof username !== 'undefined' ? username : '') + '">' +
        '<input id="swal-input2" class="swal2-input" autocomplete="new-password" readonly onfocus="this.removeAttribute(\'readonly\');this.setAttribute(\'type\',\'password\');" onblur="this.readOnly=true;" placeholder="叮当密码..." maxlength="32" value="' + (typeof password !== 'undefined' ? password + ' "type="password"' : '" type="text"') + '>',
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: '登录',
        cancelButtonText: '取消',
        preConfirm: function() {
            return new Promise(function(resolve) {
                // Validate input
                if (!username && typeof username === 'undefined') {
                    username = document.getElementById("swal-input1").value;
                }
                if (!password && typeof password === 'undefined') {
                    password = document.getElementById("swal-input2").value;
                }
                if (username == '' || password == '' || username.length > 16 || password.length > 32) {
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
        didOpen: function() {
            document.getElementById("swal-input1").focus();
            const node = document.getElementById("swal-input2"); //enter key
            node.addEventListener("keyup", function(event) {
                if (event.keyCode === 13 || event.key === "Enter") {
                    swal.clickConfirm();
                }
            });
            node.addEventListener("keydown", function(event) {
                let CkVal = document.getElementById("swal-input2").value;
                if (CkVal && CkVal !== "" && (event.keyCode === 9 || event.key === "Tab")) {
                    swal.clickConfirm();
                }
            });

        }
    })
        .then(function(result) {
        // If validation fails, the value is undefined. Break out here.
        if (typeof(result.value) == 'undefined') {
            return false;
        } else {
            T2LoginPost(result.value[0], result.value[1]);
        }
    });
}

function DingDownLogout() {
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
                        title: '注销超时，请检查网络后重试',
                        icon: 'error',
                        text: '注销超时，请检查网络后重试',
                        confirmButtonText: '确定'
                    });
                }
            });
            T2LogoutPost();
        }
    })
}

function getMonth() {
    return new Date(new Date().getTime() + (parseInt(new Date().getTimezoneOffset() / 60) + 8) * 3600 * 1000).getMonth() + 1;
}

//get a hex string.   e.g. digestMessage(text).then(result=>{console.log(result)})
async function digestMessage(data, sname, message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    data[sname] = hashHex;
    return hashHex;
}

async function T2LoginPost(username, password) {
    //prepare post data
    var UserAgent = window.navigator.userAgent;
    var data = {
        "Username": username,
        "Salt": undefined,
        "Hash": undefined
    };
    await digestMessage(data, "Salt", '' + UserAgent + getMonth());
    await digestMessage(data, "Hash", '' + password + data['Salt']);
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
                title: '登录超时，请检查网络后重试',
                icon: 'error',
                text: '登录超时，请检查网络后重试',
                confirmButtonText: '确定'
            }).then(result => {
                DingDownLoginForm(result, username, password);
            });
        }
    });
    T2Post(
        'https://ddapi.133233.xyz/AjaxLogin',
        data,
        function(response) {
            if (response.response.Data.Status === 0) {
                //login success
                setCookie('Ding_SessionId', response.response.Data.SessionId, 30);
                setCookie('Ding_NickName', b64EncodeUnicode(response.response.Data.NickName), 30);
                setCookie('Ding_Credit', response.response.Data.Credit, 30);
                Swal.fire({
                    title: '登录成功',
                    text: '登录成功(2s后自动刷新)',
                    icon: 'success',
                    confirmButtonText: '确定',
                    timer: 2000,
                }).then(function() {
                    window.location.reload();
                });

            } else if (response.response.Data.Status === -3) {
                //login failed
                Swal.fire({
                    title: '登录失败',
                    text: '用户名或密码错误',
                    icon: 'error',
                    confirmButtonText: '确定'
                }).then(result => {
                    DingDownLoginForm();
                });
            } else {
                //other failure
                Swal.fire({
                    title: '登录失败',
                    text: response.response.Data.Message,
                    icon: 'error',
                    confirmButtonText: '确定'
                }).then(result => {
                    DingDownLoginForm();
                });
            }
        }
    );
}

function T2LogoutPost() {
    var data = {
        'SessionId': getCookie('Ding_SessionId')
    };
    T2Post(
        'https://ddapi.133233.xyz/AjaxLogOut',
        data,
        function(response) {
            if (response.response.Data.Status === 0) {
                //logout success
                setCookie('Ding_SessionId', '', -1);
                setCookie('Ding_NickName', '', -1);
                setCookie('Ding_Credit', '', -1);
                Swal.fire({
                    title: '退出成功',
                    text: '退出成功(2s后自动刷新)',
                    icon: 'success',
                    confirmButtonText: '确定',
                    timer: 2000,
                }).then(function() {
                    window.location.reload();
                });
            } else {
                //other failure
                setCookie('Ding_SessionId', '', -1);
                setCookie('Ding_NickName', '', -1);
                setCookie('Ding_Credit', '', -1);
                Swal.fire({
                    title: '退出失败',
                    text: response.response.Data.Message,
                    icon: 'error',
                    confirmButtonText: '确定',
                    timer: 2000,
                }).then(function() {
                    window.location.reload();
                });
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
        head.insertAdjacentHTML("beforeend", '<script src="https://gcore.jsdelivr.net/npm/sweetalert2@11.4.38/dist/sweetalert2.all.min.js"></script>');
        let SessionId = getCookie('Ding_SessionId');
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
        } else {
            let cart_status_data = document.querySelector("#cart_status_data");
            let dingdown_logout_a = document.getElementById("dingdown_logout_a");
            if (cart_status_data && !dingdown_logout_a) {
                cart_status_data.insertAdjacentHTML("beforeend",
                                                    '<div class="store_header_btn_green store_header_btn" id="dingdown_logout">' +
                                                    '<div class="store_header_btn_caps store_header_btn_leftcap"></div>' +
                                                    '<div class="store_header_btn_caps store_header_btn_rightcap"></div>' +
                                                    '<a id="dingdown_logout_a" class="store_header_btn_content" href="javascript:void(0);">' +
                                                    '注销（叮当昵称：' + UnicodeDecodeB64(getCookie('Ding_NickName')) + ', 积分：' + getCookie('Ding_Credit') + '）' +
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
function isWebBrowser() {
    let logo = document.querySelector("#logo_holder");
    if (logo) {
        return true;
    } else {
        return false;
    }
}

function addStyle(styleString) {
    const style = document.createElement('style');
    style.textContent = styleString;
    document.head.append(style);
}

const isInteger = num => /^-?[0-9]+$/.test(num+'');
let base_url = window.location;

window.addEventListener("load", function() {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    //login entry inject
    let SessionId = getCookie('Ding_SessionId');
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
    } else {
        let cart_status_data = document.querySelector("#cart_status_data");
        let dingdown_logout_a = document.getElementById("dingdown_logout_a");
        if (cart_status_data && !dingdown_logout_a) {
            cart_status_data.insertAdjacentHTML("beforeend",
                                                '<div class="store_header_btn_green store_header_btn" id="dingdown_logout">' +
                                                '<div class="store_header_btn_caps store_header_btn_leftcap"></div>' +
                                                '<div class="store_header_btn_caps store_header_btn_rightcap"></div>' +
                                                '<a id="dingdown_login_out_a" class="store_header_btn_content" href="javascript:void(0);">' +
                                                '注销（叮当昵称：' + UnicodeDecodeB64(getCookie('Ding_NickName')) + ', 积分：' + getCookie('Ding_Credit') + '）' +
                                                '</a>' +
                                                '</div>'
                                               );
        }
        const dingdown_logout = document.getElementById("dingdown_logout");
        if (dingdown_logout) {
            dingdown_logout.addEventListener("click", DingDownLogout);
        }
    }

    //store
    if (base_url.hostname == "store.steampowered.com"){
        //page initial post
        let base_path_sp = base_url.pathname.split('/');
        if (base_url.pathname === "/" || (base_path_sp.length > 0 && base_path_sp[1] == 'explore') ) {
            let x;
            let tab_newreleases_content = document.querySelector('#tab_newreleases_content'); //the box for searching result. each child in it is an <a>.
            if (!tab_newreleases_content) {
                tab_newreleases_content = document.querySelector('#tab_popular_comingsoon_content');
                if (!tab_newreleases_content) {
                    return;
                } else {
                    x = 3;
                }
            } else {
                x = 2;
            }
            let children = tab_newreleases_content.children;
            //restore all appid
            let appid = [];
            let childrenLength = children.length;
            for (let i = 1; i < childrenLength; i++) {
                let tmpchild = children[i];
                if (tmpchild.href.split('/')[3] == 'app') {
                    let title = tmpchild.children[x].children[0];
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

                function onload(response) {
                    console.log("got response for " + response.response.Data.Total + " appid");
                    //prefix all titles
                    for (let i = 1; i < childrenLength; i++) {
                        let tmpchild = children[i];
                        if (tmpchild.href.split('/')[3] == 'app') {
                            let title = tmpchild.children[x].children[0];
                            let thisid = tmpchild.href.split('/')[4];
                            if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                if (response.response.Data.AppInfo.find(a => a == thisid)) {
                                    title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                } else {
                                    title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                }
                                appid.splice(appid.indexOf(thisid), 1);
                                title.setAttribute("dingPrefix", "dingPrefix");
                            }
                        } else if (tmpchild.href.split('/')[3] == 'bundle') {
                            let title = tmpchild.children[x].children[0];
                            if (!title.getAttribute("dingPrefix")) {
                                title.setAttribute("dingPrefix", "dingPrefix");
                                title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                            }
                        } else if (tmpchild.href.split('/')[3] == 'sub') {
                            let title = tmpchild.children[x].children[0];
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
        }
        else if (base_path_sp.length > 0 && base_path_sp[1] == 'wishlist') {
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
                    function(response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i];
                            if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'app') {
                                let title = tmpchild.querySelector('.content').children[0];
                                let thisid = tmpchild.querySelector('.content').children[0].href.split('/')[4];
                                if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && title.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                    if (response.response.Data.AppInfo.find(a => a == thisid)) {
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
        else if (base_path_sp.length > 0 && base_path_sp[1] == 'search') {
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
                        function(response) {
                            console.log("got response for " + response.response.Data.Total + " appid");
                            //prefix all titles
                            for (let i = 0; i < childrenLength; i++) {
                                let tmpchild = children[i];
                                if (tmpchild.href.split('/')[3] == 'app') {
                                    let title = tmpchild.children[1].children[0].children[0];
                                    let thisid = tmpchild.href.split('/')[4];
                                    if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                        if (response.response.Data.AppInfo.find(a => a == thisid)) {
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

    }
    //steamcommunity.com
    else if (base_url.hostname == "steamcommunity.com"){
        let base_path_sp = base_url.pathname.split('/');
        //page initial post
        if (base_path.length > 0 && (base_path_sp[1] == 'profiles' || base_path_sp[1] == 'id') && base_path_sp[3] == 'games') {
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
                    function(response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i];
                            let title = tmpchild.children[1].querySelector('.gameListRowItemTop').children[0].children[0];
                            let thisid = tmpchild.getAttribute('id').slice(5);
                            if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && appid.find(a => a == thisid)) {
                                if (response.response.Data.AppInfo.find(a => a == thisid)) {
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

        }
        else if (base_path.length > 0 && (base_path_sp[1] == 'profiles' || base_path_sp[1] == 'id') && base_path_sp[3] == 'followedgames') {
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
                    function(response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i];
                            let title = tmpchild.children[1].children[0].children[0];
                            let thisid = tmpchild.getAttribute('data-appid');
                            if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && appid.find(a => a == thisid)) {
                                if (response.response.Data.AppInfo.find(a => a == thisid)) {
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

        }
        else if (base_path.length > 0 && (base_path_sp[1] == 'workshop' || base_path_sp[1] == 'sharedfiles') && base_path_sp[2] == 'filedetails') {
            //if the page is workshop/filedetails
            const SubscribeItemBtn = document.querySelector('#SubscribeItemBtn');
            if (SubscribeItemBtn) {
                //console.log("is_mod");
                let modid = window.location.href.split('/')[5].slice(4);
                let appid = document.querySelector('[name="appid"]').value;

                //same logic as showing dingdownload button
                if (getCookie('Ding_SessionId')) {
                    T2Post(
                        "https://ddapi.133233.xyz/CheckId", {
                            "Id": appid
                        },
                        function(response) {
                            console.log("got response");
                            var CheckIdResponse = {
                                'is_recorded': null,
                                'sharer': null
                            };
                            if (response.response.Data.Id == "0") {
                                CheckIdResponse = {
                                    'is_recorded': false,
                                    'sharer': null
                                };
                            } else {
                                let NickName = response.response.Data.NickName;
                                if (!NickName || NickName.length === 0 || NickName === "") {
                                    NickName = "系统/匿名";
                                }
                                CheckIdResponse = {
                                    'is_recorded': true,
                                    'sharer': NickName
                                };
                            }

                            //无需请求的情况下,不再请求CheckSub
                            //可以叮当下载的前提下，显示叮当订阅按钮，否则显示未订阅游戏信息
                            let queueBtnFollow = document.querySelector('#queueBtnFollow');
                            let checkSubData = {
                                'SessionId': getCookie('Ding_SessionId'),
                                "AppId": appid
                            };

                            const freeGameBtn = document.querySelector('#freeGameBtn'); // is this a free game?
                            if (CheckIdResponse.is_recorded === true && CheckIdResponse.sharer !== UnicodeDecodeB64(getCookie('Ding_NickName')) && !freeGameBtn && CheckIdResponse.sharer !== "系统/匿名") {
                                //if the game is recorded
                                //and the sharer is not the current user
                                //and the game is not free.
                                //and the sharer is not "系统/匿名"
                                T2Post(
                                    "https://ddapi.133233.xyz/AjaxCheckSub",
                                    checkSubData,
                                    function(response) {
                                        if (response.response.Data.Credit && response.response.Data.Credit !== 2147483647) {
                                            setCookie('Ding_Credit', response.response.Data.Credit, 30);
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

                                        } else if (response.response.Data.Status === 0 || response.response.Data.Status === -200) {
                                            //0 this game hasn't been recorded yet, -200 this is not game but dlc
                                            //do nothing so far
                                        } else if (response.response.Data.Status === -20 || response.response.Data.Status === -30 || response.response.Data.Status === -100) {
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
                                            DingDownSubscribeModBtn.addEventListener('click', function() {
                                                if (isWebBrowser()) {
                                                    window.open("ding://install/" + appid + "/" + modid);
                                                } else {
                                                    window.open("steam://openurl_external/https://ddapi.133233.xyz/install/" + appid + "/" + modid);
                                                }
                                            });
                                        } else if (response.response.Data.Status === -2) {
                                            //if not logged in
                                            setCookie('Ding_SessionId', "", -1);
                                            setCookie('Ding_Credit', "", -1);
                                            setCookie('Ding_NickName', "", -1);
                                            Swal.fire({
                                                title: '您还没有登录，请先登录',
                                                text: response.response.Data.Message,
                                                icon: 'error',
                                                confirmButtonText: '确定',
                                                timer: 2000,
                                            }).then(function() {
                                                window.location.reload();
                                            });
                                        } else {
                                            console.log("error" + response.response.Data.Status + ',' + response.response.Data.Message);
                                        }
                                    }
                                );
                            } else if (CheckIdResponse.is_recorded === false) {
                                //not recorded,
                                //do nothing
                            } else if (CheckIdResponse.sharer === UnicodeDecodeB64(getCookie('Ding_NickName')) || freeGameBtn || CheckIdResponse.sharer === "系统/匿名") {
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
                                DingDownSubscribeModBtn.addEventListener('click', function() {
                                    if (isWebBrowser()) {
                                        window.open("ding://install/" + appid + "/" + modid);
                                    } else {
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
            } else {
                //console.log("not_mod")
            }
        }
    }
    //steamdb.info
    else if (base_url.hostname == "steamdb.info"){
        let base_path = window.location.pathname.split('/');
        //app page
        if (base_path.length > 0 && base_path[1] === "app") {
            let head_node = document.getElementsByClassName("pagehead");
            if (head_node && head_node.length >0){
                let appids = [];
                let depots = [];
                //base appid
                let base_appid = base_path[2];
                //trying to get the nickname first.
                //appids.push(base_appid);
                if (base_appid && base_appid.length >1 && base_appid.length < 10 && isInteger(base_appid)){
                    let data = {
                        Id: base_appid
                    };
                    T2Post(
                        "https://ddapi.133233.xyz/CheckId",
                        data,
                        function(response) {
                            console.log("got response");
                            let head_name = head_node[0].getElementsByTagName("h1");
                            if (head_name && head_name.length >0){
                                if (response.response.Data.Id == "0") {
                                    head_name[0].innerHTML = "<span style='color:red;'>（未收录）</span>" + head_name[0].innerHTML;
                                }
                                else
                                {
                                    head_name[0].innerHTML = "<span style='color:green;'>（已收录）</span>" + head_name[0].innerHTML;
                                    let next_class = head_node[0].nextElementSibling;
                                    let node_tr = next_class.children[0].getElementsByTagName("tr");
                                    if (node_tr){
                                        let NickName = response.response.Data.NickName;
                                        if (!NickName || NickName.length === 0 || NickName === "") {
                                            NickName = "<span style='color:green;'><b>系统/匿名</b></span>（" + response.response.Data.Date;
                                        }else{
                                            NickName= "<span style='color:#ff683b;'><b>"+ NickName +"</b></span>（" + response.response.Data.Date;
                                        }
                                        node_tr[1].outerHTML = node_tr[1].outerHTML + "<tr><td>叮当公共库</td><td itemprop=\"dingCategory\">"+NickName+")</td></tr>";
                                    }
                                }
                            }
                        }
                    );
                }


                //get the dlc table.
                let dlc_node = document.querySelector("#dlc");
                if (dlc_node)
                {
                    //body
                    let children = dlc_node.getElementsByTagName("tbody");
                    //restore all appid
                    let childrenLength = children.length;
                    for (let i = 0; i < childrenLength; i++) {
                        let tmpchild = children[i].getElementsByTagName("tr");
                        let tmpchildLength = tmpchild.length;
                        for (let k = 0; k < tmpchildLength; k++) {
                            let appid = tmpchild[k].getAttribute("data-appid");
                            if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                                appids.push(appid);
                            }
                        }
                    }
                }
                let depot_node = document.querySelector("#depots");
                if (depot_node && !depot_node.getAttribute("dingPost")){
                    depot_node.setAttribute("dingPost", "dingPost")
                    //body
                    let children = depot_node.getElementsByTagName("tbody");
                    //restore all appid
                    let childrenLength = children.length;
                    for (let i = 0; i < childrenLength; i++) {
                        let tmpchild = children[i].getElementsByTagName("tr");
                        let tmpchildLength = tmpchild.length;
                        for (let k = 0; k < tmpchildLength; k++) {
                            let depotnode = tmpchild[k].getElementsByTagName("a");
                            if (depotnode && depotnode.length >0){
                                let depotid = depotnode[0].innerText;
                                if (depotid && depotid.length >1 && depotid.length < 10 && isInteger(depotid)){
                                    depots.push(depotid);
                                }
                            }
                        }
                    }
                }

                if (appids.length != 0) {
                    let data = {
                        "Ids": appids.join()
                    };
                    T2Post(
                        "https://ddapi.133233.xyz/CheckIds",
                        data,
                        function (response) {
                            console.log("got response for " + response.response.Data.Total + " appid");
                            //body
                            if (dlc_node){
                                let children = dlc_node.getElementsByTagName("tbody");
                                //restore all appid
                                let childrenLength = children.length;
                                //prefix DLC table
                                for (let i = 0; i < childrenLength; i++) {
                                    let tmpchild = children[i].getElementsByTagName("tr");
                                    let tmpchildLength = tmpchild.length;
                                    for (let k = 0; k < tmpchildLength; k++) {
                                        let tmpnode = tmpchild[k];
                                        let appid = tmpnode.getAttribute("data-appid");
                                        let tmptext = tmpnode.getElementsByTagName("td");
                                        if (tmptext && tmptext.length >0) {
                                            if (appids.find(a => a == appid)) {
                                                if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                    tmptext[1].innerHTML = "<span style='color:green;'>（已收录）</span>" + tmptext[1].innerHTML;
                                                } else {
                                                    tmptext[1].innerHTML = "<span style='color:red;'>（未收录）</span>" + tmptext[1].innerHTML;
                                                }
                                                appids.splice(appids.indexOf(appid), 1);
                                            }

                                        }

                                    }

                                }
                            }
                        }
                    );
                }
                if (depots.length != 0) {
                    let data = {
                        "Ids": depots.join()
                    };
                    T2Post(
                        "https://ddapi.133233.xyz/CheckIdsDepot",
                        data,
                        function (response) {
                            console.log("got response for " + response.response.Data.Total + " depots");
                            //body
                            if (depot_node){
                                let children = depot_node.getElementsByTagName("tbody");
                                //restore all appid
                                let childrenLength = children.length;
                                //prefix DLC table
                                for (let i = 0; i < childrenLength; i++) {
                                    let tmpchild = children[i].getElementsByTagName("tr");
                                    let tmpchildLength = tmpchild.length;
                                    for (let k = 0; k < tmpchildLength; k++) {
                                        let depotnode = tmpchild[k].getElementsByTagName("a");
                                        if (depotnode && depotnode.length >0){
                                            let depotid = depotnode[0].innerText;
                                            if (depotid && depotid.length >1 && depotid.length < 10){
                                                if (depots.find(a => a == depotid)) {
                                                    let tmptext = tmpchild[k].getElementsByTagName("td");
                                                    if (tmptext && tmptext.length >0) {
                                                        if (response.response.Data.AppInfo.find(a => a == depotid)) {
                                                            tmptext[1].innerHTML = "<span style='color:green;font-style: normal;'>（已收录）</span>" + tmptext[1].innerHTML;
                                                        } else {
                                                            tmptext[1].innerHTML = "<span style='color:red;font-style: normal;'>（未收录）</span>" + tmptext[1].innerHTML;
                                                        }
                                                    }
                                                    depots.splice(depots.indexOf(depotid), 1);
                                                }
                                            }
                                        }
                                    }

                                }
                            }
                        }
                    );
                }
            }
        }
        else if (base_path.length > 0 && base_path[1] === "depot") {
            let head_node = document.getElementsByClassName("pagehead");
            if (head_node && head_node.length >0){
                let base_depotid = base_path[2];
                if (base_depotid && base_depotid.length >1 && base_depotid.length < 10 && isInteger(base_depotid)){
                    let data = {
                        Id: base_depotid
                    };
                    T2Post(
                        "https://ddapi.133233.xyz/CheckIdDepot",
                        data,
                        function(response) {
                            console.log("got response");
                            let next_class = head_node[0].nextElementSibling;
                            if(next_class){
                                let tmpchild = next_class.children[0].getElementsByTagName("tr")[0];
                                if (response.response.Data) {
                                    tmpchild.children[1].innerHTML += "<span style='color:green;'>（已收录）</span>";
                                } else {
                                    tmpchild.children[1].innerHTML += "<span style='color:red;'>（未收录）</span>";
                                }
                            }
                        }
                    );
                }
            }
        }
        //old-search
        else if (base_path.length > 0 && base_path[1] === "search") {
            //body
            let children = document.getElementsByTagName("tbody");
            //restore all appid
            if(children){
                let appids = [];
                let childrenLength = children.length;
                for (let i = 0; i < childrenLength; i++) {
                    let tmpchild = children[i].getElementsByTagName("tr");
                    let tmpchildLength = tmpchild.length;
                    for (let k = 0; k < tmpchildLength; k++) {
                        let appid = tmpchild[k].getAttribute("data-appid");
                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                            appids.push(appid);
                        }
                    }
                }

                if (appids.length != 0) {
                    let data = {
                        "Ids": appids.join()
                    };
                    T2Post(
                        "https://ddapi.133233.xyz/CheckIds",
                        data,
                        function (response) {
                            console.log("got response for " + response.response.Data.Total + " appid");
                            //body
                            if (children){
                                //restore all appid
                                let childrenLength = children.length;
                                //prefix DLC table
                                for (let i = 0; i < childrenLength; i++) {
                                    let tmpchild = children[i].getElementsByTagName("tr");
                                    let tmpchildLength = tmpchild.length;
                                    for (let k = 0; k < tmpchildLength; k++) {
                                        let tmpnode = tmpchild[k];
                                        let appid = tmpnode.getAttribute("data-appid");
                                        let tmptext = tmpnode.getElementsByTagName("td");
                                        if (tmptext && tmptext.length >0) {
                                            if (appids.find(a => a == appid)) {
                                                if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                    tmptext[2].innerHTML = "<span style='color:green;'>（已收录）</span>" + tmptext[2].innerHTML;
                                                } else {
                                                    tmptext[2].innerHTML = "<span style='color:red;'>（未收录）</span>" + tmptext[2].innerHTML;
                                                }
                                                appids.splice(appids.indexOf(appid), 1);
                                            }

                                        }

                                    }

                                }
                            }
                        }
                    );
                }
            }
        }
        //patchnotes
        else if (base_path.length > 0 && base_path[1] === "patchnotes") {
            //body
            let children = document.getElementsByTagName("tbody");
            //restore all appid
            if(children){
                let appids = [];
                let childrenLength = children.length;
                for (let i = 0; i < childrenLength; i++) {
                    let tmpchild = children[i].getElementsByTagName("tr");
                    let tmpchildLength = tmpchild.length;
                    for (let k = 0; k < tmpchildLength; k++) {
                        let appid = tmpchild[k].getAttribute("data-appid");
                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                            appids.push(appid);
                        }
                    }
                }

                if (appids.length != 0) {
                    let data = {
                        "Ids": appids.join()
                    };
                    T2Post(
                        "https://ddapi.133233.xyz/CheckIds",
                        data,
                        function (response) {
                            console.log("got response for " + response.response.Data.Total + " appid");
                            //body
                            if (children){
                                //restore all appid
                                let childrenLength = children.length;
                                //prefix DLC table
                                for (let i = 0; i < childrenLength; i++) {
                                    let tmpchild = children[i].getElementsByTagName("tr");
                                    let tmpchildLength = tmpchild.length;
                                    for (let k = 0; k < tmpchildLength; k++) {
                                        let tmpnode = tmpchild[k];
                                        let appid = tmpnode.getAttribute("data-appid");
                                        let tmptext = tmpnode.getElementsByTagName("td");
                                        if (tmptext && tmptext.length >0) {
                                            if (appids.find(a => a == appid)) {
                                                if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                    tmptext[2].innerHTML = "<span style='color:green;'>（已收录）</span>" + tmptext[2].innerHTML;
                                                } else {
                                                    tmptext[2].innerHTML = "<span style='color:red;'>（未收录）</span>" + tmptext[2].innerHTML;
                                                }
                                                appids.splice(appids.indexOf(appid), 1);
                                            }

                                        }

                                    }

                                }
                            }
                        }
                    );
                }
            }
        }
        //apps
        else if (base_path.length > 0 && base_path[1] === "apps") {
            //body
            let children = document.getElementsByTagName("tbody");
            //restore all appid
            if(children){
                let appids = [];
                let childrenLength = children.length;
                for (let i = 0; i < childrenLength; i++) {
                    let tmpchild = children[i].getElementsByTagName("tr");
                    let tmpchildLength = tmpchild.length;
                    for (let k = 0; k < tmpchildLength; k++) {
                        let appid = tmpchild[k].getAttribute("data-appid");
                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                            appids.push(appid);
                        }
                    }
                }

                if (appids.length != 0) {
                    let data = {
                        "Ids": appids.join()
                    };
                    T2Post(
                        "https://ddapi.133233.xyz/CheckIds",
                        data,
                        function (response) {
                            console.log("got response for " + response.response.Data.Total + " appid");
                            //body
                            if (children){
                                //restore all appid
                                let childrenLength = children.length;
                                //prefix DLC table
                                for (let i = 0; i < childrenLength; i++) {
                                    let tmpchild = children[i].getElementsByTagName("tr");
                                    let tmpchildLength = tmpchild.length;
                                    for (let k = 0; k < tmpchildLength; k++) {
                                        let tmpnode = tmpchild[k];
                                        let appid = tmpnode.getAttribute("data-appid");
                                        let tmptext = tmpnode.getElementsByTagName("td");
                                        if (tmptext && tmptext.length >0) {
                                            if (appids.find(a => a == appid)) {
                                                if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                    tmptext[2].innerHTML = "<span style='color:green;'>（已收录）</span>" + tmptext[2].innerHTML;
                                                } else {
                                                    tmptext[2].innerHTML = "<span style='color:red;'>（未收录）</span>" + tmptext[2].innerHTML;
                                                }
                                                appids.splice(appids.indexOf(appid), 1);
                                            }

                                        }

                                    }

                                }
                            }
                        }
                    );
                }
            }
        }
        //upcoming
        else if (base_path.length > 0 && base_path[1] === "upcoming") {
            //body
            let children = document.getElementsByTagName("tbody");
            //restore all appid
            if(children){
                let appids = [];
                let childrenLength = children.length;
                for (let i = 0; i < childrenLength; i++) {
                    let tmpchild = children[i].getElementsByTagName("tr");
                    let tmpchildLength = tmpchild.length;
                    for (let k = 0; k < tmpchildLength; k++) {
                        let appid = tmpchild[k].getAttribute("data-appid");
                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                            appids.push(appid);
                        }
                    }
                }

                if (appids.length != 0) {
                    let data = {
                        "Ids": appids.join()
                    };
                    T2Post(
                        "https://ddapi.133233.xyz/CheckIds",
                        data,
                        function (response) {
                            console.log("got response for " + response.response.Data.Total + " appid");
                            //body
                            if (children){
                                //restore all appid
                                let childrenLength = children.length;
                                //prefix DLC table
                                for (let i = 0; i < childrenLength; i++) {
                                    let tmpchild = children[i].getElementsByTagName("tr");
                                    let tmpchildLength = tmpchild.length;
                                    for (let k = 0; k < tmpchildLength; k++) {
                                        let tmpnode = tmpchild[k];
                                        let appid = tmpnode.getAttribute("data-appid");
                                        let tmptext = tmpnode.getElementsByTagName("td");
                                        if (tmptext && tmptext.length >0) {
                                            if (appids.find(a => a == appid)) {
                                                if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                    tmptext[2].innerHTML = "<span style='color:green;'>（已收录）</span>" + tmptext[2].innerHTML;
                                                } else {
                                                    tmptext[2].innerHTML = "<span style='color:red;'>（未收录）</span>" + tmptext[2].innerHTML;
                                                }
                                                appids.splice(appids.indexOf(appid), 1);
                                            }

                                        }

                                    }

                                }
                            }
                        }
                    );
                }
            }
        }
    }
});

//mutation检测是否在搜索结果内部分有变化。若有，触发脚本
if (base_url.hostname == 'store.steampowered.com') {
    //主页. xxx1是服务于类搜索结果的部分的.
    let base_path_sp = window.location.pathname.split('/');
    if(base_url.pathname === "/" || (base_path_sp.length > 0 && base_path_sp[1] == 'explore') ){
        let targetNode1 = document.querySelector('#last_tab');
        let targetNode2 = document.querySelector('#tab_topsellers_content');

        let config = {
            subtree: true,
            childList: true,
            characterData: true
        };

        var callback1 = mutations => {
            let tags = targetNode1.getAttribute("value");
            if (tags && tags !== "") {
                let display = document.querySelector('#' + tags.replace(/\$/g, '\\$')); //the box for searching result. each child in it is an <a>. //# syntax doesn't allow for an unescaped
                // tab_topsellers_content 热销商品标签 is different from others
                let children;
                let i;
                let x;
                if (tags == "tab_topsellers_content") {
                    children = display.children[2].children;
                    i = 0;
                    x = 2;
                } else if (tags == "tab_all_comingsoon_content" || tags == "tab_popular_comingsoon_content") {
                    children = display.children;
                    i = 1;
                    x = 3;
                } else {
                    children = display.children;
                    i = 1;
                    x = 2;
                }
                //restore all appid
                let appid = [];
                let childrenLength = children.length;
                for (; i < childrenLength; i++) {
                    let tmpchild = children[i];
                    if (tmpchild && tmpchild.href && tmpchild.href.split('/')[3] == 'app') {
                        let title = tmpchild.children[x].children[0];
                        if (title && !title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app') {
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
                        function(response) {
                            console.log("got response for " + response.response.Data.Total + " appid");
                            //prefix all titles
                            let i;
                            if (tags == "tab_topsellers_content") {
                                i = 0;
                            } else {
                                i = 1;
                            }
                            for (; i < childrenLength; i++) {
                                let tmpchild = children[i];
                                if (tmpchild.href.split('/')[3] == 'app') {
                                    let title = tmpchild.children[x].children[0];
                                    let thisid = tmpchild.href.split('/')[4];
                                    if (title && !title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && tmpchild.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                        if (response.response.Data.AppInfo.find(a => a == thisid)) {
                                            title.innerHTML = "<span style='color:green;'>（已收录）</span>" + title.innerHTML;
                                        } else {
                                            title.innerHTML = "<span style='color:red;'>（未收录）</span>" + title.innerHTML;
                                        }
                                        appid.splice(appid.indexOf(thisid), 1);
                                        title.setAttribute("dingPrefix", "dingPrefix");
                                    }
                                } else if (tmpchild.href.split('/')[3] == 'bundle') {
                                    let title = tmpchild.children[x].children[0];
                                    if (!title.getAttribute("dingPrefix")) {
                                        title.setAttribute("dingPrefix", "dingPrefix");
                                        title.innerHTML = "<span style='color:orange;'>（合集）</span>" + title.innerHTML;
                                    }
                                } else if (tmpchild.href.split('/')[3] == 'sub') {
                                    let title = tmpchild.children[x].children[0];
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

        const observer1 = new MutationObserver(callback1);
        observer1.observe(targetNode1, {
            attributes: true
        });
        if (targetNode2) {
            observer1.observe(targetNode2, config);
        }
    }
    //优化单页加载
    else if (base_path_sp.length > 0 && base_path_sp[1] == 'app') {
        let appid = base_path_sp[2];
        let data = {
            Id: appid
        };
        let title = document.getElementById("userReviews");
        let iscomingson = document.querySelector(".game_area_comingsoon");
        if (iscomingson){
            title.insertAdjacentHTML("afterbegin","<span class=\"user_reviews_summary_row\"><div class=\"subtitle column\">叮当分享:</div><div class=\"summary column ding\"><span style='color:red;'><b>游戏未发行</b></span></div></span>");
        }else if (!title.getAttribute("dingPost")) {
            title.setAttribute("dingPost", "dingPost");
            T2Post(
                "https://ddapi.133233.xyz/CheckId",
                data,
                function(response) {
                    console.log("got response");
                    var CheckIdResponse = {
                        'is_recorded': null,
                        'sharer': null
                    };
                    if (response.response.Data.Id == "0") {
                        CheckIdResponse = {
                            'is_recorded': false,
                            'sharer': null
                        };
                        //title.innerHTML += " ----- 公共库未收录";
                        title.insertAdjacentHTML("afterbegin","<span class=\"user_reviews_summary_row\"><div class=\"subtitle column\">叮当分享:</div><div class=\"summary column\"><span style='color:red;'><b>未收录</b></span></div></span>");
                    } else {
                        let NickName = response.response.Data.NickName;
                        if (!NickName || NickName.length === 0 || NickName === "") {
                            NickName = "<div class=\"summary column ding\"><span style='color:green;'><b>系统/匿名</b></span>（" + response.response.Data.Date + "）</div>";
                        }else{
                            NickName= "<div class=\"summary column ding\"><span style='color:#ff683b;'><b>"+ NickName +"</b></span>（" + response.response.Data.Date + "）</div>";
                        }
                        CheckIdResponse = {
                            'is_recorded': true,
                            'sharer': NickName
                        };
                        title.insertAdjacentHTML("afterbegin","<span class=\"user_reviews_summary_row\"><div class=\"subtitle column\">叮当分享:</div>" + NickName + "</span>" );
                        //title.outerHTML = "<div class=\"user_reviews_summary_row\"><div class=\"subtitle column\">叮当分享:</div>" + NickName + "</div>" + title.outerHTML;
                    }
                    title.setAttribute("dingPrefix", "dingPrefix");
                    //only if the response is received, then add subscribe/download button.

                    //自己提交的(判断CheckId返回的昵称?)/免费游戏/分享者为“系统/匿名”/未收录的,不再请求CheckSub
                    //add a button for DingDownloadcost_credit
                    if (getCookie('Ding_SessionId')) {
                        //if logged in
                        let queueBtnFollow = document.querySelector('#queueActionsCtn');
                        // if this is a DLC, try find the main appid.
                        let ostmain = document.querySelector(".game_area_soundtrack_bubble")
                        if (!ostmain){
                            let dlcmain = document.getElementsByClassName('glance_details');
                            if (dlcmain && dlcmain.length >0){
                                let node_a = dlcmain[0].getElementsByTagName("a");
                                if (node_a && node_a.length > 0){
                                    let tmplinkLength = node_a.length;
                                    for (let y = 0; y < tmplinkLength;y++) {
                                        let tmp_href = new URL(node_a[y].href);
                                        if (tmp_href.host == 'store.steampowered.com'){
                                            let path_sp = tmp_href.pathname.split('/');
                                            appid = path_sp[2];
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        let checkSubData = {
                            'SessionId': getCookie('Ding_SessionId'),
                            "AppId": appid
                        };

                        if (queueBtnFollow) {
                            // if this page is an app instead of dlc
                            const freeGameBtn = document.querySelector('#freeGameBtn'); // is this a free game?
                            if (CheckIdResponse.is_recorded === true && CheckIdResponse.sharer !== UnicodeDecodeB64(getCookie('Ding_NickName')) && !freeGameBtn && CheckIdResponse.sharer !== "系统/匿名") {
                                //only if the game is recorded
                                //and the sharer is not the current user
                                //and the game is not free.
                                //and the sharer is not "系统/匿名"
                                T2Post(
                                    "https://ddapi.133233.xyz/AjaxCheckSub",
                                    checkSubData,
                                    function(response) {
                                        if (response.response.Data.Credit && response.response.Data.Credit !== 2147483647) {
                                            setCookie('Ding_Credit', response.response.Data.Credit, 30);
                                        }
                                        if (response.response.Data.Status > 0) {
                                            //if not subscribed
                                            let cost_credit = response.response.Data.Status;
                                            queueBtnFollow.insertAdjacentHTML('afterbegin', '<div id="dingdown_subscribe" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当订阅此游戏"><span>叮当订阅：-' + cost_credit + '分</span></a></div>');
                                            let dingdown_subscribe = document.getElementById("dingdown_subscribe");
                                            dingdown_subscribe.addEventListener("click", function() {
                                                let subData = {
                                                    'SessionId': getCookie('Ding_SessionId'),
                                                    "AppId": appid
                                                };
                                                Swal.fire({
                                                    title: '确认订阅？',
                                                    text: '订阅后将会消耗' + cost_credit + '分，确认订阅吗？',
                                                    type: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonText: '确认订阅',
                                                    cancelButtonText: '取消',
                                                })
                                                    .then(
                                                    function(result) {
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
                                                                        title: '订阅超时，请检查网络后重试',
                                                                        icon: 'error',
                                                                        text: '订阅超时，请检查网络后重试',
                                                                        confirmButtonText: '确定'
                                                                    });
                                                                }
                                                            });
                                                            T2Post(
                                                                "https://ddapi.133233.xyz/AjaxSubApp",
                                                                subData,
                                                                function(response) {
                                                                    if (response.response.Data.Status === 0) {
                                                                        if (response.response.Data.Credit && response.response.Data.Credit !== 2147483647) {
                                                                            setCookie('Ding_Credit', response.response.Data.Credit, 30);
                                                                        }
                                                                        Swal.fire({
                                                                            title: '订阅成功',
                                                                            text: '订阅成功，剩余' + getCookie('Ding_Credit') + '分',
                                                                            type: 'success',
                                                                            confirmButtonText: '确定',

                                                                        }).then(function() {
                                                                            window.location.reload();
                                                                        });

                                                                    } else if (response.response.Data.Status === -2) {
                                                                        setCookie('Ding_SessionId', "", -1);
                                                                        setCookie('Ding_Credit', "", -1);
                                                                        setCookie('Ding_NickName', "", -1);
                                                                        Swal.fire({
                                                                            title: '订阅失败',
                                                                            text: response.response.Data.Message,
                                                                            type: 'error',
                                                                            confirmButtonText: '确定',

                                                                        }).then(function() {
                                                                            window.location.reload();
                                                                        });
                                                                    } else {
                                                                        Swal.fire({
                                                                            title: '订阅失败',
                                                                            text: '订阅失败，' + response.response.Data.Message,
                                                                            type: 'error',
                                                                            confirmButtonText: '确定',

                                                                        }).then(function() {
                                                                            window.location.reload();
                                                                        });
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    }
                                                );

                                            });
                                        } else if (response.response.Data.Status === 0) {
                                            //0 this game hasn't been recorded yet
                                            //do nothing so far
                                        } else if (response.response.Data.Status === -200) {
                                            //-200 this is a dlc and is recorded.
                                            //do nothing so far
                                        } else if (response.response.Data.Status === -20 || response.response.Data.Status === -30 || response.response.Data.Status === -100) {
                                            //-20 the user is the sharer. -30 the user has subscribed. -100 the game is free or recorded by anonymous users. All means the user do not need to pay credit for this game.
                                            if(ostmain){
                                                queueBtnFollow.insertAdjacentHTML('afterbegin', '<div id="dingdown_download" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当软件下载&启动游戏"><span>叮当下载原声轨</span></a></div>');
                                            }else{
                                                queueBtnFollow.insertAdjacentHTML('afterbegin', '<div id="dingdown_download" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当软件下载&启动游戏"><span>叮当试玩</span></a></div>');
                                            }
                                            const dingdown_download = document.getElementById("dingdown_download");
                                            dingdown_download.addEventListener("click", function() {
                                                if (isWebBrowser()) {
                                                    window.open("ding://install/" + appid);
                                                } else {
                                                    window.open("steam://openurl_external/https://ddapi.133233.xyz/install/" + appid);
                                                }
                                            });
                                        } else if (response.response.Data.Status === -2) {
                                            //if not logged in
                                            setCookie('Ding_SessionId', "", -1);
                                            setCookie('Ding_Credit', "", -1);
                                            setCookie('Ding_NickName', "", -1);
                                            Swal.fire({
                                                title: '您还没有登录，请先登录',
                                                text: response.response.Data.Message,
                                                icon: 'error',
                                                confirmButtonText: '确定',
                                                timer: 2000,
                                            }).then(function() {
                                                window.location.reload();
                                            });
                                        } else {
                                            console.log("error" + response.response.Data.Status + ',' + response.response.Data.Message);
                                        }
                                    }
                                );
                            } else if (CheckIdResponse.is_recorded === false) {
                                //not recorded,
                                //未收录的判断网页内容是否有启动steam,有的话证明可入库.
                                const game_area_already_owned = document.getElementsByClassName("game_area_already_owned");
                                if (game_area_already_owned) {
                                    //add a share button TODO
                                }
                            } else if (CheckIdResponse.sharer === UnicodeDecodeB64(getCookie('Ding_NickName')) || freeGameBtn || CheckIdResponse.sharer === "系统/匿名") {
                                //user can download this game
                                queueBtnFollow.insertAdjacentHTML('beforeend', '<div id="dingdown_download" class="queue_control_button" style="flex-grow: 0;"><a class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当软件下载&启动游戏"><span>叮当试玩</span></a></div>');
                                const dingdown_download = document.getElementById("dingdown_download");
                                dingdown_download.addEventListener("click", function() {
                                    if (isWebBrowser()) {
                                        window.open("ding://install/" + appid);
                                    } else {
                                        window.open("steam://openurl_external/https://ddapi.133233.xyz/install/" + appid);
                                    }
                                });
                            }
                        } else {
                            //if dlc
                            const game_area_dlc_bubble = document.querySelector(".game_area_dlc_bubble");
                            let game_appid;
                            if (game_area_dlc_bubble) {
                                game_appid = game_area_dlc_bubble.children[0].children[1].children[0].href.split('/')[4];
                            }
                            //if this dlc is not recorded: do nothing
                            if (CheckIdResponse.is_recorded === true && game_appid) {
                                //check parent game
                                T2Post(
                                    "https://ddapi.133233.xyz/AjaxCheckSub", {
                                        'SessionId': getCookie('Ding_SessionId'),
                                        "AppId": game_appid
                                    },
                                    function(response) {
                                        if (response.response.Data.Credit && response.response.Data.Credit !== 2147483647) {
                                            setCookie('Ding_Credit', response.response.Data.Credit, 30);
                                        }
                                        if (response.response.Data.Status > 0) {
                                            //if not subscribed
                                            //请先叮当订阅游戏本体
                                            const ignoreBtn = document.querySelector("#ignoreBtn");
                                            if (ignoreBtn) {
                                                ignoreBtn.insertAdjacentHTML("beforebegin", '<div id="queueBtnFollow" class="queue_control_button queue_btn_follow" style="flex-grow: 0;"><div id="dingdown_need_game_subscribed" class="queue_control_button" style="flex-grow: 0;"><a href="http://store.steampowered.com/app/' + game_appid + '" class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="请在使用叮当订阅dlc前先订阅游戏本体"><span>请先叮当订阅本体（点击跳转本体）</span></a></div></div>')
                                            }
                                        } else if (response.response.Data.Status === 0) {
                                            //0 this game hasn't been recorded yet
                                            const ignoreBtn = document.querySelector("#ignoreBtn");
                                            if (ignoreBtn) {
                                                ignoreBtn.insertAdjacentHTML("beforebegin", '<div id="queueBtnFollow" class="queue_control_button queue_btn_follow" style="flex-grow: 0;"><div id="dingdown_need_game_recorded" class="queue_control_button" style="flex-grow: 0;"><a href="http://store.steampowered.com/app/' + game_appid + '" class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="本地未收录，无法订阅本dlc"><span>叮当尚未收录本体（点击跳转本体）</span></a></div></div>')
                                            }
                                        } else if (response.response.Data.Status === -200) {
                                            //-200 this is a dlc and is recorded.
                                            //this condition is not needed. no dlc's parent is another dlc.
                                        } else if (response.response.Data.Status === -20 || response.response.Data.Status === -30 || response.response.Data.Status === -100) {
                                            //-20 the user is the sharer. -30 the user has subscribed. -100 the game is free or recorded by anonymous users. All means the user do not need to pay credit for this game.
                                            const ignoreBtn = document.querySelector("#ignoreBtn");
                                            console.log(ignoreBtn);
                                            if (ignoreBtn) {
                                                ignoreBtn.insertAdjacentHTML("beforebegin", '<div id="queueBtnFollow" class="queue_control_button queue_btn_follow" style="flex-grow: 0;"><div id="dingdown_download" class="queue_control_button" style="flex-grow: 0;"><a href="javascript:void(0);" class="btnv6_lightblue_blue  btnv6_border_2px btn_medium btn_green_steamui" data-tooltip-text="使用叮当软件下载本dlc"><span>叮当试玩</span></a></div></div>')
                                                const dingdown_download = document.getElementById("dingdown_download");
                                                dingdown_download.addEventListener("click", function() {
                                                    if (isWebBrowser()) {
                                                        window.open("ding://install/" + appid);
                                                    } else {
                                                        window.open("steam://openurl_external/https://ddapi.133233.xyz/install/" + appid);
                                                    }
                                                });
                                            }

                                        } else if (response.response.Data.Status === -2) {
                                            //if not logged in
                                            setCookie('Ding_SessionId', "", -1);
                                            setCookie('Ding_Credit', "", -1);
                                            setCookie('Ding_NickName', "", -1);
                                            Swal.fire({
                                                title: '您还没有登录，请先登录',
                                                text: response.response.Data.Message,
                                                icon: 'error',
                                                confirmButtonText: '确定',
                                                timer: 2000,
                                            }).then(function() {
                                                window.location.reload();
                                            });
                                        } else {
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

    }
    //搜索页面
    else if (base_path_sp.length > 0 && base_path_sp[1] == 'search') {
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
                                function(response) {
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
    else if (base_path_sp.length > 0 && base_path_sp[1] == 'wishlist') {
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
                    function(response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i];
                            if (tmpchild.querySelector('.content').children[0].href.split('/')[3] == 'app') {
                                let title = tmpchild.querySelector('.content').children[0];
                                let thisid = tmpchild.querySelector('.content').children[0].href.split('/')[4];
                                if (!title.getAttribute("dingPrefix") && title.getAttribute("dingPost") && title.href.split('/')[3] == 'app' && appid.find(a => a == thisid)) {
                                    if (response.response.Data.AppInfo.find(a => a == thisid)) {
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
                //banner
                let ContentHubMainCarouselCapsule = document.getElementsByClassName("maincap");
                if (ContentHubMainCarouselCapsule && ContentHubMainCarouselCapsule.length > 0) {
                    let children = ContentHubMainCarouselCapsule;
                    for (let i = 0; i < children.length; i++) {
                        let alink = children[i].getElementsByTagName('a');
                        if (alink) {
                            for(var y = 0; y < alink.length; y++){
                                let klink = alink[y];
                                let ahref = klink.getAttribute("href").split('/');
                                if (ahref.length > 3 && ahref[3] == 'app') {
                                    let data = {
                                        Id: ahref[4]
                                    };
                                    if (!klink.getAttribute("dingPost")) {
                                        klink.setAttribute("dingPost", "dingPost");
                                        T2Post(
                                            "https://ddapi.133233.xyz/CheckId",
                                            data,
                                            function(response) {
                                                console.log("got response");
                                                let index;
                                                if (klink.childElementCount > 1){
                                                    index = 1;
                                                }else{
                                                    index= 0;
                                                }

                                                if (response.response.Data.Id == "0") {
                                                    klink.children[index].innerHTML = "<span style='color:red;'><b>（叮当未收录）</b></span>" + klink.children[index].innerHTML;
                                                } else {
                                                    let NickName = response.response.Data.NickName;
                                                    if (!NickName || NickName.length === 0 || NickName === "") {
                                                        NickName = "<span style='color:#ff683b;'><b>系统/匿名</b></span>（" + response.response.Data.Date;
                                                    }else{
                                                        NickName= "<span style='color:#ff683b;'><b>"+ NickName +"</b></span>（" + response.response.Data.Date;
                                                    }
                                                    klink.children[index].innerHTML = "<span style='color:green;'><b>叮当分享</b></span>：" + NickName + "）"+ klink.children[index].innerHTML;
                                                }
                                                klink.setAttribute("dingPrefix", "dingPrefix");
                                            }
                                        );
                                    }
                                } else if (ahref.length > 3 && ahref[3] == "bundle") {
                                    if (!klink.getAttribute("dingPost")) {
                                        let index;
                                        if (klink.childElementCount > 1){
                                            index = 1;
                                        }else{
                                            index= 0;
                                        }
                                        klink.setAttribute("dingPost", "dingPost");
                                        klink.children[index].innerHTML = "<span style='color:orange;'><b>（合集）</b></span>" + klink.children[index].innerHTML;
                                        klink.setAttribute("dingPrefix", "dingPrefix");
                                    }
                                } else if (ahref.length > 2 && ahref[3] == "sub") {
                                    if (!klink.getAttribute("dingPost")) {
                                        let index;
                                        if (klink.childElementCount > 1){
                                            index = 1;
                                        }else{
                                            index= 0;
                                        }
                                        klink.setAttribute("dingPost", "dingPost");
                                        klink.children[index].innerHTML = "<span style='color:orange;'><b>（礼包）</b></span>" + klink.children[index].innerHTML;
                                        klink.setAttribute("dingPrefix", "dingPrefix");
                                    }
                                }
                            }

                        }
                    }
                }
                else{
                    let ContentHubMainCarouselCapsule = document.getElementsByClassName("ContentHubMainCarouselCapsule");
                    if (ContentHubMainCarouselCapsule && ContentHubMainCarouselCapsule.length > 0) {
                        let children = ContentHubMainCarouselCapsule;
                        for (let i = 0; i < children.length; i++) {
                            let alink = children[i].getElementsByTagName('a');
                            if (alink && alink.length >2) {
                                let klink = alink[2];
                                let ahref = klink.getAttribute("href").split('/');
                                if (ahref.length > 3 && ahref[3] == 'app') {
                                    let data = {
                                        Id: ahref[4]
                                    };
                                    if (!klink.getAttribute("dingPost")) {
                                        klink.setAttribute("dingPost", "dingPost");
                                        T2Post(
                                            "https://ddapi.133233.xyz/CheckId",
                                            data,
                                            function(response) {
                                                console.log("got response");
                                                let index;
                                                if (klink.childElementCount > 2){
                                                    index = 2;
                                                }else if (klink.childElementCount > 1){
                                                    index = 1;
                                                }else{
                                                    index= 0;
                                                }

                                                if (response.response.Data.Id == "0") {
                                                    klink.children[index].innerHTML = "<span style='color:red;'>（叮当未收录）</span><span style=\"color: #6b8aaa;margin-right: 4px;margin-left: 4px;\">|</span>" + klink.children[index].innerHTML;
                                                } else {
                                                    let NickName = response.response.Data.NickName;
                                                    if (!NickName || NickName.length === 0 || NickName === "") {
                                                        NickName = "<span style='color:#ff683b;'><b>系统/匿名</b></span><span style=\"color: #6b8aaa;margin-right: 4px;margin-left: 4px;\">|</span>";
                                                    }else{
                                                        NickName= "<span style='color:#ff683b;'><b>"+ NickName +"</b></span><span style=\"color: #6b8aaa;margin-right: 4px;margin-left: 4px;\">|</span>";
                                                    }
                                                    //klink.children[index].innerHTML = "<span style='color:green;'>（已收录）</span>" + klink.children[index].innerHTML;
                                                    klink.children[index].outerHTML = "<span style='color:green;'><b>叮当分享</b></span>：" + NickName + klink.children[index].outerHTML;
                                                }
                                                klink.setAttribute("dingPrefix", "dingPrefix");
                                            }
                                        );
                                    }
                                } else if (ahref.length > 3 && ahref[3] == "bundle") {
                                    if (!klink.getAttribute("dingPost")) {
                                        let index;
                                        if (klink.childElementCount > 2){
                                            index = 2;
                                        }else if (klink.childElementCount > 1){
                                            index = 1;
                                        }else{
                                            index= 0;
                                        }
                                        klink.setAttribute("dingPost", "dingPost");
                                        klink.children[index].innerHTML = "<span style='color:orange;'>（合集）</span>" + klink.children[index].innerHTML;
                                        klink.setAttribute("dingPrefix", "dingPrefix");
                                    }
                                } else if (ahref.length > 2 && ahref[3] == "sub") {
                                    if (!klink.getAttribute("dingPost")) {
                                        let index;
                                        if (klink.childElementCount > 2){
                                            index = 2;
                                        }else if (klink.childElementCount > 1){
                                            index = 1;
                                        }else{
                                            index= 0;
                                        }
                                        klink.setAttribute("dingPost", "dingPost");
                                        klink.children[index].innerHTML = "<span style='color:orange;'>（礼包）</span>" + klink.children[index].innerHTML;
                                        klink.setAttribute("dingPrefix", "dingPrefix");
                                    }
                                }
                            }
                        }
                    }

                }
                let global_hover_content = document.getElementById('global_hover_content');
                if (global_hover_content) {
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
                                    function(response) {
                                        console.log("got response");
                                        if (response.response.Data.Id == "0") {
                                            //child.children[1].innerHTML = "<span style='color:red;'>（未收录）</span>" + child.children[1].innerHTML;
                                            child.children[1].outerHTML = child.children[1].outerHTML + "<div class=\"hover_release\" style=\"display: initial;\"><span style='color:green;'>叮当分享</span>: <span style='color:red;'>未收录</span></div><div></div>";
                                        } else {
                                            let NickName = response.response.Data.NickName;
                                            if (!NickName || NickName.length === 0 || NickName === "") {
                                                NickName = "<span style='color:#ff683b;'><b>系统/匿名</b></span>（" + response.response.Data.Date;
                                            }else{
                                                NickName= "<span style='color:#ff683b;'><b>"+ NickName +"</b></span>（" + response.response.Data.Date;
                                            }
                                            child.children[1].outerHTML = child.children[1].outerHTML + "<div class=\"hover_release\" style=\"display: initial;\"><span style='color:green;'>叮当分享</span>: " + NickName + "）</div><div></div>";
                                            //child.children[1].innerHTML = "<span style='color:green;'>（已收录）</span>" + child.children[1].innerHTML;
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
                } else {
                    let gamehover_BottomShelfOffScreen_Vseoa = document.querySelector(".gamehover_BottomShelfOffScreen_Vseoa");
                    if (gamehover_BottomShelfOffScreen_Vseoa) {
                        let children = gamehover_BottomShelfOffScreen_Vseoa.children;
                        for (let i = 0; i < children.length; i++) {
                            let alink = children[i].getElementsByTagName('a')[0];
                            if (alink) {
                                let ahref = alink.getAttribute("href").split('/');
                                if (ahref.length > 3 && ahref[3] == 'app') {
                                    let data = {
                                        Id: ahref[4]
                                    };
                                    if (!alink.getAttribute("dingPost")) {
                                        alink.setAttribute("dingPost", "dingPost");
                                        T2Post(
                                            "https://ddapi.133233.xyz/CheckId",
                                            data,
                                            function(response) {
                                                console.log("got response");
                                                if (response.response.Data.Id == "0") {
                                                    alink.children[0].innerHTML = "<span style='color:red;'>（未收录）</span>" + alink.children[0].innerHTML;
                                                } else {
                                                    alink.children[0].innerHTML = "<span style='color:green;'>（已收录）</span>" + alink.children[0].innerHTML;
                                                }
                                                alink.setAttribute("dingPrefix", "dingPrefix");
                                            }
                                        );
                                    }
                                } else if (ahref.length > 3 && ahref[3] == "bundle") {
                                    if (!alink.getAttribute("dingPost")) {
                                        alink.setAttribute("dingPost", "dingPost");
                                        alink.children[0].innerHTML = "<span style='color:orange;'>（合集）</span>" + alink.children[0].innerHTML;
                                        alink.setAttribute("dingPrefix", "dingPrefix");
                                    }
                                } else if (ahref.length > 2 && ahref[3] == "sub") {
                                    if (!alink.getAttribute("dingPost")) {
                                        alink.setAttribute("dingPost", "dingPost");
                                        alink.children[0].innerHTML = "<span style='color:orange;'>（礼包）</span>" + alink.children[0].innerHTML;
                                        alink.setAttribute("dingPrefix", "dingPrefix");
                                    }
                                }
                            }
                        }
                    } else {
                        //特惠
                        let facetedbrowse_FacetedBrowseItems = document.querySelector(".facetedbrowse_FacetedBrowseItems_NO-IP");
                        if (facetedbrowse_FacetedBrowseItems) {
                            let children = facetedbrowse_FacetedBrowseItems.children;
                            for (let i = 0; i < children.length; i++) {
                                let alink = children[i].getElementsByTagName('a')[1];
                                if (alink) {
                                    let ahref = alink.getAttribute("href").split('/');
                                    if (ahref.length > 3 && ahref[3] == 'app') {
                                        let data = {
                                            Id: ahref[4]
                                        };
                                        if (!alink.getAttribute("dingPost")) {
                                            alink.setAttribute("dingPost", "dingPost");
                                            T2Post(
                                                "https://ddapi.133233.xyz/CheckId",
                                                data,
                                                function(response) {
                                                    console.log("got response");
                                                    if (response.response.Data.Id == "0") {
                                                        alink.children[0].innerHTML = "<span style='color:red;'>（未收录）</span>" + alink.children[0].innerHTML;
                                                    } else {
                                                        alink.children[0].innerHTML = "<span style='color:green;'>（已收录）</span>" + alink.children[0].innerHTML;
                                                    }
                                                    alink.setAttribute("dingPrefix", "dingPrefix");
                                                }
                                            );
                                        }
                                    } else if (ahref.length > 3 && ahref[3] == "bundle") {
                                        if (!alink.getAttribute("dingPost")) {
                                            alink.setAttribute("dingPost", "dingPost");
                                            alink.children[0].innerHTML = "<span style='color:orange;'>（合集）</span>" + alink.children[0].innerHTML;
                                            alink.setAttribute("dingPrefix", "dingPrefix");
                                        }
                                    } else if (ahref.length > 2 && ahref[3] == "sub") {
                                        if (!alink.getAttribute("dingPost")) {
                                            alink.setAttribute("dingPost", "dingPost");
                                            alink.children[0].innerHTML = "<span style='color:orange;'>（礼包）</span>" + alink.children[0].innerHTML;
                                            alink.setAttribute("dingPrefix", "dingPrefix");
                                        }
                                    }
                                }
                            }
                        }else{
                            //热门 热销
                            let application_root = document.querySelector("#application_root");
                            if (application_root) {
                                let children = application_root.children;
                                for (let i = 0; i < children.length; i++) {
                                    let alink = children[i].getElementsByTagName('a');
                                    if (alink) {
                                        for(var k = 0; k < alink.length; k++){
                                            let klink = alink[k];
                                            let ahref = klink.getAttribute("href").split('/');
                                            if (ahref.length > 3 && ahref[3] == 'app') {
                                                let data = {
                                                    Id: ahref[4]
                                                };
                                                if (!klink.getAttribute("dingPost")) {
                                                    klink.setAttribute("dingPost", "dingPost");
                                                    T2Post(
                                                        "https://ddapi.133233.xyz/CheckId",
                                                        data,
                                                        function(response) {
                                                            console.log("got response");
                                                            let index;
                                                            if (klink.childElementCount > 2){
                                                                index = 2;
                                                            }else if (klink.childElementCount > 1){
                                                                index = 1;
                                                            }else{
                                                                index= 0;
                                                            }

                                                            if (response.response.Data.Id == "0") {
                                                                klink.children[index].innerHTML = "<span style='color:red;'>（未收录）</span>" + klink.children[index].innerHTML;
                                                            } else {
                                                                klink.children[index].innerHTML = "<span style='color:green;'>（已收录）</span>" + klink.children[index].innerHTML;
                                                            }
                                                            klink.setAttribute("dingPrefix", "dingPrefix");
                                                        }
                                                    );
                                                }
                                            } else if (ahref.length > 3 && ahref[3] == "bundle") {
                                                if (!klink.getAttribute("dingPost")) {
                                                    let index;
                                                    if (klink.childElementCount > 2){
                                                        index = 2;
                                                    }else if (klink.childElementCount > 1){
                                                        index = 1;
                                                    }else{
                                                        index= 0;
                                                    }
                                                    klink.setAttribute("dingPost", "dingPost");
                                                    klink.children[index].innerHTML = "<span style='color:orange;'>（合集）</span>" + klink.children[index].innerHTML;
                                                    klink.setAttribute("dingPrefix", "dingPrefix");
                                                }
                                            } else if (ahref.length > 2 && ahref[3] == "sub") {
                                                if (!klink.getAttribute("dingPost")) {
                                                    let index;
                                                    if (klink.childElementCount > 2){
                                                        index = 2;
                                                    }else if (klink.childElementCount > 1){
                                                        index = 1;
                                                    }else{
                                                        index= 0;
                                                    }
                                                    klink.setAttribute("dingPost", "dingPost");
                                                    klink.children[index].innerHTML = "<span style='color:orange;'>（礼包）</span>" + klink.children[index].innerHTML;
                                                    klink.setAttribute("dingPrefix", "dingPrefix");
                                                }
                                            }
                                        }

                                    }
                                }
                            }
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

}
//steamdb.info
else if (window.location.hostname == "steamdb.info") {
    let base_path_sp = window.location.pathname.split('/');
    //index page
    if (window.location.pathname === "/") {
        //get the sales table
        let targetNode1 = document.getElementsByTagName('tbody')[0];
        let config = {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        };

        let callback1 = mutations => {
            let children = document.getElementsByTagName("tbody");
            //restore all appid
            let appids = [];
            let childrenLength = children.length;
            for (let i = 0; i < childrenLength; i++) {
                let tmpchild = children[i].getElementsByTagName("tr");
                let tmpchildLength = tmpchild.length;
                for (let k = 0; k < tmpchildLength; k++) {
                    let tmpnode = tmpchild[k];
                    let tmptext = tmpnode.getElementsByClassName("css-truncate");
                    if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPost")) {
                        tmptext[0].setAttribute("dingPost", "dingPost");
                        let appid = tmpnode.getAttribute("data-appid");
                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                            appids.push(appid);
                        }
                    }

                }
            }


            if (appids.length != 0) {
                let data = {
                    "Ids": appids.join()
                };
                T2Post(
                    "https://ddapi.133233.xyz/CheckIds",
                    data,
                    function (response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i].getElementsByTagName("tr");
                            let tmpchildLength = tmpchild.length;
                            for (let k = 0; k < tmpchildLength; k++) {
                                let tmpnode = tmpchild[k];
                                let appid = tmpnode.getAttribute("data-appid");
                                let tmptext = tmpnode.getElementsByClassName("css-truncate");
                                if (tmptext && tmptext.length >0) {
                                    let tmp_href = new URL(tmptext[0].href);
                                    if (tmp_href.host == 'steamdb.info'){
                                        let path_sp = tmp_href.pathname.split('/');
                                        if (path_sp[1] == 'app') {
                                            if (appids.find(a => a == appid)) {
                                                if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                    tmptext[0].innerHTML = "<span style='color:green;'>（已收录）</span>" + tmptext[0].innerHTML;
                                                } else {
                                                    tmptext[0].innerHTML = "<span style='color:red;'>（未收录）</span>" + tmptext[0].innerHTML;
                                                }
                                                appids.splice(appids.indexOf(appid), 1);
                                                tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                            }
                                        } else if (path_sp[1] == 'bundle') {
                                            let tmptext = tmpnode.getElementsByClassName("subinfo");
                                            if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPrefix")) {
                                                tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                                tmptext[0].innerHTML = "<span style='color:orange;'>（合集）</span>" + tmptext[0].innerHTML;
                                            }
                                        } else if (path_sp[1] == 'sub') {
                                            let tmptext = tmpnode.getElementsByClassName("subinfo");
                                            if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPrefix")) {
                                                tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                                tmptext[0].innerHTML = "<span style='color:orange;'>（礼包）</span>" + tmptext[0].innerHTML;
                                            }
                                        }

                                    }

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
    //sales
    else if (base_path_sp.length > 0 && base_path_sp[1] == 'sales') {
        //get the sales table
        let targetNode1 = document.getElementsByTagName('tbody')[0];
        let config = {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        };

        let callback1 = mutations => {
            let children = document.getElementsByTagName("tbody");
            //restore all appid
            let appids = [];
            let childrenLength = children.length;
            for (let i = 0; i < childrenLength; i++) {
                let tmpchild = children[i].getElementsByTagName("tr");
                let tmpchildLength = tmpchild.length;
                for (let k = 0; k < tmpchildLength; k++) {
                    let tmpnode = tmpchild[k];
                    let tmptext = tmpnode.getElementsByClassName("applogo");
                    if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPost")) {
                        tmptext[0].setAttribute("dingPost", "dingPost");
                        let appid = tmpnode.getAttribute("data-appid");
                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                            appids.push(appid);
                        }
                    }

                }
            }

            if (appids.length != 0) {
                let data = {
                    "Ids": appids.join()
                };
                T2Post(
                    "https://ddapi.133233.xyz/CheckIds",
                    data,
                    function (response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i].getElementsByTagName("tr");
                            let tmpchildLength = tmpchild.length;
                            for (let k = 0; k < tmpchildLength; k++) {
                                let tmpnode = tmpchild[k];
                                let appid = tmpnode.getAttribute("data-appid");
                                let tmplink = tmpnode.getElementsByTagName("a");
                                let tmplinkLength = tmplink.length;
                                for (let y = 0; y < tmplinkLength;y++) {
                                    let tmp_href = new URL(tmplink[y].href);
                                    if (tmp_href.host == 'store.steampowered.com'){
                                        let path_sp = tmp_href.pathname.split('/');
                                        if (path_sp[1] == 'app') {
                                            let tmptext = tmpnode.getElementsByClassName("applogo");
                                            if (tmptext && tmptext.length >0 && appids.find(a => a == appid)) {
                                                let next_class = tmptext[0].nextElementSibling;
                                                if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                    next_class.children[0].innerHTML = "<span style='color:green;'>（已收录）</span>" + next_class.children[0].innerHTML;
                                                } else {
                                                    next_class.children[0].innerHTML = "<span style='color:red;'>（未收录）</span>" + next_class.children[0].innerHTML;
                                                }
                                                appids.splice(appids.indexOf(appid), 1);
                                                tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                            }
                                        } else if (path_sp[1] == 'bundle') {
                                            let tmptext = tmpnode.getElementsByClassName("applogo");
                                            let next_class = tmptext[0].nextElementSibling;
                                            if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPrefix")) {
                                                tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                                next_class.children[0].innerHTML = "<span style='color:orange;'>（合集）</span>" + next_class.children[0].innerHTML;
                                            }
                                        } else if (path_sp[1] == 'sub') {
                                            let tmptext = tmpnode.getElementsByClassName("applogo");
                                            let next_class = tmptext[0].nextElementSibling;
                                            if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPrefix")) {
                                                tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                                next_class.children[0].innerHTML = "<span style='color:orange;'>（礼包）</span>" + next_class.children[0].innerHTML;
                                            }
                                        }

                                    }

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
    //graph
    else if (base_path_sp.length > 0 && base_path_sp[1] == 'graph') {
        //get the sales table
        let targetNode1 = document.getElementsByTagName('tbody')[0];
        let config = {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        };

        let callback1 = mutations => {
            let children = document.getElementsByTagName("tbody");
            //restore all appid
            let appids = [];
            let childrenLength = children.length;
            for (let i = 0; i < childrenLength; i++) {
                let tmpchild = children[i].getElementsByTagName("tr");
                let tmpchildLength = tmpchild.length;
                for (let k = 0; k < tmpchildLength; k++) {
                    let tmpnode = tmpchild[k];
                    let tmptext = tmpnode.getElementsByClassName("applogo");
                    if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPost")) {
                        tmptext[0].setAttribute("dingPost", "dingPost");
                        let appid = tmpnode.getAttribute("data-appid");
                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                            appids.push(appid);
                        }
                    }

                }
            }

            if (appids.length != 0) {
                let data = {
                    "Ids": appids.join()
                };
                T2Post(
                    "https://ddapi.133233.xyz/CheckIds",
                    data,
                    function (response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i].getElementsByTagName("tr");
                            let tmpchildLength = tmpchild.length;
                            for (let k = 0; k < tmpchildLength; k++) {
                                let tmpnode = tmpchild[k];
                                let appid = tmpnode.getAttribute("data-appid");
                                let tmptext = tmpnode.getElementsByClassName("applogo");
                                if (tmptext && tmptext.length >0) {
                                    if (appids.find(a => a == appid)) {
                                        let next_class = tmptext[0].nextElementSibling;
                                        if (response.response.Data.AppInfo.find(a => a == appid)) {
                                            next_class.children[0].innerHTML = "<span style='color:green;'>（已收录）</span>" + next_class.children[0].innerHTML;
                                        } else {
                                            next_class.children[0].innerHTML = "<span style='color:red;'>（未收录）</span>" + next_class.children[0].innerHTML;
                                        }
                                        appids.splice(appids.indexOf(appid), 1);
                                        tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                    }
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
    //instantsearch
    else if (base_path_sp.length > 0 && base_path_sp[1] == 'instantsearch') {
        //get the sales table
        let targetNode1 = document.getElementsByClassName('row')[0];
        let config = {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        };

        let callback1 = mutations => {
            let children = document.getElementsByClassName("row");
            //restore all appid
            let appids = [];
            let childrenLength = children.length;
            for (let i = 0; i < childrenLength; i++) {
                let tmpchild = children[i].getElementsByTagName("li");
                let tmpchildLength = tmpchild.length;
                for (let k = 0; k < tmpchildLength; k++) {
                    let tmpnode = tmpchild[k];
                    let tmptext = tmpnode.getElementsByTagName("a");
                    if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPost")) {
                        tmptext[0].setAttribute("dingPost", "dingPost");
                        let appid = tmptext[0].getAttribute("data-appid");
                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                            appids.push(appid);
                        }
                    }

                }
            }

            if (appids.length != 0) {
                let data = {
                    "Ids": appids.join()
                };
                T2Post(
                    "https://ddapi.133233.xyz/CheckIds",
                    data,
                    function (response) {
                        console.log("got response for " + response.response.Data.Total + " appid");
                        //prefix all titles
                        for (let i = 0; i < childrenLength; i++) {
                            let tmpchild = children[i].getElementsByTagName("li");
                            let tmpchildLength = tmpchild.length;
                            for (let k = 0; k < tmpchildLength; k++) {
                                let tmpnode = tmpchild[k];
                                let tmptext = tmpnode.getElementsByTagName("a");
                                if (tmptext && tmptext.length >0) {
                                    let appid = tmptext[0].getAttribute("data-appid");
                                    if (appids.find(a => a == appid)) {
                                        let next_class = tmptext[0].getElementsByTagName("span");
                                        if (next_class){
                                            if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                next_class[0].innerHTML = "<span style='color:green;'>（已收录）</span>" + next_class[0].innerHTML;
                                            } else {
                                                next_class[0].innerHTML = "<span style='color:red;'>（未收录）</span>" + next_class[0].innerHTML;
                                            }
                                            appids.splice(appids.indexOf(appid), 1);
                                            tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                        }
                                    }
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
    //全局。目前主要是global_hover_content.
    let targetNode0 = document.querySelector('body');
    let config = {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true,
        attributeFilter: ['style']
    };
    let callback0 = mutations => {
        mutations.forEach(mutation => {
            try {
                let global_hover_content = document.getElementById('js-hover');
                if (global_hover_content) {
                    let global_hover_link = global_hover_content.getElementsByClassName('hover_title');
                    if (global_hover_link && global_hover_link.length > 0) {
                        let child = global_hover_link[0];
                        let href_sp = new URL(child.href).pathname.split('/');
                        if (href_sp[1] == "app") {
                            let data = {
                                Id: href_sp[2]
                            };
                            if (!child.getAttribute("dingPost")) {
                                child.setAttribute("dingPost", "dingPost");
                                T2Post(
                                    "https://ddapi.133233.xyz/CheckId",
                                    data,
                                    function(response) {
                                        console.log("got response");
                                        if (response.response.Data.Id == "0") {
                                            child.outerHTML = child.outerHTML + "<div class=\"hover_body hover_meta\"><span style='color:green;'>叮当分享: </span><span style='color:red;'><b>未收录</b></span></div>";
                                        } else {
                                            let NickName = response.response.Data.NickName;
                                            if (!NickName || NickName.length === 0 || NickName === "") {
                                                NickName = "<span style='color:#ff683b;'><b>系统/匿名</b></span>（" + response.response.Data.Date;
                                            }else{
                                                NickName= "<span style='color:#ff683b;'><b>"+ NickName +"</b></span>（" + response.response.Data.Date;
                                            }
                                            child.outerHTML = child.outerHTML + "<div class=\"hover_body hover_meta\"><span style='color:green;'>叮当分享</span>: " + NickName + "）</div>";
                                        }
                                        child.setAttribute("dingPrefix", "dingPrefix");
                                    }
                                );
                            }
                        } else if (child.id.slice(6, 12) == "bundle") {
                            if (!child.getAttribute("dingPost")) {
                                child.setAttribute("dingPost", "dingPost");
                                child.outerHTML = child.outerHTML + "<div class=\"hover_body hover_meta\">叮当: <span style='color:orange;'><b>合集</b></span></div>";
                                child.setAttribute("dingPrefix", "dingPrefix");
                            }
                        } else if (child.id.slice(6, 9) == "sub") {
                            if (!child.getAttribute("dingPost")) {
                                child.setAttribute("dingPost", "dingPost");
                                child.outerHTML = child.outerHTML + "<div class=\"hover_body hover_meta\">叮当: <span style='color:orange;'><b>礼包</b></span></div>";
                                child.setAttribute("dingPrefix", "dingPrefix");
                            }
                        }
                    }
                }
                let apps = document.querySelector("#apps");
                if (apps){
                    let children = apps.children;
                    //restore all appid
                    let appids = [];
                    let childrenLength = children.length;
                    for (let i = 0; i < childrenLength; i++) {
                        let tmpchild = children[i].getElementsByTagName("tr");
                        let tmpchildLength = tmpchild.length;
                        for (let k = 0; k < tmpchildLength; k++) {
                            let tmpnode = tmpchild[k];
                            let tmptext = tmpnode.getElementsByTagName("td");
                            if (tmptext && tmptext.length >0 && !tmptext[0].getAttribute("dingPost")) {
                                tmptext[0].setAttribute("dingPost", "dingPost");
                                let appid = tmpnode.getAttribute("data-appid");
                                if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                                    appids.push(appid);
                                }
                            }

                        }
                    }

                    if (appids.length != 0) {
                        let data = {
                            "Ids": appids.join()
                        };
                        T2Post(
                            "https://ddapi.133233.xyz/CheckIds",
                            data,
                            function (response) {
                                console.log("got response for " + response.response.Data.Total + " appid");
                                //prefix all titles
                                for (let i = 0; i < childrenLength; i++) {
                                    let tmpchild = children[i].getElementsByTagName("tr");
                                    let tmpchildLength = tmpchild.length;
                                    for (let k = 0; k < tmpchildLength; k++) {
                                        let tmpnode = tmpchild[k];
                                        let appid = tmpnode.getAttribute("data-appid");
                                        if (appid && appid.length >1 && appid.length < 10 && isInteger(appid)){
                                            let tmptext = tmpnode.getElementsByTagName("td");
                                            if (tmptext && tmptext.length >0 && appids.find(a => a == appid)) {
                                                if (response.response.Data.AppInfo.find(a => a == appid)) {
                                                    tmptext[2].innerHTML = "<span style='color:green;'>（已收录）</span>" + tmptext[2].innerHTML;
                                                } else {
                                                    tmptext[2].innerHTML = "<span style='color:red;'>（未收录）</span>" + tmptext[2].innerHTML;
                                                }
                                                appids.splice(appids.indexOf(appid), 1);
                                                tmptext[0].setAttribute("dingPrefix", "dingPrefix");
                                            }
                                        }

                                    }
                                }
                            }
                        );
                    }

                }
                let depot_node = document.querySelector("#depots");
                if (depot_node && !depot_node.getAttribute("dingPost")){
                    depot_node.setAttribute("dingPost", "dingPost");
                    let depots = [];
                    //body
                    let children = depot_node.getElementsByTagName("tbody");
                    //restore all appid
                    let childrenLength = children.length;
                    for (let i = 0; i < childrenLength; i++) {
                        let tmpchild = children[i].getElementsByTagName("tr");
                        let tmpchildLength = tmpchild.length;
                        for (let k = 0; k < tmpchildLength; k++) {
                            let depotnode = tmpchild[k].getElementsByTagName("a");
                            if (depotnode && depotnode.length >0){
                                let depotid = depotnode[0].innerText;
                                if (depotid && depotid.length >1 && depotid.length < 10 && isInteger(depotid)){
                                    depots.push(depotid);
                                }
                            }
                        }
                    }
                    if (depots.length != 0) {
                        let data = {
                            "Ids": depots.join()
                        };
                        T2Post(
                            "https://ddapi.133233.xyz/CheckIdsDepot",
                            data,
                            function (response) {
                                console.log("got response for " + response.response.Data.Total + " depots");
                                let children = depot_node.getElementsByTagName("tbody");
                                //restore all appid
                                let childrenLength = children.length;
                                //prefix DLC table
                                for (let i = 0; i < childrenLength; i++) {
                                    let tmpchild = children[i].getElementsByTagName("tr");
                                    let tmpchildLength = tmpchild.length;
                                    for (let k = 0; k < tmpchildLength; k++) {
                                        let depotnode = tmpchild[k].getElementsByTagName("a");
                                        if (depotnode && depotnode.length >0){
                                            let depotid = depotnode[0].innerText;
                                            if (depotid && depotid.length >1 && depotid.length < 10){
                                                if (depots.find(a => a == depotid)) {
                                                    let tmptext = tmpchild[k].getElementsByTagName("td");
                                                    if (tmptext && tmptext.length >0) {
                                                        if (response.response.Data.AppInfo.find(a => a == depotid)) {
                                                            tmptext[1].innerHTML = "<span style='color:green;font-style: normal;'>（已收录）</span>" + tmptext[1].innerHTML;
                                                        } else {
                                                            tmptext[1].innerHTML = "<span style='color:red;font-style: normal;'>（未收录）</span>" + tmptext[1].innerHTML;
                                                        }
                                                    }
                                                    depots.splice(depots.indexOf(depotid), 1);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        );
                    }
                }
            } catch (e) {
                //exception handle;
            }
        })
    }

    const observer0 = new MutationObserver(callback0);
    observer0.observe(targetNode0, config);
}
