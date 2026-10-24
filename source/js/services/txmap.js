/*
 * 修正后的腾讯地图欢迎小组件
 * 修复了原始代码中的异步竞争问题
 */

// 1. 距离计算函数 (来自您的文件)
function getDistance(e1, n1, e2, n2) {
    const R = 6371;
    const { sin, cos, asin, PI, hypot } = Math;
    let getPoint = (e, n) => {
        e *= PI / 180;
        n *= PI / 180;
        return { x: cos(n) * cos(e), y: cos(n) * sin(e), z: sin(n) };
    };

    let a = getPoint(e1, n1);
    let b = getPoint(e2, n2);
    let c = hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    let r = asin(c / 2) * 2 * R;
    return Math.round(r);
}

// 2. 欢迎语显示函数
//    (来自您的文件，但修改为接收一个参数 'ipData')
function showWelcome(ipData) {

    // 增加一个健壮性检查，以防 API key 错误
    if (!ipData || ipData.status !== 0) {
        try {
            document.getElementById("welcome-info").innerHTML = "<b><center>❌ 定位失败</center>&emsp;&emsp;无法获取访客信息，API Key 可能已失效或未配置白名单。</b>";
        } catch (err) { }
        return; // 结束函数
    }

    // (以下代码来自您的文件，但 'ipLoacation' 已被 'ipData' 替换)
    let dist = getDistance(113.34499552, 23.15537143, ipData.result.location.lng, ipData.result.location.lat); //这里换成自己的经纬度
    let pos = ipData.result.ad_info.nation;
    let ip;
    let posdesc;
    //根据国家、省份、城市信息自定义欢迎语
    switch (ipData.result.ad_info.nation) {
        case "日本":
            posdesc = "よろしく，一起去看樱花吗";
            break;
        case "美国":
            posdesc = "Let us live in peace!";
            break;
        case "英国":
            posdesc = "想同你一起夜乘伦敦眼";
            break;
        case "俄罗斯":
            posdesc = "干了这瓶伏特加！";
            break;
        case "法国":
            posdesc = "C'est La Vie";
            break;
        case "德国":
            posdesc = "Die Zeit verging im Fluge.";
            break;

        // ... (省略您其他的 case) ...
        
        case "中国":
            pos = ipData.result.ad_info.province + " " + ipData.result.ad_info.city + " " + ipData.result.ad_info.district;
            ip = ipData.result.ip;
            switch (ipData.result.ad_info.province) {
        
        // ... (省略您所有的省份 case) ...
                
                default:
                    posdesc = "带我去你的城市逛逛吧！";
                    break;
            }
            break;
        default:
            posdesc = "带我去你的国家逛逛吧。";
            break;
    }

    //根据本地时间切换欢迎语
    let timeChange;
    let date = new Date();
    if (date.getHours() >= 5 && date.getHours() < 11) timeChange = "<span>上午好</span>，一日之计在于晨！";
    else if (date.getHours() >= 11 && date.getHours() < 13) timeChange = "<span>中午好</span>，该摸鱼吃午饭了。";
    else if (date.getHours() >= 13 && date.getHours() < 15) timeChange = "<span>下午好</span>，懒懒地睡个午觉吧！";
    else if (date.getHours() >= 15 && date.getHours() < 16) timeChange = "<span>三点几啦</span>，一起饮茶呀！";
    else if (date.getHours() >= 16 && date.getHours() < 19) timeChange = "<span>夕阳无限好！</span>";
    else if (date.getHours() >= 19 && date.getHours() < 24) timeChange = "<span>晚上好</span>，夜生活嗨起来！";
    else timeChange = "夜深了，早点休息，少熬夜。";

    try {
        //自定义文本和需要放的位置
        document.getElementById("welcome-info").innerHTML =
            `<b><center>🎉 欢迎信息 🎉</center>&emsp;&emsp;欢迎来自 <span style="color:var(--theme-color)">${pos}</span> 的小伙伴，${timeChange}您现在距离站长约 <span style="color:var(--theme-color)">${dist}</span> 公里，当前的IP地址为： <span style="color:var(--theme-color)">${ip}</span>， ${posdesc}</b>`;
    } catch (err) {
        // console.log("Pjax无法获取#welcome-info元素🙄🙄🙄")
    }
}


// 3. (新) 创建一个启动函数
//    这个函数包含 AJAX 请求，并在成功后调用 showWelcome
function initTxMapWelcome() {
    // 检查页面上是否存在 #welcome-info 元素，如果不存在，则不执行
    // 这样可以避免在没有小组件的页面上浪费 API 调用
    if (!document.getElementById('welcome-info')) {
        return;
    }

    $.ajax({
        type: 'get',
        url: 'https://apis.map.qq.com/ws/location/v1/ip',
        data: {
            key: 'UWFBZ-JY3C7-BJIXC-H5ITJ-S5C72-4IFER', // !! 确保您填入了 KEY !!
            output: 'jsonp',
        },
        dataType: 'jsonp',
        success: function (res) {
            // ----------------------------------------
            // !! 核心修复 !!
            // 只有在 AJAX 成功后，才调用 showWelcome
            // 并把获取到的结果(res)作为参数传递进去
            showWelcome(res); 
            // ----------------------------------------
        },
        error: function(err) {
            // 处理 AJAX 请求本身的失败 (例如网络中断)
             try {
                document.getElementById("welcome-info").innerHTML = "<b><center>❌ 定位失败</center>&emsp;&emsp;无法连接到腾讯定位服务。</b>";
            } catch (e) {}
        }
    });
}

// 4. (新) 设置事件监听
//    使用 jQuery 的 $(function() {}) 
//    这可以确保在 jQuery ($) 和 DOM 都加载完毕后执行
$(function() {
    initTxMapWelcome(); // 页面首次加载时运行
});

// 5. (保留) 保留 pjax 监听器
//    (这行代码来自您的文件，是正确的)
document.addEventListener('pjax:complete', initTxMapWelcome);

// 6. (已删除) 移除了您文件中旧的、错误的 'window.onload = showWelcome;'