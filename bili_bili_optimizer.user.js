// ==UserScript==
// @name         bili_bili_optimizer
// @namespace    https://github.com/Kyouichirou
// @version      1.4.6
// @description  control bilibili!
// @author       Lian, https://kyouichirou.github.io/
// @icon         https://www.bilibili.com/favicon.ico
// @homepage     https://github.com/Kyouichirou/BiliBili_Optimizer
// @updateURL
// @downloadURL  https://github.com/Kyouichirou/BiliBili_Optimizer/raw/main/bili_bili_optimizer.user.js
// @match        https://t.bilibili.com/
// @match        https://www.bilibili.com/*
// @match        https://space.bilibili.com/*
// @match        https://search.bilibili.com/*
// @grant        GM_info
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        window.close
// @grant        unsafeWindow
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener
// @noframes
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';
    // --------------- GM内置函数/对象
    const GM_Objects = {
        /**
         * 提示信息
         * @param {string} content
         * @param {string} title
         * @param {number} duration
         * @param {Function} cfunc
         * @param {Function} ofunc
         * @returns {null}
         */
        notification: (content = "", title = "info", duration = 3500, cfunc, ofunc) => GM_notification({ text: content, title: title, timeout: duration, onclick: cfunc, ondone: ofunc }),
        /**
         * 读取值
         * @param {string} key_name
         * @param {any} default_value
         * @returns {any}
         */
        get_value: (key_name, default_value = null) => GM_getValue(key_name, default_value),
        /**
         * 设置值
         * @param {string} key_name
         * @param {any} value
         * @returns {any}
         */
        set_value: (key_name, value) => GM_setValue(key_name, value),
        /**
         * 注入css, 返回注入的css节点
         * @param {string} css
         * @returns {HTMLElement}
         */
        addstyle: (css) => GM_addStyle(css),
        /**
         * 注册菜单事件, 返回注册id
         * @param {string} name
         * @param {Function} callback_func
         * @returns {HTMLElement}
         */
        registermenucommand: (name, callback_func) => GM_registerMenuCommand(name, callback_func),
        /**
         * 解除菜单注册, 接受参数, 注册的id
         * @param {number} cid
         * @returns {null}
         */
        unregistermenucommand: (cid) => GM_unregisterMenuCommand(cid),
        /**
         * 判断监听值的修改是否来自非当前页面
         * @param {Function} func
         * @returns {Function}
         */
        _check_from_remote: (func) => (...args) => args[3] && func(...args),
        /**
         * 监听键值的变化, 返回监听id
         * @param {string} key_name
         * @param {Function} func
         * @returns {number}
         */
        addvaluechangeistener(key_name, callback_func) { return GM_addValueChangeListener(key_name, this._check_from_remote(callback_func)); },
        /**
         * 打开链接
         * @param {string} url
         * @param {object} configs
         * @returns {null}
         */
        openintab: (url, configs) => GM_openInTab(url, configs),
        /**
         * 复制内容到剪切板
         * @param {string} content
         * @param {string} type
         * @param {Function} func
         * @returns {null}
         */
        copy_to_clipboard: (content, type, func) => GM_setClipboard(content, type, func),
        // 关闭标签页
        window_close: () => window.close(),
        // 脚本信息
        info: GM_info,
        // 宿主页面window
        window: unsafeWindow,
        // 判断是否支持监听url的改变
        supportonurlchange: window.onurlchange,
    };
    // GM内置函数/对象 ---------------

    // --------------- 通用函数
    // 自定义打印内容
    const Colorful_Console = {
        _colors: {
            warning: "#F73E3E",
            debug: "#327662",
            info: "#1475b2",
        },
        /**
         * 执行打印
         * @param {string} content
         * @param {string} type
         * @param {boolean} mode
         */
        main(content, type = 'info', mode = false) {
            const bc = this._colors[type];
            const title = bc ? type : (bc = this._colors.info, 'info');
            const params = [
                `%c ${title} %c ${content} `,
                "padding: 1px; border-radius: 3px 0 0 3px; color: #fff; font-size: 12px; background: #606060;",
                `padding: 1px; border-radius: 0 3px 3px 0; color: #fff; font-size: 12px; background: ${bc};`
            ];
            console.log(...params), mode && GM_Objects.notification(content, type);
        }
    };
    // 基本信息匹配
    const Base_Info_Match = {
        // video id
        _video_id_reg: /[a-z\d]{10,}/i,
        // up uid, up的长度范围很广从1位数到16位数
        _up_id_reg: /(?<=com\/)\d+/,
        /**
         * 匹配执行
         * @param {RegExp} reg
         * @param {string} href
         * @returns {string}
         */
        _match(reg, href) { return href.match(reg)?.[0] || ''; },
        /**
         * 匹配视频id
         * @param {string} href
         * @returns {string}
         */
        get_video_id(href) { return this._match(this._video_id_reg, href); },
        /**
         * 匹配up id
         * @param {string} href
         * @returns {string}
         */
        get_up_id(href) { return this._match(this._up_id_reg, href); }
    };
    // 通用函数 ---------------

    // Bayes_Module ----------
    class Bayes_Module {
        // 分词器
        #segmenter = null;
        // 提取英文单词
        #abc_reg = /[a-z]+/ig;
        // 提取数字
        #num_reg = /[0-9]+/g;
        // 提取年份和12306
        #year_reg = /20[0-2][0-9]|12306/g;
        // 清除空格,数字, 单词
        #clear_reg = /[a-z0-9\s]+/ig;
        // 预置内容
        #white_list = [
            '开始是生成器，看完就变协程了',
            '99%的教程都没讲明白的yieldfrom有那么难嘛？|PythonAsyncIO从入门到放弃06',
            'Python迭代器深入讲解|【AsyncIO从入门到放弃#1】',
            '回调未来|PythonAsyncIO从入门到放弃09',
            '自制EventLoop|PythonAsyncIO从入门到放弃08',
            '这也许是asyncio中最关键的一行代码|PythonAsyncIO从入门到放弃07',
            '99%的教程都没讲明白的yieldfrom有那么难嘛？|PythonAsyncIO从入门到放弃06',
            '原来yield要这样用才叫真正的协程|PythonAsyncIO从入门到放弃05',
            '明明是生成器，却偏说是协程，你是不是在骗我？|PythonAsyncIO从入门到放弃04',
            '开始是生成器，看完就变协程了',
            'Python用yield关键字定义生成器【AsyncIO从入门到精通#2】',
            'Python迭代器深入讲解|【AsyncIO从入门到放弃#1】',
            'docker初印象|零基础快速入门',
            'Python装饰器实战技巧|Python进阶',
            '写Python装饰器的套路|Python进阶',
            'Python函数参数|深入理解*args和**kwargs|Python进阶',
            '使用minikube快速搭建Kubernetes集群|v1.7.3',
            'GameofPODs-Kubernetes|看完这个，你想学K8s了么',
            '初学python者最容易产生的误解|无废话5分钟快速解释',
            'VirtualBox上的OpenStack如何调通外部网络|使用Kolla搭建',
            '详解Python命名空间|全局变量和局部变量和自由变量|Python进阶',
            '【秒懂】5分钟学会SSH端口转发，远程工作用得着|如何充分利用云服务器',
            '10个例子，刷新你对Python变量的认知|使用Thonny解剖式讲解|Python入门到进阶',
            '安装不算完事，只有理解了虚拟环境才算真正掌握Python环境',
            '善用帮助和文档，Python自学不求人',
            '尝试用Python写病毒仿真程序',
            '比IDLE好用，这款Python初学者专属IDEThonny值得拥有',
            '1分钟设置pip镜像源，不用费心去记配置文件放在哪',
            'Python迭代器深入讲解|【AsyncIO从入门到放弃#1】',
            'Python用yield关键字定义生成器【AsyncIO从入门到精通#2】',
            '开始是生成器，看完就变协程了',
            '明明是生成器，却偏说是协程，你是不是在骗我？|PythonAsyncIO从入门到放弃04',
            '原来yield要这样用才叫真正的协程|PythonAsyncIO从入门到放弃05',
            '全网最好的Python进阶课程-Python3：深入探讨（序列、迭代器、生成器、上下文管理器）中英字幕',
            '【中英字幕】2023哈弗大学CS50Python&JavaScriptWeb开发课程-14个小时完整版',
            '5个小时PySide6完全开发指南使用Qt进行PythonGUI桌面应用开发（中英字幕）',
            '【YouTube热门+中文字幕】Python开发者学习Rust最佳路径-FromPythontoRust',
            '2022Python教程：Simplilearn10小时Python完整入门课程（中英字幕）',
            'Python区块链开发教程-Solidity，区块链和智能合约核心概念及全栈开发课程（中英文字幕）',
            '【Udemy2022Python超级课程】通过构建10个基于现实世界的应用程序-学习Pytho核心技能（中英文字幕）下',
            '【Udemy2022Python超级课程】通过构建10个基于现实世界的应用程序-学习Pytho核心技能（中英文字幕）上',
            '【Udemy付费课程】PythonNLP自然语言处理（SpaCy、NLTK、Sklearn、CNN）和8实践个项目（中英文字幕）',
            '【Udemy高分付费课程】2022Python数据科学和机器学习训练营-Tensorflow、深度学习、神经网络、回归分类、人工智能（中英文字幕）',
            '【Udemy高分付费课程】Python数据结构与算法-终极Python编码面试和计算机科学训练营（中英文字幕）',
            '【Udemy高分Python机器学习课程】2022完整训练营-使用Tensorflow、Pandas进行Python机器学习（中英文字幕）下',
            '【Udemy高分Python机器学习课程】2022完整训练营-使用Tensorflow、Pandas进行Python机器学习（中英文字幕）上',
            '【UdemyPython机器学习】在Python中学习机器学习、深度学习、贝叶斯学习和模型部署（中英文字幕）',
            '【Udemy排名第一的Python课程】2022PythonPRO训练营-100天构建100个Python项目成为实战专家！（中英文字幕）P3',
            '【Udemy排名第一的Python课程】2022PythonPRO训练营-100天构建100个Python项目成为实战专家！（中英文字幕）P2',
            '【Udemy排名第一的Python课程】2022PythonPRO训练营-100天构建100个Python项目成为实战专家！（中英文字幕）P1',
            '【Mosh1个小时入门Python】PythonforBeginners-LearnPythonin1Hour（中英文字幕）',
            '【YouTube百万粉丝大神Mosh】Python系列完整教程（中英文字幕）',
            '【Udemy付费课程】使用PyQt6和Qt设计器进行PythonGUI开发（中英文字幕）',
            '【Udemy付费课程】Python机器学习和Python深度学习与数据分析、人工智能、OOP和Python项目（中英文字幕）',
            '【油管BroCode】面向初学者的Python基础入门教程-->Pythontutorialforbeginners-->（中英文字幕）',
            '【Udemy付费课程】RESTAPIswithFlaskandPython-->Flask基础课程（中英文字幕）',
            '【Udemy付费课程】Django4andPythonFull-StackDeveloperMasterclass->Python全栈开发者大师课',
            '【Udemy付费课程】AdvancedRESTAPIswithFlaskandPython-->PythonFlask进阶课程（中英文字幕）',
            '【Udemy付费课程】PythonDjango2021-CompleteCourse-->PythonDjango开发指南（中英文字幕）',
            '【Udemy付费课程】PythonforAbsoluteBeginners-->面向初学者的Python入门教程（中英文字幕）',
            '强化学习遇上优化-SARSAfor最短路',
            '强化学习遇上优化-Qlearningfor最短路',
            '用Python从视频里面扒PPT？',
            '2023年，我在用哪些VSCODE插件？',
            '流畅的Python',
            'CythoninPython',
            '【Python进阶】Py-spy—最佳性能分析工具，你的程序到底慢在哪',
            '【不能错过的VIM命令】（3）想改啥，就改啥',
            '【不能错过的VIM命令】（2）想去哪，就去哪',
            '【不能错过的VIM命令】（1）输入、保存',
            '【简单算法】数学建模瘦身法进阶，1秒还不够快？！',
            '【简单算法】关于我用数学规划秒秒钟做了一个月的瘦身计划这件事',
            '【简单算法】线性规划——手把手实现交替方向乘子法ADMM',
            '【简单算法】线性规划—手把手实现增广拉格朗日乘子法',
            '【简单算法】最短路径—迪节斯特拉算法梳理及coding',
            '【ChatGPT】还在傻傻敲Prompt？用这个工具就够了',
            '【简单算法】最短路径—纯手动迪节斯特拉算法',
            '【你真的会用ChatGPT吗】1.Prompt模板',
            '「Python」VSCode如何搭建Python开发环境？VSCode如何运行Python代码',
            '「Python」什么是变量？如何定义变量？如何为变量赋值',
            '「Python」什么是数据类型？数字，字符串与布尔类型介绍',
            '「Python」基础教程什么是列表和元组？列表和元组的书写格式以及区别',
            '「Python」基础教程什么是字典？字典的书写格式',
            '「Python」基础教程什么是集合？集合和列表的区别',
            '「Python」基础教程什么是条件控制语句？if语句的书写格式',
            '「Python」基础教程什么是循环语句？while语句的书写格式，如何跳出while循环',
            '「Python」基础教程循环语句for的书写格式，for语句可以遍历的目标有哪些',
            '「Python」基础教程函数有什么作用？如何定义函数',
            '「Python」进阶教程什么是模块？如何创建导入和使用模块',
            '「Python」进阶教程类有什么作用？如何定义和使用类',
            '「Python」进阶教程什么是构造方法？构造方法__init__以及参数self的作用',
            '「Python」进阶教程类的方法有什么作用？如何定义和调用类的方法',
            '「Python」进阶教程什么是类的继承？继承的作用，如何实现类的继承',
            '「Python」进阶教程方法重写有什么用？如何实现类的方法重写？使用super访问父类',
            '「Python」进阶教程什么是文件？如何读取写入文件？文件读写相关函数介绍',
            '「Python」进阶教程什么是异常？如何处理异常？tryexcept语句的书写格式',
            '「Python」进阶教程随机数有什么用？如何生成随机数？random和randint的区别',
            '「Python」进阶教程日期时间有什么用？如何获取当前日期时间',
            '「Python」高级教程什么是内部函数？内部函数的作用，如何定义内部函数',
            '「Python」高级教程什么是内部类？如何定义和使用内部类',
            '「Python」高级教程什么是变量的作用域？变量的作用范围和检索顺序',
            '「Python」高级教程函数和方法如何修改模块变量？关键字global的作用以及书写格式',
            '「Python」高级教程如何修改上一级变量？关键字nonlocal的作用以及书写格式',
            '「Python」高级教程类的私有成员的作用是什么？如何定义类的私有字段和方法',
            '「Python」高级教程类的静态字段的作用是什么？如何定义和使用类的静态字段',
            '「Python」高级教程类和实例访问静态字段的区别是什么？实例修改静态字段陷阱',
            '「Python」高级教程如何定义和调用类的静态方法？staticmethod与classmethod的区别',
            '「Python」高级教程什么是JSON？JSON的书写格式，JSON与Python对象之间的转换',
            '【python】字节码和虚拟机？python代码竟然是这么执行的！',
            '【python】B站没人讲过的CodeObject，python底层实现一点都不简单！',
            '【python】python的骨架frame——你写的代码都是运行在它里面的？',
            '【python】看似简单的加法，背后究竟有多少代码需要运行？看了才知道！',
            '【python】天使还是魔鬼？GIL的前世今生。一期视频全面了解GIL！',
            '【python】你知道描述器是多么重要的东西嘛？你写的所有程序都用到了！',
            '【python】装饰器超详细教学，用尽毕生所学给你解释清楚，以后再也不迷茫了！',
            '【python】一个公式解决所有复杂的装饰器，理解了它以后任何装饰器都易如反掌！',
            '【python】如何在class内部定义一个装饰器？这里的坑你要么不知道，要么不会填！',
            '【python】生成器是什么？怎么用？能干啥？一期视频解决你所有疑问！',
            '【python】对迭代器一知半解？看完这个视频就会了。涉及的每个概念，都给你讲清楚！',
            '【python】闭包的实现机制。嵌套函数怎么共享变量的？',
            '【python】python中什么会被当真？你知道if判断背后的规则吗？',
            '【python】你知道定义class背后的机制和原理嘛？当你定义class的时候，python实际运行了什么呢？',
            '【python】你知道MRO是什么嘛？你知道多继承的顺序是怎么决定的嘛？你知道这个视频是B站最硬核的MRO教程嘛？',
            '【python】class里定义的函数是怎么变成方法的？函数里的self有什么特殊意义么？',
            '【python】metaclass理解加入门，看完就知道什么是元类了。',
            '【python】__slots__是什么东西？什么？它还能提升性能？它是如何做到的！？',
            '【python】B站最细致的super()详解，一定有你不知道的知识！',
            '【python】staticmethod与classmethod深度机制解析——要知其所以然',
            '【python】加俩下划线就私有了？聊聊python的私有变量机制。为什么说它不是真的私有变量？',
            '【python】定义好的变量读不出来？详解全局变量和自由变量的使用！',
            '【python】TypeHint入门与初探，好好的python写什么类型标注？',
            '【python】TypeHint的进阶知识，这下总该有你没学过的内容了吧？',
            '【python】Python的N种退出姿势，你都了解嘛？一期视频让你把每种方法都搞清楚！',
            '【python】你听说过namedtuple嘛？会用嘛？知道它实现的原理嘛？',
            '【python】mutable和immutable其实根本没区别？带你了解这个概念背后你没思考过的东西',
            '【python】内存管理结构初探——我要的内存从哪儿来的？',
            '【python】Unreachable的对象咋回收的？generation又是啥？',
            '【python】和python开发人员用同一套命名系统，一期视频就学会！',
        ];
        #black_list = [
            '【Python爬虫】用Python爬取各大平台VIP电影，不花钱也能享受付费一般的待遇，这不轻轻松松？',
            'PyCharm安装激活教程，一键使用永久激活，新手宝宝可以直接入手！！！',
            '【python自动化】用python代码写一个前端打地鼠游戏，精准自动打地鼠机器人，边学边玩！',
            '【Python爬虫】教你用Python爬取漫画资源，Python批量下载付费漫画，实现免费阅读，永久白嫖！！',
            '【Python爬虫】一分钟教你追剧看电影不求人！python爬虫代码一分钟教你爬取各平台电影视频，小白也能学会！',
            '【Python爬虫】教你用Python爬取网易云音乐免费听音乐，实现听歌自由，批量下载付费音乐，源码可分享！',
            '【Python自动化脚本】用Python实现办公自动化，一键生成PPT演示文稿（源码可分享）步骤简单，轻松上手！',
            '【Python爬虫】毕业生学习项目教你用Python爬虫爬取百度文库vip资源，操作简单，有手就会（附源码）！！！',
            '【Python自动化脚本】Python实现OCR识别提取图片文字，多语言支持，操作简单新手小白也能学会，附源码！！！',
            '【Python爬虫】用Python爬取各大平台VIP电影，不花一分钱也能享受付费的待遇，妈妈再也不用但心乱花钱了',
            '【提供源码】教你用Python爬取知网数据，批量下载论文摘要！步骤简单，小白也能学会！Python爬虫/中国知网',
            '【Python游戏】用20行Python代码，制作不一样的超级玛丽游戏，手把手教学，制作简单，小白也能学会！！',
            '【Python自动化】Python自动答题辅助脚本！python代码实现快速答题，在线考试，正确率100%',
            'Python实现OCR识别提取图片文字，多语言支持，步骤简单小白也能学',
            '【python自动化】用python代码写一个前端打地鼠游戏，精准自动打地鼠机器人，边学边玩！',
            '【Python爬虫】两分钟教你用Python爬取漫画资源，Python批量下载付费漫画，实现免费阅读，永久白嫖！！',
            '【Python爬虫】用Python爬取各大平台VIP电影，不花钱也能享受付费一般的待遇，这不轻轻松松？',
            '【Python爬虫】教你用Python免费听音乐，实现听歌自由，批量下载付费音乐，源码可分享！',
            'PyCharm安装激活教程，一键使用永久激活，新手宝宝可以直接入手！！！',
            '【Python爬虫】2023最新Python安装视频，一键激活永久使用，小白必备，附安装包激活码分享！',
            '【从0→1】3天搞定Python爬虫，即学即用！',
            '【Python函数】Python基础打不打的劳，这50个函数必须掌握！！',
            'Python太牛了，用代码就是实现电脑自动玩笨鸟先飞游戏',
            '天呐！Python自动玩2048也太变态了吧',
            '【附源码】Python实用小技巧-实现自动获取海量IP',
            '【附源码】Python自动化办公之自动发工资条！！',
            '【Python爬虫】Python一分钟白嫖超清vip壁纸，轻松实现壁纸自由！',
            'Python实现12306自动抢票，100%成功，春节出行无忧！不用熬夜抢票啦！',
            '【Python实战】Python还不熟练？多实战敲敲这个打地鼠游戏吧！',
            '【附源码】过年了，不得给好朋友准备一个特别的礼物？',
            '【Python爬虫】2024了，是谁还在尬聊啊？Python爬取百度表情包，分分钟成为表情包大户',
            '【js逆向案例-超简单】百度翻译爬虫逆向',
            '【附源码】Python爬虫实战，猫眼电影一闪一闪亮星星影评爬虫及可视化',
            '【附源码】Python自动化脚本，实现微信自动回复',
            'Python自动抢购，准点秒杀飞天茅台，过年送礼不愁啦！',
            '【附源码】Python必练入门实战小项目，不会还有人不会吧～～',
            '【附源码】手把手教你800行代码自制蔡徐坤打篮球小游戏！',
            '【Python游戏】超级牛！几十行代码就做出了一个【水果忍者】游戏！',
            '【Python爬虫】Python实现超清4k壁纸下载，附源码~',
            '【附源码】手把手教你用Python开发俄罗斯方块小游戏_Python练手项目_巩固python基础_Python小游戏',
            '【2024版】Python一分钟破解WiFi密码，随时随地上网，根本不缺流量！',
            '【源码可分享】简单用500行Python代码，复刻游戏《我的世界》，无需插件，零基础也能轻松上手！',
            '【大麦网抢票】最新攻略！Python自动购票脚本，各大演唱会门票轻松购~',
            '【附源码】Python实现12306自动抢票！寒假不愁，出行无忧！',
            '【附源码】小说党福音！一分钟暴力爬取各平台VIP小说，快码住',
            '【python学习】给所有python人一个忠告，普通人学python玩的就是信息差！！！',
            '国内新兴行业已经崛起,真心建议大家冲一冲新兴领域，工资高不内卷!!!',
            '【python学习】张雪峰：给所有python人一个忠告，普通人学python玩的就是信息差！！！',
            '【python大麦抢票】大麦网自动抢票脚本，原价秒杀门票，成功率100%！！！',
            '真心的建议大家都冲一冲新兴领域！！！工资高不内卷，一定要试试哦不然可会后悔的！！！',
            '【python资料】张雪峰：给所有python人一个忠告，普通人学python玩的就是信息差！！！',
            '【python资料】python真的没有大家想的那么难，只要找对方法，那就会很简单啦！！！',
            '闲着没事在家用python接单，日均入账300＋。如果你会python不去接单就真的太可惜了！！！',
            '【附源码】教你10秒暴力破解WiFi密码，蹭WiFi神器，一键免费连接WiFi，附安装教程、源码！',
            '【python资料】python学不懂？千万不要自暴自弃！学姐一招帮你解决所有难题！！！',
            '前景好不内卷的新兴领域崛起，真心建议大家都冲一下，千万不要错过了再去后悔！！！',
            '【python资料】听学姐一句劝！想学好Python，一定要找到正确的学习方法！！！',
            '新兴领域崛起，真心建议大家都冲一下！！！',
            '各位确定不冲一冲新兴职业吗？现在发展可太香了吧！！！',
            '【python代码】2024年最新爱心代码分享，快@你的那个ta吧！！！',
            '【python资料】python全套学习资料分享，是时候打开一条正确学习python的道路了！！！',
            '【python代码】手把手教你使用python爬取全网音乐，附源码！！！',
            '【python资料】适合python小白学习的python全套资料分享，别再盲目的学习python了',
            '【python代码】2024年最新烟花代码分享！！！',
            '【python代码】python暴力破解WiFi教程，附源码！！！',
            '【python软件】一款免费python软件分享！！！',
            '【python代码】python爱心代码分享!!!',
            '【python代码】植物大战僵尸python代码分享，大家一起来制作游戏吧！！！',
            '【python软件】分享一个python软件神器，帮助你解决所有python难题！！！',
            '【python资料】python小白全套资料分享，再也不要盲目学习python了!!!',
            '【2024清华版Python教程】目前B站最完整的python（数据分析）教程，包含所有干货内容！这还没人看，我不更了！',
            '计算机专业上岸学姐推荐：编程小白的第一本python入门书，啃完你的python就牛了！',
            'B站首推！字节大佬花一周讲完的Python，2024公认最通俗易懂的【Python教程】小白也能信手拈来！（爬虫|数据分析|Web开发|项目实战）等等随便白嫖！',
            '【全268集】北京大学168小时讲完的Python（数据分析）教程，通俗易懂，2024最新版，全程干货无废话，这还学不会，我退出IT界！',
            '拜托三连了！这绝对是全B站最详细的Python学习路线图（2024新版）让小白少走弯路！',
            'python+pycharm安装配置教程（2024零基础学python教程必看)',
            '吹爆！适合所有零基础人群的最全Python学习路线，我给做出来了！-基础语法/爬虫/全栈开发/数据分析/人工智能',
            'Python70个练手项目，包含爬虫_web开发_数据分析_人工智能等，练完你的Python就牛了！',
            '揭秘！学Python真的能兼职接单吗？零基础/价格参考/平台推荐/接单技巧/',
            '拜托三连了！这绝对是全B站最用心（没有之一）的Python数据分析-数据挖掘课程，全程干货无废话，学完即可就业！',
            '【Python初学者必定要看的入门神书！】下载量超5万，单细胞生物都能看懂！-基础语法/网络爬虫/Web编程/数据分析',
            '拜托三连了！这绝对是全B站最用心（没有之一）的Python爬虫教程，零基础小白从入门到（不）入狱！',
            'Python爬虫｜我宣布:这三本书就是学习Python爬虫的天花板！都给我磕到烂！',
            'B站首推！自学Python一定要看的3本书籍！！！少走三年弯路！！！',
            'Python学习｜学Python顺序真的很重要！千万不要搞反啦千万不要弄反了！！！能少走一年弯路！',
            'B站首推！华为大佬168小时讲完的Python（数据分析）教程，全程干货无废话！学完变大佬！这还学不会我退出IT界！',
            '冒死上传（已被开除）花八千块在某站买的Python课程，每天学习1小时，零基础从入门到精通！',
            '盲目学习只会毁了你！这绝对是全B站最用心（没有之一）的Python爬虫教程，整整500集，从入门到（不）入狱，学完即可兼职接单！',
            'B站首推！字节大佬一周讲完的Python【数据分析】教程，整整300集，全程干货无废话，学完即可就业!',
            '【2023版】这绝对是B站最详细的Python+Pycharm安装配置教程，真正让小白少走弯路，激活码允许白嫖！',
            '【整整300集】北京大学198小时讲完的人工智能课程（机器学习_深度学习_OpenCV_神经网络等）全程干货无废话，学完立马变大神！',
            '【整整600集】北京大学198小时讲完的Python教程（数据分析）全程干货无废话！学完变大佬！这还学不会，我退出IT圈！',
            'B站首推！华为团队花一周讲完的人工智能，2023公认最通俗易懂的【AI人工智能教程】小白也能信手拈来（|机器学习|深度学习|芯片）等等随便白嫖！',
            '【整整300集】暑假60天如何逼自己学会Python，从入门到精通，每天坚持打卡练习，学不会我退出IT界！',
            '【2023清华版Python教程】可能是B站最好的Python教程，全300集包含入门到实战所有干货，存下吧，很难找全的！',
            '【全600集】我花3W买的Python系课统，让你少走99%的弯路！手把手教学，通俗易懂，零基础快速进阶Python大佬！学完即可就业！不会我退出IT教学圈！',
            '【浙江大学亲授】B站最系统的Python数据分析教学，整整300集，包含数据获取、分析、处理、挖掘等，小白从入门到项目实战保姆级教程，学完即可就业，存下吧！',
            '【全800集】少走99%的弯路！清华大佬耗费一周录制的Python教程，手把手教学，通俗易懂!0基础小白快速进阶大神，无私分享，拿走不谢！还不快来学起来！',
            '【Python教程】华为大佬花一周讲完的Python教程，Python从入门到精通，包括基础教程、案例教学、进阶学习和全流程实战，整整400集，熟练掌握并运用！',
            'Python教程｜100个Python新手小白必备的练习题，简单又实用，手把手教学，每日一练，轻松掌握，实践是检验真理的唯一标准！',
            '【Python系统课程】268个小时讲完的付费Python系统教程，花了3W买的，无私分享，整整500集！包含基础、核心编程和爬虫、数据分析，学完即可就业！',
            '【整整500集】B站最系统的Python爬虫教程，从入门到入狱！保姆级手把手教学，全程干货无废话，学完即可就业，别在盲目自学了！！！',
            '【Python零基础教程】可能是B站最系统的Python教程，一周时间全面了解python从入门到精通，包含所有干货，少走99%的弯路，学完即可就业！',
            '【全500集】清华大佬终于把Python教程做成了漫画书，结合漫画元素讲解，通俗易懂，全程干货无废话，学完即可就业，拿走不谢！这还学不会我退出IT圈！',
            '【Python教程】这才是你需要学的！一套针对零基础的python教程，整整300集，全程干货无废话，python从入门到精通，存下吧，很难找全的！',
        ];
        // 先验概率
        #black_p = 0;
        #white_p = 0;
        // 内容长度
        #white_len = 0;
        #black_len = 0;
        #total_len = 0;
        // 词频
        #black_counter = null;
        #white_counter = null;
        // 词汇出现总数
        #white_words = 0;
        #black_words = 0;
        // 临界值, 当w和b的概率的差距大于临界值时，执行判断
        #threshold = 0;
        /**
         * 分词
         * @param {string} content
         * @param {number} exclude_length
         * @returns {Array}
         */
        #seg(content, exclude_length = 1) { return [...this.#segmenter.segment(content)].map(e => e.segment).filter(e => e.length > exclude_length); }
        /**
         * 统计词频
         * @param {Array} words_list
         * @returns {object}
         */
        #word_counter(words_list) { return words_list.reduce((counter, val) => (counter[val] ? ++counter[val] : (counter[val] = 1), counter), {}); }
        /**
         * 手动规则取词
         * @param {string} content
         */
        #seg_word(content) {
            const words = [];
            // 匹配英文内容
            const mabc = content.match(this.#abc_reg);
            // 筛选出长度大于1的, 同时转为小写
            mabc && words.push(...mabc.filter(e => e.length > 1).map(e => e.toLowerCase()));
            // 匹配数字
            const mnum = content.match(this.#num_reg);
            // 筛选出满足特定的数字, 年份 & 12306
            mnum && words.push(...mnum.filter(e => this.#year_reg.test(e)));
            // 将数字, 空格, 英文清除掉
            words.push(...this.#seg(content.replace(this.#clear_reg, ''), 0));
            return words;
        }
        #get_word_counter() {
            this.#black_counter = GM_Objects.get_value('black_counter');
            this.#white_counter = GM_Objects.get_value('white_counter');
        }
        /**
         * 计算先验概率
         * @param {number} black_len
         * @param {number} white_len
         * @param {number} total_len
         */
        #get_prior_probability(black_len, white_len, total_len) {
            this.#black_p = black_len > 0 ? Math.log(black_len) - Math.log(total_len) : Math.log((black_len + 1) / total_len + 2);
            this.#white_p = white_len > 0 ? Math.log(white_len) - Math.log(total_len) : Math.log((white_len + 1) / total_len + 2);
        }
        // 各个词汇数量
        get #features_length() { return Object.keys(Object.assign({}, this.#black_counter, this.#white_counter)).length; }
        #update_words_cal() {
            const sum = (dic) => Object.values(dic).reduce((acc, cur) => acc + cur, 0);
            const total_features_length = this.#features_length;
            // 对所有值 +1
            this.#white_words = sum(this.#white_counter) + total_features_length;
            this.#black_words = sum(this.#black_counter) + total_features_length;
        }
        // 预先计算部分的值
        #pre_cal_data = {
            'w_t': 0,
            'b_t': 0,
            'w_1': 0,
            'b_1': 0
        };
        #update_pre_cal() {
            const w_t = Math.log(this.#white_words), b_t = Math.log(this.#black_words);
            // 当数值为0时, 取1进行计算的结果
            const w_1 = Math.log(1) - w_t, b_1 = Math.log(1) - b_t;
            this.#pre_cal_data.w_t = w_t;
            this.#pre_cal_data.b_t = b_t;
            this.#pre_cal_data.w_1 = w_1;
            this.#pre_cal_data.b_1 = b_1;
        }
        // 初始化模型
        #init_module() {
            let total_len = GM_Objects.get_value('total_len'), white_len = 0, black_len = 0;
            if (total_len) {
                white_len = GM_Objects.get_value('white_len');
                black_len = GM_Objects.get_value('black_len');
                this.#get_word_counter();
            } else {
                white_len = this.#white_list.length;
                black_len = this.#black_list.length;
                total_len = white_len + black_len;
                GM_Objects.set_value('white_len', white_len);
                GM_Objects.set_value('black_len', black_len);
                GM_Objects.set_value('total_len', total_len);
                this.#black_counter = this.#word_counter(this.#black_list.map(e => this.#seg_word(e)).flat());
                this.#white_counter = this.#word_counter(this.#white_list.map(e => this.#seg_word(e)).flat());
                GM_Objects.set_value('black_counter', this.#black_counter);
                GM_Objects.set_value('white_counter', this.#white_counter);
            }
            this.#threshold = GM_Objects.get_value('threshold', 0.12);
            this.#white_len = white_len;
            this.#black_len = black_len;
            this.#total_len = total_len;
            this.#get_prior_probability(black_len, white_len, total_len);
            this.#update_words_cal();
            this.#update_pre_cal();
        }
        constructor() {
            this.#segmenter = new Intl.Segmenter('cn', { granularity: 'word' });
            this.#init_module();
            GM_Objects.addvaluechangeistener('total_len', this.#init_module.bind(this));
        }
        /**
         * 计算概率
         * @param {string} content
         * @returns {number}
         */
        bayes(content) {
            if (!content) return 0;
            const c = this.#seg_word(content);
            const i = c.length;
            if (i < 5) return 0;
            // 预先计算部分数值
            const { w_t, b_t, w_1, b_1 } = this.#pre_cal_data;
            const [wp, bp] = c.reduce((acc, cur) => {
                const bc = this.#black_counter[cur];
                const wc = this.#white_counter[cur];
                acc[0] += wc ? Math.log(wc + 1) - w_t : w_1;
                acc[1] += bc ? Math.log(bc + 1) - b_t : b_1;
                return acc;
            }, [this.#white_p, this.#black_p]);
            const r = (bp - wp) / Math.abs(bp);
            return r > (i > 10 ? this.#threshold : 0.25) ? r : 0;
        }
        /**
         * 添加新内容
         * @param {string} content
         * @param {boolean} mode
         */
        add_new_content(content, mode) {
            if (content.length < 3) return;
            const ws = this.#seg_word(content);
            const [dic, dic_name, len_name, len_data] = mode ? [this.#white_counter, 'white_counter', 'white_len', ++this.#white_len] : [this.#black_counter, 'black_counter', 'black_len', ++this.#black_len];
            ws.forEach(e => dic[e] ? ++dic[e] : (dic[e] = 1));
            this.#total_len += 1;
            this.#get_prior_probability(this.#black_len, this.#white_len, this.#total_len);
            this.#update_words_cal();
            this.#update_pre_cal();
            GM_Objects.set_value('total_len', this.#total_len);
            GM_Objects.set_value(dic_name, dic);
            GM_Objects.set_value(len_name, len_data);
            Colorful_Console.main('successfully add content to bayes');
        }
        // 重置模型
        reset() {
            ['black_counter', 'black_len', 'white_counter', 'white_len', 'total_len'].forEach(e => GM_Objects.set_value(e, null));
            this.#init_module();
            Colorful_Console.main('successfully reset bayes', 'info', true);
        }
        /**
         * 调整比例
         * @param {number} val
         */
        adjust_threshold(val) {
            try {
                val = Number(val);
                (0.03 < val && val < 1) ? (this.#threshold = val, GM_Objects.set_value('threshold', val), Colorful_Console.main('successfully adjust threshold')) : Colorful_Console.main('threshold must be between 0.03 and 1', 'warning');
            } catch (error) {
                console.error(error);
            }
        }
        // 展示模型细节
        show_detail() {
            const data = [
                '--------',
                '------------------',
                'details of bayes module:',
                '-----------------------------',
                'type of module: MultinomialNB;',
                `white list length: ${this.#white_len};`,
                `black list length: ${this.#black_len};`,
                `white features length: ${this.#white_words};`,
                `black features length: ${this.#black_words};`,
                `threshold: ${this.#threshold}`,
                '-----------------------------'
            ];
            console.log(data.join('\n'));
        }
    }
    // bayes module ------------

    // ------------- 数据结构, 统一使用数组作为数据的载体
    class Dic_Array extends Array {
        #id_name;
        /**
         * 数组 - 字典结构
         * @param {Array} data
         * @param {string} id_name
         */
        constructor(data, id_name) {
            if (typeof data !== 'object') super();
            else {
                // 继承, 必须先调用父类, 才能使用this
                super(...data);
                this.#id_name = id_name;
            }
        }
        /**
         * 检查是否存在和记录
         * @param {string} id
         * @returns {boolean || object}
         */
        includes_r(id, mode = false) {
            if (!id) return null;
            const id_name = this.#id_name;
            const target = super.find(e => e[id_name] === id);
            // 更新访问的数据
            let f = false;
            if (target) {
                f = true;
                const now = Date.now();
                target.last_active_date = now;
                target.visited_times += 1;
                // 更新访问状态, 以便后面清理数据时作为指标
                Dynamic_Variants_Manager.rate_up_status_sync(id_name, id, now, target.visited_times);
                id_name === 'up_id' && Dynamic_Variants_Manager.accumulative_func();
                Colorful_Console.main(`block ${this.#id_name}: ${id}`);
            }
            return mode ? target : f;
        }
        /**
         * 移除id
         * @param {string} id
         * @returns {boolean}
         */
        remove(id) {
            // 返回结果, 根据是否执行了删除操作来决定是否写入数据
            const index = super.findIndex(e => id === e[this.#id_name]);
            // 注意这里的删除操作, splice会返回和这个类数据结构一样的数组包裹的元素, 导致这个函数会访问constructor(), 需要再次调用super()
            return index > -1 && (super.splice(index, 1), true);
        }
        /**
         * 更新活动的状态
         * @param {object} info
         */
        update_active_status(info) {
            const id = info.id;
            if (!id) return;
            const target = super.find(e => e[this.#id_name] === id);
            if (target) target.last_active_date = info.date, target.visited_times = info.visited_times;
        }
    }

    // 历史访问记录
    class Visited_Array extends Array {
        #limit = 999;
        /**
         * 限制存储的数据的上限, 假如不指定就默认999
         * @param {Array} data
         * @param {number} limit
         */
        constructor(data, limit) {
            if (typeof data !== 'object') super();
            else {
                super(...data);
                if (limit > 999) this.#limit = limit;
            }
        }
        /**
         * 添加数据, 只允许存储限制范围内的数据长度, 默认长度1000
         * @param {string} id
         */
        push(id) {
            // 超出范围, 则弹出数据
            // 假如存在数据, 则移动到第一位
            if (!id) return;
            const index = super.indexOf(id);
            // unshift, 返回拼接后的数组长度, 注意
            (index < 0 ? super.unshift(id) : index > 0 ? super.unshift(super.splice(index, 1)[0]) : super.length) > this.#limit && super.pop();
        }
    }

    // 拦截视频, 由于基本结构基本类似, 直接继承历史记录的数组结构
    class Block_Video_Array extends Visited_Array {
        includes_r(id) { return (id && super.includes(id)) ? (Dynamic_Variants_Manager.accumulative_func(), true) : false; }
        remove(id) {
            const index = super.indexOf(id);
            return index > -1 && (super.splice(index, 1), true);
        }
    }

    /**
     * 自定义的includes函数
     * @param {boolean} mode
     * @param {string} id_name
     * @returns {Function}
     */
    function includes_r(mode, id_name = 'video_id') {
        // 额外增加的数组函数, 用于在执行数据是否存在的时候, 同时记录下这次的操作
        // 不能使用箭头函数这里, 在为对象增加一个新的函数, 而需要this指向这个对象自身
        const f = mode ? (val) => this.includes(val) && `block ${id_name}: ${val}` : (val) => {
            val = val.replaceAll(' ', '').toLowerCase();
            const r = this.find(e => val.includes(e));
            return r ? `block ${val}, target: ${r}` : false;
        };
        return (val) => {
            // 移除掉空格, 转为小写
            const r = val && f(val);
            return r ? (Colorful_Console.main(r), Dynamic_Variants_Manager.accumulative_func(), true) : false;
        };
    }
    // 数据结构 --------------

    // -------- 动态数据管理
    const Dynamic_Variants_Manager = {
        black_keys: {
            // 直接拉黑up
            a: [
                '\u4f20\u5a92\u5b66\u9662',
                '\u53f8\u51e4',
                '\u79e6\u660a',
                '\u738b\u9a81',
                '\u9a81\u8bdd\u4e00\u4e0b',
                '\u540e\u63f4\u4f1a',
                '\u8d31\u5a62',
                '\u738b\u4fca\u51ef',
                '\u66fe\u4ed5\u5f3a',
                '\u666e\u4eac',
                '\u6bd5\u5bfc',
                '\u7279\u6717\u666e',
                '\u827e\u8dc3\u8fdb',
                '\u8d58\u5a7f',
                '\u4e60\u8fd1\u5e73',
                '\u4e60\u4e3b\u5e2d',
                '\u6bdb\u6cfd\u4e1c',
                '\u6bdb\u4e3b\u5e2d',
                '\u6e29\u94c1\u519b',
                '\u66fe\u4ed5\u5f3a',
                '\u738b\u6e90',
                '\u5ba0\u59bb',
                '\u66b4\u541b',
                '\u9ad8\u751c',
                '\u8ffd\u5267',
                '\u8650\u604b',
                '\u90fd\u5e02\u5c0f\u8bf4',
                '\u8a00\u60c5\u5c0f\u8bf4',
                '\u803d\u7f8e\u5c0f\u8bf4',
                '\u75f4\u60c5',
                '\u5267\u60c5\u5411',
                '\u5168\u5458\u5411',
                '\u89d2\u8272\u5411',
                '\u664b\u6c5f',
                '\u8d77\u70b9\u8bfb\u4e66',
                '\u6768\u6d0b',
                '\u751f\u65e5\u5feb\u4e50',
                '\u5218\u8bd7\u8bd7',
                '\u5c0f\u5a07\u59bb',
                '\u8650\u5411',
                '\u5bcc\u5bdf',
                '\u5f20\u8d77\u7075',
                '\u65b0\u5a5a\u5feb\u4e50',
                '\u5434\u90aa',
                '\u75c5\u5a07',
                '\u4e2d\u7f8e\u5173\u7cfb',
                '\u4e2d\u7f8e\u535a\u5f08',
                '\u51b7\u6218\u601d\u7ef4',
                '\u89c2\u5bdf\u8005\u7f51',
                '\u89c2\u89c6\u9891',
                '\u4eba\u6c11\u65e5\u62a5',
                '\u601d\u60f3\u706b\u70ac',
                '\u6c99\u6d77',
                '\u534a\u4f5b',
                '\u6797\u60ca\u7fbd',
                '\u706b\u7bad\u5c11\u5973',
                '\u6768\u9896',
                '\u91d1\u707f\u8363',
                '\u5171\u9752\u56e2',
                '\u65b0\u534e\u793e',
                '\u5916\u4ea4\u90e8',
                '\u5434\u4ea6\u51e1',
                '\u9e7f\u6657',
                '\u535a\u541b\u4e00\u8096',
                '\u5fd8\u7fa1',
                '\u6613\u70ca\u5343\u73ba',
                '\u9648\u60c5',
                '\u74f6\u90aa',
                '\u7fa1\u5fd8',
                '\u50bb\u767d\u751c',
                '\u592e\u89c6\u9891',
                '\u9ad8\u8650',
                '\u5ad4\u5983',
                '\u516c\u4f17\u53f7',
                '\u5fae\u4fe1\u53f7',
                '\u9ad8\u751c',
                '\u4e3d\u9896',
                '\u738b\u4e00\u535a',
                '\u8096\u6218',
                '\u8fea\u4e3d\u70ed\u5df4',
                '\u4e09\u5341\u800c\u5df2',
                '\u7231\u60c5\u516c\u5bd3',
                '\u603b\u88c1',
                '\u739b\u4e3d\u82cf',
                '\u6731\u4e00\u9f99',
                '\u4f55\u540c\u5b66',
                '\u5f20\u827a\u5174',
                '\u5bab\u6597',
                '\u6c88\u9038',
                '\u5171\u4ea7\u515a',
                '\u9a6c\u5217',
                '\u6bdb\u6982',
                '\u9a6c\u514b\u601d',
                '\u5217\u5b81',
                '\u65af\u5927\u6797',
                '\u8d44\u672c\u5bb6',
                '\u6768\u8d85\u8d8a',
                '\u963f\u54e5',
                '\u5974\u624d',
                '\u8d1d\u52d2',
                '\u683c\u683c',
                '\u4e1c\u5bab',
                '\u4e09\u751f\u4e09\u4e16',
                '\u6b65\u6b65\u60ca\u5fc3',
                '\u7504\u5b1b',
                '\u56fd\u5b66',
                '\u751c\u5ba0',
                '\u6768\u5e42',
                '\u5ba0\u5983',
                '\u5434\u78ca',
                '\u5e08\u5f92\u5411',
                '\u8214\u5c4f\u5411',
                '\u90d1\u723d',
                '\u9648\u828a\u828a',
                '\u53cd\u8150',
                '\u4eba\u6c11\u7684\u540d\u4e49',
                '\u767d\u83b2\u82b1',
                '\u5e86\u4f59\u5e74',
                '\u8c08\u604b\u7231',
                '\u4eb5\u6e0e',
                '\u6781\u6d77\u542c\u96f7',
                '\u989c\u5411',
                '\u592e\u89c6\u65b0\u95fb',
                '\u53f0\u8bcd\u5411',
                '\u5927\u660e\u98ce\u534e',
                '\u5ef6\u79a7\u653b\u7565',
                '\u6297\u7f8e\u63f4\u671d',
                '\u5982\u61ff',
                '\u5a18\u5b50',
                '\u748e\u73de',
                '\u6597\u7f57\u5927\u9646',
                '\u5510\u95e8',
                '\u8bba\u8bed',
                '\u4efb\u5609\u4f26',
                '\u8650\u6587',
                '\u5976\u72d7',
                '\u79c1\u804a',
                '\u6cf0\u8150',
                '\u996d\u5236',
                '\u7f51\u6e38',
                '\u7231\u8c46',
                '\u5fb7\u4e91\u793e',
                '\u996d\u5708',
                '\u6210\u6bc5',
            ],
            // 隐藏视频
            b: [
                '\u5468\u6df1',
                '\u6597\u7f57',
                'tfboys',
                '\u5fae\u5427',
                '\u6c88\u817e',
                '\u4e07\u7c89',
                '\u5b59\u7b11\u5ddd',
                '\u65b0\u4e09\u56fd',
                '\u6c11\u5ba3\u90e8',
                '\u5c40\u5ea7',
                '\u5f20\u53ec\u5fe0',
                '\u8521\u5f90\u5764',
                '\u72d7\u8840',
                '\u5a31\u4e50\u5708',
                '\u6697\u604b',
                '\u76d7\u5893\u7b14\u8bb0',
                '\u8bf4\u5531\u65b0\u4e16\u4ee3',
                '\u60f3\u89c1\u4f60',
                '\u5c0f\u9b3c\u5b50',
                '\u7f51\u7edc\u5c0f\u8bf4',
                '\u540e\u5bab',
                '\u5c0f\u9c9c\u8089',
                '\u4e09\u8fde',
                '\u8001\u620f\u9aa8',
                '\u63a8\u4e0d\u63a8\u8350',
                '\u7efc\u827a',
                '\u6296\u97f3',
                '\u90ed\u5fb7\u7eb2',
                '\u671d\u9c9c\u6218\u4e89',
                '\u7231\u56fd',
                '\u4e0a\u7518\u5cad',
                '\u4eba\u6c11\u5171\u548c',
                '\u7537\u56e2',
                '\u4e00\u5e26\u4e00\u8def',
                '\u6c99\u96d5',
                '\u5973\u5b9e\u4e60\u751f',
                '\u7a0b\u5e8f\u5a9b',
                '\u6708\u5165',
                '\u611f\u60c5',
                '\u9752\u4e91',
                '\u5355\u8eab\u72d7',
                '\u9a6c\u4e91',
                '\u5218\u5f3a\u4e1c',
                '\u9a6c\u5316\u817e',
                '\u63a5\u5355',
                '\u4e3b\u64ad',
                '\u50b2\u5a07',
                '\u4e13\u5347\u672c',
                '\u7a7f\u8d8a\u706b\u7ebf',
                '\u81ea\u5b66\u7ecf\u9a8c',
                '\u9ad8\u8003',
                '\u5fe0\u544a',
                '\u534e\u4e3a',
                '\u6234\u5efa\u4e1a',
                '\u5f20\u4e1c\u5347',
                '\u6731\u671d\u9633',
                '\u91cd\u542f',
                '\u592e\u89c6',
                '\u7f8e\u5986',
                '\u665a\u4f1a',
                '\u85aa\u916c',
                '\u85aa\u8d44',
                '\u5f85\u9047',
                '\u5e74\u85aa',
                '\u53f7\u5458\u5de5',
                '\u5de5\u8d44',
                '\u526f\u4e1a',
                '\u5916\u5305',
                '\u517c\u804c',
                '\u6708\u85aa',
                '\u5f3a\u5978',
                '\u7325\u4eb5',
                '\u8214\u72d7',
                '\u821e\u6cd5\u5929\u5973',
                '\u5f20\u4e00\u5c71',
                '\u4e2a\u4eba\u5411',
                '\u9752\u5e74\u5927\u5b66',
                '\u6768\u7d2b',
                '\u5c0f\u54e5',
                '\u89e3\u653e\u519b',
                '\u7956\u56fd',
                '\u4e0d\u6295\u5e01',
                '\u965b\u4e0b',
                '\u8303\u51b0\u51b0',
                'cctv',
                '\u674e\u6613\u5cf0',
                '\u6e56\u5357\u536b\u89c6',
                '\u6c5f\u82cf\u536b\u89c6',
                '\u6d59\u6c5f\u536b\u89c6',
                '\u5fae\u8650',
                '\u5218\u660a\u7136',
                '\u975e\u4f60\u83ab\u5c5e',
                '\u6700\u6e29\u67d4',
                '\u6000\u5b55',
                '\u8428\u9876\u9876',
                '\u6d4e\u516c',
                '\u534e\u6668\u5b87',
                '\u4e0a\u6d77\u5821\u5792',
                '\u90ed\u656c\u660e',
                '\u6bd5\u4e1a\u5b63',
                '\u9ec4\u6653\u660e'
            ],
            /**
             * 添加拦截关键词
             * @param {Array} data
             */
            add(data) {
                const a = this._get_data();
                if (a) {
                    const t = [...new Set([...a, ...data])];
                    let i = t.length;
                    if (i !== a.length) {
                        while (i > 1000) t.pop(), --i;
                        this._write_data(t);
                    }
                } else this._write_data(data);
                this.a = [...new Set([...this.a, ...data])];
                // 重新赋值后, 需要重新添加函数
                this.a.includes_r = includes_r.call(this.a, false);
            },
            /**
             * 移除拦截关键词
             * @param {Array} data
             */
            remove(data) {
                this.a = this.a.filter(e => !data.includes(e));
                const arr = this._get_data();
                if (arr) {
                    const t = arr.filter(e => !data.includes(e));
                    t.length !== arr.length && this._write_data(t);
                }
            },
            _write_data(data) { GM_Objects.set_value('black_keys', data), Colorful_Console.main('update black keys', 'info', true); },
            _get_data() { return GM_Objects.get_value('black_keys'); },
            _main() {
                const c = this._get_data();
                c && c.forEach(e => this.a.push(e));
            }
        },
        bayes_module: null,
        // 手动拉黑的up, 重要数据, 结构 [{}], 跨标签通信
        block_ups: null,
        // 缓存数据, 不保存, 结构[]
        cache_block_ups: null,
        // 手动拉黑的视频, 动态, 限制数量, 结构[], 跨标签通信
        block_videos: null,
        // 临时拦截视频, 不保存数据, 结构[]
        cache_block_videos: null,
        // 手动, 视频的评分, 重要数据, 结构[{}], 跨标签通信
        rate_videos: null,
        // 自动, 历史访问视频, 动态, 限制数量[]
        visited_videos: null,
        // 自动, 累积拦截次数, 跨标签通信
        accumulative_total: GM_Objects.get_value('accumulative_total', 0),
        accumulative_bayes: GM_Objects.get_value('accumulative_bayes', 0),
        key_check(content) { return this.black_keys.a.includes_r(content) ? 2 : this.black_keys.b.includes_r(content) ? 1 : 0; },
        /**
         * 检查数据是否被拦截
         * @param {object} info
         * @returns {boolean}
         */
        completed_check(info) {
            // 1. 优先拦截up
            // 2. 缓存up
            // 3. 拦截关键词, 如果包含a类关键词, 拉黑up在缓存
            // 4. 最后检查拦截视频
            const { title, up_id, video_id, up_name } = info;
            if (this.block_ups.includes_r(up_id) || this.cache_block_ups.includes_r(up_id) || this.block_videos.includes_r(video_id) || this.cache_block_videos.includes_r(video_id)) return true;
            const r = this.key_check(title + "_" + up_name);
            if (r > 0) {
                r == 2 && this.cache_block_ups.push(up_id);
                return true;
            }
            const b = this.bayes_module.bayes(title);
            return b > 0 ? (this.bayes_accumulative(title, b), true) : false;
        },
        /**
         * 取消拦截视频
         * @param {string} video_id
         */
        unblock_video(video_id) { this.block_videos.remove(video_id) && (GM_Objects.set_value('block_videos', this.block_videos), this.up_video_sync('unblock', 'video', video_id)); },
        /**
         * 拦截视频
         * @param {string} video_id
         */
        block_video(video_id) {
            this.block_videos.push(video_id);
            GM_Objects.set_value('block_videos', this.block_videos);
            this.up_video_sync('block', 'video', video_id);
            Colorful_Console.main('update block video info');
        },
        // 累积拦截计数记录
        accumulative_func() { GM_Objects.set_value('accumulative_total', ++this.accumulative_total); },
        /**
         * 贝叶斯拦截记录
         * @param {string} title
         * @param {number} b_result
         */
        bayes_accumulative(title, b_result) {
            this.accumulative_func();
            GM_Objects.set_value('accumulative_bayes', ++this.accumulative_bayes);
            Colorful_Console.main(`bayes block(${b_result.toFixed(4)}): ${title}`, 'debug');
        },
        // 视频和up, 拦截或者取消时, 数据同步
        up_video_sync(s_type, s_name, s_value) { GM_Objects.set_value('up_video_sync', { type: s_type, name: s_name, value: s_value }); },
        // 评分, 拦截up的数据部分更新同步
        _status_info: null,
        rate_up_status_sync(s_type, id, date, times) { GM_Objects.set_value('up_rate_status_sync', { type: s_type, value: { id: id, date: date, times: times } }), this._status_info = s_type; },
        // 评分和访问数据同步
        // 初始化视频评分数据
        rate_visited_data_sync(data) { GM_Objects.set_value(typeof data === 'string' ? 'visited_video_sync' : 'rate_video_sync', data); },
        // up, 评分, 状态更新写入, 假如频繁写入, 相对影响性能的, 当数据累积到一定数量才写入, 或者定时写入, 而不是一变化就写入
        _rate_up_status_write_monitor() {
            let up_times = 0, rate_times = 0, tmp = null;
            const write_data = (mode = false) => {
                const i = mode ? 1 : 5;
                const x = up_times > i ? rate_times > i ? 3 : 1 : rate_times > i ? 2 : 0;
                switch (x) {
                    case 3:
                        GM_Objects.set_value('block_ups', this.block_ups);
                        GM_Objects.set_value('rate_videos', this.rate_videos);
                        up_times = 0, rate_times = 0;
                        break;
                    case 2:
                        GM_Objects.set_value('rate_videos', this.rate_videos);
                        rate_times = 0;
                        break;
                    case 1:
                        GM_Objects.set_value('block_ups', this.block_ups);
                        up_times = 0;
                        break;
                    default:
                        break;
                }
            };
            Object.defineProperty(this, '_status_info', {
                set: (val) => {
                    tmp = val;
                    val === 'up_id' ? ++up_times : ++rate_times;
                    write_data();
                },
                get: () => tmp
            });
            // 每5秒检查数据的状态, 假如数据变化则写入
            setInterval(() => write_data(true), 5000);
        },
        up_video_data_sync_info: null,
        // 数据同步监听
        _data_sync_monitor(site_id) {
            const configs = {
                accumulative_total: {
                    run_in: Array.from({ length: 5 }, (_val, index) => index),
                    f: (..._args) => (this.accumulative_total = args[2])
                },
                accumulative_bayes: {
                    run_in: Array.from({ length: 3 }, (_val, index) => index),
                    f: (...args) => (this.accumulative_bayes = args[2])
                },
                visited_video_sync: {
                    run_in: [2],
                    f: (...args) => this.visited_videos.push(args[2])
                },
                rate_video_sync: {
                    run_in: [2],
                    f: (...args) => {
                        const data = args[2];
                        data.type === 'remove' ? this.rate_videos.remove(data.value.video_id) : this.rate_videos.add(data.value);
                    }
                },
                up_video_sync: {
                    run_in: Array.from({ length: 3 }, (_val, index) => index),
                    f: (...args) => {
                        // {type: "block", value: {up_id: 123}}
                        const data = args[2];
                        if (data.type === 'block') {
                            data.name === 'video' ? this.block_videos.push(data.value.video_id) : this.block_ups.push(data.value);
                            this.up_video_data_sync_info = data;
                        } else data.name === 'video' ? this.block_videos.remove(data.value.video_id) : this.block_ups.remove(data.value.up_id);
                    }
                },
                up_rate_status_sync: {
                    run_in: Array.from({ length: 3 }, (_val, index) => index),
                    f: (...args) => {
                        const data = args[2];
                        (data.type === 'up' ? this.block_ups : this.rate_videos).update_active_status(data.value);
                    }
                }
            };
            for (const k in configs) {
                const item = configs[k];
                item.run_in.includes(site_id) && GM_Objects.addvaluechangeistener(k, item.f.bind(this));
            }
        },
        // 初始化视频评分数据
        init_rate_videos() {
            const o = new Dic_Array(GM_Objects.get_value('rate_videos', []), 'video_id');
            // 检查评分函数
            o.check_rate = function (id) { return this.includes_r(id, true)?.rate || 0; };
            // 添加函数
            o.add = function (info) {
                const video_id = info.video_id;
                const data = this.find(e => e.video_id === video_id);
                if (data && data.rate !== info.rate) {
                    data.rate = info.rate;
                    this.push(data);
                } else if (!data) this.push(info);
                else return false;
                return true;
            };
            return o;
        },
        // 初始化拦截up数据
        init_block_ups: () => new Dic_Array(GM_Objects.get_value('block_ups', []), 'up_id'),
        // 初始化历史访问数据
        init_visited_videos: () => new Visited_Array(GM_Objects.get_value('visited_videos', []), 2000),
        /**
         * 数据初始化
         * @param {number} site_id
         */
        data_init(site_id) {
            // 全局启用, 关键词过滤
            this.black_keys._main();
            this.black_keys.a.includes_r = includes_r.call(this.black_keys.a, false), this.black_keys.b.includes_r = includes_r.call(this.black_keys.b, false);
            if (site_id > 2) return;
            this.cache_block_ups = [], this.cache_block_ups.includes_r = includes_r.call(this.cache_block_ups, true, 'up_id');
            this.cache_block_videos = [], this.cache_block_videos.includes_r = includes_r.call(this.cache_block_videos, true);
            this.block_ups = this.init_block_ups();
            this.block_videos = new Block_Video_Array(GM_Objects.get_value('block_videos', []), 0);
            // 仅在搜索的页面启用, 播放页不需要
            if (site_id === 2) this.rate_videos = this.init_rate_videos(), this.visited_videos = this.init_visited_videos();
            this._data_sync_monitor(site_id);
            this._rate_up_status_write_monitor();
            this.show_status = this._show_data_status;
            this.bayes_module = new Bayes_Module();
        },
        // 展示数据状态
        show_status: () => null,
        // 统计拦截的up的情况
        _block_up_statistics() {
            // 对拦截次数进行排序
            this.block_ups.sort((a, b) => a.visited_times - b.visited_times);
            const i = this.block_ups.length;
            // 各个百分段的拦截次数
            const data = [0.25, 0.5, 0.75].map(e => ' ' + e * 100 + '% block times less than: ' + this.block_ups[Math.floor(e * i)].visited_times + ';');
            const a = this.block_ups[i - 1];
            data.push(' up of most block: ' + a.up_name + ', ' + a.visited_times + ';');
            data.push('-'.repeat(42));
            return data;
        },
        // 展示数据的状态
        _show_data_status() {
            const s = 'bilibili_optimizer_detail:';
            Colorful_Console.main(s);
            const details = [];
            details.push('-'.repeat((s.length + 4) * 2));
            details.push('blocked: ' + this.accumulative_total + ';');
            details.push('bayes blocked: ' + this.accumulative_bayes + ';');
            [
                [this.block_ups, 'block_ups'],
                [this.block_videos, 'block_videos'],
                [this.black_keys.a, 'a_black_keys'],
                [this.black_keys.b, 'b_black_keys']
            ].forEach(e => details.push(e[1] + ': ' + e[0].length + ";"));
            // 被拦截up的访问状况
            // splice(), 支持删除和插入指定位置的元素
            details.splice(4, 0, ...this._block_up_statistics());
            const i = GM_Objects.get_value('install_date', 0);
            i === 0 ? GM_Objects.set_value('install_date', Date.now()) : details.push('install_date: ' + new Date(i).toDateString() + ';');
            const script = GM_Objects.info.script;
            ['version', 'author', 'lastModified', 'homepage'].forEach(e => details.push(e + ': ' + script[e] + ';'));
            details.push('-'.repeat((s.length + 4) * 2));
            console.log(details.join('\n'));
            const title = 'make thing better and simpler.';
            const params = [
                `%c ${title}`,
                "padding: 1px; border-radius: 3px 0 0 3px; color: #00a1d6; font-family: Monotype Corsiva; font-size: 12px;",
            ];
            console.log(...params);
            return true;
        }
    };
    // 动态数据管理 ---------

    // --------- 静态数据管理
    const Statics_Variant_Manager = {
        up_part: {
            /**
             * @returns {Array}
             */
            get _data() { return Dynamic_Variants_Manager.init_block_ups(); },
            /**
             * 检查up是否被拦截
             * @param {string} up_id
             * @returns {boolean}
             */
            check(up_id) { return this._data.some(e => e.up_id === up_id); },
            _info_write(data, mode = false) { GM_Objects.set_value('block_ups', data), Colorful_Console.main('update_up_info', 'info', mode); },
            /**
             * 取消up拦截
             * @param {string} up_id
             * @returns {void}
             */
            unblock(up_id) {
                const data = this._data;
                data.remove(up_id) && (this._info_write(data), Dynamic_Variants_Manager.up_video_sync('unblock', 'up', up_id));
            },
            /**
             * 拦截up
             * @param {object} info
             * @returns {null}
             */
            block(info) {
                const data = this._data;
                const up_id = info.up_id;
                if (data.some(e => e.up_id === up_id)) return;
                data.push(info), this._info_write(data, true), Dynamic_Variants_Manager.up_video_sync('block', 'up', info);
            },
        },
        rate_video_part: {
            /**
             * @returns {Array}
             */
            get _data() { return Dynamic_Variants_Manager.init_rate_videos(); },
            /**
             * 检查视频的评分
             * @param {string} video_id
             * @returns {number}
             */
            check_video_rate(video_id) { return this._data.check_rate(video_id, false); },
            /**
             * 更新, 全新添加
             * @param {object} info
             */
            add(info) { this._handle(info, true); },
            remove(video_id) { this._handle(video_id, false); },
            _handle(data, mode) {
                const arr = this._data;
                const s_type = mode ? 'add' : 'remove';
                arr[s_type](data) && (this._info_write(arr), Dynamic_Variants_Manager.rate_visited_data_sync({ type: s_type, value: data }));
            },
            _info_write(data) { GM_Objects.set_value('rate_videos', data), Colorful_Console.main('update_rate_video_info'); }
        },
        /**
         * 历史访问记录, 只有添加, 没有删除
         * @param {string} video_id
         */
        add_visited_video(video_id) {
            const arr = Dynamic_Variants_Manager.init_visited_videos();
            arr.push(video_id);
            GM_Objects.set_value('visited_videos', arr);
            Dynamic_Variants_Manager.rate_visited_data_sync(video_id);
            Colorful_Console.main('play record has been writed');
        },
    };
    // 静态数据管理 ---------

    // 展示帮助以及其他内部存储数据 -------
    Object.defineProperties(
        GM_Objects.window, {
        'shortcuts': {
            get: () => {
                const shortcuts = [
                    ['快捷键', '辅助/记忆', '功能', '生效页面'],
                    ['p', 'pause', '暂停/播放视频', '视频'],
                    ['l', 'light', '视频关/开灯', '视频'],
                    ['t', '', '视频影院模式', '视频'],
                    ['+', '', '视频声音调大', '视频'],
                    ['-', '', '视频声音调小', '视频'],
                    ['u', '', '视频页面内全屏', '视频'],
                    ['f', 'fullscreen', '视频全屏', '视频'],
                    ['m', 'mute', '静音', '视频'],
                    ['b', 'bing', '必应搜索', '全站'],
                    ['s', 'search', '哔哩搜索', '全站'],
                    ['z', 'zhihu', '知乎搜索', '全站'],
                    ['w', 'white', '添加文本到贝叶斯白名单', '主页, 搜索'],
                    ['a', 'add', '添加拦截关键词', '主页, 搜索'],
                    ['r', 'remove', '移除拦截关键', '主页, 搜索'],
                    ['ctrl', '鼠标右键(鼠标放置在需要操作元素上)', '临时隐藏视频(仅在执行页面生效, 关闭后该数据将不被保存), 同时添加视频的标题到贝叶斯分类器的黑名单中.', '视频, 主页, 搜索'],
                    ['shift', '鼠标右键(鼠标放置在需要操作元素上)', '拦截视频', '视频, 主页, 搜索'],
                    ['ctrl', '鼠标正常点击', '自动控制视频加速', '主页, 搜索']
                ];
                console.table(shortcuts);
            }
        },
        'show_rate': {
            get() {
                const data = GM_Objects.get_value('rate_videos', []);
                data.sort((a, b) => a.add_date - b.add_date);
                data.forEach(e => {
                    e['last_active_date'] = new Date(e['last_active_date']).toDateString();
                    e['add_date'] = new Date(e['add_date']).toDateString();
                });
                console.table(data);
            }
        },
        'bayes': {
            get() { Dynamic_Variants_Manager.bayes_module?.show_detail(); },
            set(value) { Dynamic_Variants_Manager.bayes_module?.adjust_threshold(value); }
        }
    });
    // -------- 展示帮助以及其他内部存储数据

    // --------- 视频控制模块
    class Video_Module {
        // 菜单控制速度
        #is_first = true;
        #video_speed = 2;
        // 视频元素
        #video = null;
        // 历史访问settimeout id
        #record_id = null;
        #auto_speed_mode = false;
        // 视频基本信息
        #video_info = {
            video_id: '',
            title: '',
            up_id: '',
            duration: 0,
            is_collection: false
        };
        // 初始化是否成功
        #init_flag = false;
        /**
         * @returns {boolean}
         */
        get is_init_success() { return this.#init_flag; }
        /**
         * @returns {object}
         */
        get video_base_info() { return this.#video_info; }
        /**
         * 判断视频是否为合集
         * @returns {boolean}
         */
        get #check_is_collection() { return document.getElementsByTagName('h3')[0]?.innerText === '视频选集' || false; }
        /**
         * 获取视频元素
         * @returns {HTMLElement | null}
         */
        get #video_elemment() {
            for (const e of ['video', 'bwp-video']) {
                const video = document.getElementsByTagName(e);
                if (video.length > 0) return video[0];
            };
            const video = document.getElementsByClassName('bwp-video');
            return video.length > 0 ? video[0] : Colorful_Console.main('no video element of bwp-video', 'warning', true);
        }
        #get_up_id() {
            const nodes = document.getElementsByClassName('staff-name');
            return nodes.length > 0 ? Base_Info_Match.get_up_id(nodes[0].href) : null;
        }
        // 读取视频的基本信息
        #load_video_info() {
            this.#video_info.is_collection = this.#check_is_collection;
            this.#video_info.title = document.getElementsByTagName('h1')[0].title.trim();
            this.#video_info.video_id = Base_Info_Match.get_video_id(location.href);
            const node = document.getElementsByClassName('up-name');
            this.#video_info.up_id = node.length > 0 ? Base_Info_Match.get_up_id(node[0].href) : this.#get_up_id();
            this.#video_info.duration = this.#video.duration;
            // 检查获取的内容是否完整
            for (const key in this.#video_info) key !== 'is_collection' && !this.#video_info[key] && Colorful_Console.main(`video_info: lack of value: ${key}`, 'debug');
        }
        // 播放事件
        #create_video_event() {
            this.#video.oncanplay = (e) => {
                // 只有当手动更改之后, 才会自动变速
                if (this.#is_first) return;
                const target = e.target;
                this.#auto_speed_mode = false;
                target.playbackRate !== this.#video_speed && setTimeout(() => { target.playbackRate = this.#video_speed; }, 1500);
            };
        }
        /**
         * 速度控制
         * @param {boolean} mode
         */
        #speed_control(mode) {
            this.#is_first = false;
            this.#video_speed += (mode ? 0.5 : -0.5);
            this.#auto_speed_mode = false;
            if (0 < this.#video_speed < 5) this.#video.playbackRate = this.#video_speed, this.#is_first = this.#video_speed < 2;
        }
        #auto_light = {
            _light_off: false,
            _mode: GM_Objects.get_value('auto_light', 0),
            _names: ['auto_light_off', 'always_light_off', 'disable_light_off'],
            _mid: null,
            _create_menus() { this._mid = GM_Objects.registermenucommand(this._names[this._mode === 2 ? 0 : this._mode + 1], this._func.bind(this)); },
            _func() {
                this._mid && GM_Objects.unregistermenucommand(this._mid);
                this._mode === 2 ? (this._mode = 0) : ++this._mode;
                if (this._mode !== 0) this._light_off = this._mode === 1;
                GM_Objects.set_value('auto_light', this._mode);
                this._create_menus();
            },
            _monitor: () => {
                let tmp = null;
                Object.defineProperty(this.#auto_light, '_light_off', {
                    set: (val) => {
                        tmp = val;
                        this.light_control(val ? 1 : 2);
                    },
                    get: () => tmp
                });
            },
            main() {
                let flag = false;
                if (this._mode === 0) {
                    const date = new Date();
                    const m = date.getMonth() + 1;
                    const h = date.getHours();
                    flag = h > (m > 8 ? 16 : 17);
                } else if (this._mode === 1) flag = true;
                this._create_menus();
                this._monitor();
                return flag;
            }
        };
        // 速度控制, 菜单函数
        #regist_menus_command() { [['speedup', true], ['slow', false]].forEach(e => GM_Objects.registermenucommand(e[0], this.#speed_control.bind(this, e[1]))); }
        // 访问视频记录
        #visited_record() {
            // 连续的内容不记录 ?
            // if (this.#video_info.is_collection) return;
            if (this.#record_id) {
                clearTimeout(this.#record_id);
                this.#record_id = null;
            }
            const duration = parseInt(this.#video_info.duration * 500);
            if (duration === 0) Colorful_Console.main('video duration exceptions', 'warning');
            else this.#record_id = setTimeout(() => {
                Statics_Variant_Manager.add_visited_video(this.#video_info.video_id);
                this.#record_id = null;
            }, duration);
        }
        // 视频操作菜单
        #video_rate_event() {
            setTimeout(() => {
                const funcs = {
                    // 0 菜单
                    // 1 3分
                    // 2 4分
                    // 3 5分
                    // 4 remove, 从评分中将数据移除掉
                    // 5 block, 拦截视频
                    // 6 unblock, 不拦截视频
                    0: () => null,
                    4: () => Statics_Variant_Manager.rate_video_part.remove(this.#video_info.video_id),
                    5: () => {
                        Dynamic_Variants_Manager.block_video(this.#video_info.video_id);
                        Statics_Variant_Manager.rate_video_part.remove(this.#video_info.video_id);
                        return 'Blocked';
                    },
                    6: () => Dynamic_Variants_Manager.unblock_video(this.#video_info.video_id),
                    _rate: (val) => {
                        const add_rate = (val, video_info) => {
                            const id = video_info.video_id;
                            if (!id) Colorful_Console.main('fail to get up_id', 'warning', true);
                            else {
                                const now = Date.now();
                                const info = {
                                    video_id: id,
                                    title: video_info.title,
                                    up_id: video_info.up_id,
                                    last_active_date: now,
                                    visited_times: 1,
                                    add_date: now,
                                    rate: val
                                };
                                Statics_Variant_Manager.rate_video_part.add(info);
                                return true;
                            }
                            return false;
                        };
                        val += 2;
                        const id = this.#video_info.video_id;
                        Dynamic_Variants_Manager.unblock_video(id);
                        const title = add_rate(val, this.#video_info) ? 'Rate: ' + val : '';
                        const cm = `BBDown -mt --work-dir "E:\\video" "${id}"`;
                        GM_Objects.copy_to_clipboard(cm, "text", () => Colorful_Console.main("bbdown commandline: " + cm));
                        (val === 5 || confirm("add to whitelist of bayes model?")) && Dynamic_Variants_Manager.bayes_module.add_new_content(this.#video_info.title, true);
                        return title;
                    },
                    main(val) {
                        const f = this[val];
                        return f ? f() : this._rate(val);
                    }
                };
                const node = document.getElementById('selectWrap');
                const h = node.getElementsByTagName('h3')[0];
                const select = node.getElementsByTagName('select')[0];
                select.onchange = (e) => (h.innerText = funcs.main(parseInt(e.target.value)) || ''), this.#monitor_video_change(select, h);
            }, 300);
        }
        // 添加评分菜单
        #add_video_rate_element() {
            const vid = this.#video_info.video_id;
            const rate = Statics_Variant_Manager.rate_video_part.check_video_rate(vid);
            const status = rate === 0 ? '' : Dynamic_Variants_Manager.block_videos.includes_r(vid) ? 'Blocked' : 'Rate: ' + rate;
            const html = `
            <div class="select_wrap" id="selectWrap">
                <style>
                    div#selectWrap {
                        width: 139px;
                        border: 2px solid gray;
                    }
                    .select_wrap dt {
                        float: left;
                        width: 64px;
                        line-height: 30px;
                        text-align: right;
                        font-size: 14px;
                    }
                    .select_wrap dd {
                        margin-left: 56px;
                        line-height: 30px;
                    }
                    select#selectElem {
                        width: 62px;
                        text-align: center;
                    }
                    .select_container {
                        position: relative;
                        display: inline-block;
                    }
                    .select_container ul {
                        position: absolute;
                        top: 35px;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: #fff;
                        border-radius: 4px;
                        box-shadow: 0 0px 5px #ccc;
                    }
                    .select_container li {
                        list-style: none;
                        font-size: 12px;
                        line-height: 30px;
                        padding: 0 10px;
                        cursor: pointer;
                    }
                    .select_container li:hover,
                    .select_container li.cur {
                        background: #dbf0ff;
                    }
                </style>
                <h3 style="margin-left: 8%;">${status}</h2>
                <hr>
                <dl>
                    <dt>Menus：</dt>
                    <dd>
                        <select id="selectElem">
                            <option value="0">menus</option>
                            <option value="1">Rate: 3</option>
                            <option value="2">Rate: 4</option>
                            <option value="3">Rate: 5</option>
                            <option value="4">Remove</option>
                            <option value="5">Block</option>
                            <option value="6">unBlock</option>
                        </select>
                    </dd>
                </dl>
            </div>`;
            const toolbar = document.getElementsByClassName('video-toolbar-left');
            if (toolbar.length > 0) {
                // 这个函数不会返回插入生成的节点, 返回空值
                toolbar[0].insertAdjacentHTML('beforeend', html);
                this.#video_rate_event();
            } else Colorful_Console.main('fail to insert rate element', 'warning', true);
        }
        video_change_id = null;
        // 监听视频播放发生变化
        #monitor_video_change(select, h) {
            let tmp = null;
            // 注意, Object.defineProperty无法拦截私有属性的操作
            Object.defineProperty(this, 'video_change_id', {
                set: (video_id) => {
                    tmp = video_id;
                    select.value = '0';
                    const r = Statics_Variant_Manager.rate_video_part.check_video_rate(video_id);
                    h.innerText = (r > 0 ? 'Rate: ' + r : Dynamic_Variants_Manager.block_videos.includes_r(video_id) ? 'Blocked' : '');
                },
                get: () => tmp
            });
        }
        // 监听页面播放发生变化
        #url_change_monitor() {
            // 判断浏览器是否支持url change
            if (GM_Objects.supportonurlchange === null) {
                window.addEventListener('urlchange', (info) => setTimeout(() => {
                    const video_id = Base_Info_Match.get_video_id(info.url);
                    if (video_id === this.#video_info.video_id) return;
                    this.video_change_id = video_id;
                    this.#load_video_info();
                    this.#visited_record();
                }, 600));
                return true;
            } else Colorful_Console.main('browser does not support url_change event, please update browser', 'warning', true);
        }
        #click_target(classname) { document.getElementsByClassName(classname)[0]?.click(); }
        // 自动速度控制, 用于快速观看视频
        #auto_speed_up() {
            this.#auto_speed_mode = true;
            const ids = [[15000, 1.25], [75000, 1.5], [125000, 2], [155000, 2.5], [185000, 3]].map((e, i) => setTimeout(() => {
                if (!this.#auto_speed_mode) {
                    ids.forEach(id => id && clearTimeout(id));
                    return;
                }
                this.#video.playbackRate = e[1];
                ids[i] = null;
            }, e[0]));
            GM_Objects.set_value('speed_up_video', false);
        }
        /**
         * 声音控制
         * @param {boolean} mode
         */
        voice_control(mode) {
            let vx = this.#video.volume, v = vx;
            if (v !== (vx = mode ? (vx += 0.1) > 1 ? 1 : vx : (vx -= 0.1) < 0 ? 0 : vx)) this.#video.volume = vx;
        }
        // 播放控制
        play_control() { this.#video.paused ? this.#video.play() : this.#video.pause(); }
        // 灯光控制
        light_control(mode = 0) {
            if (mode > 0) {
                const i = document.getElementsByClassName('bpx-docker bpx-docker-major bpx-state-light-off').length;
                if ((mode === 1 && i > 0) || (mode === 2 && i === 0)) return;
            }
            const nodes = document.getElementsByClassName('bui-checkbox-input');
            for (const node of nodes) {
                if (node.ariaLabel === '关灯模式') {
                    node.click();
                    return;
                }
            }
            Colorful_Console.main('light off element miss', 'debug', true);
        }
        wide_screen() { this.#click_target('bpx-player-ctrl-btn bpx-player-ctrl-web'); }
        // 影院宽屏模式
        theatre_mode() { this.#click_target('bpx-player-ctrl-btn bpx-player-ctrl-wide'); }
        constructor() {
            this.#video = this.#video_elemment;
            if (this.#video) this.#init_flag = true;
        }
        main() {
            this.#load_video_info();
            if (this.#url_change_monitor()) {
                this.#add_video_rate_element();
                this.#create_video_event();
                this.#regist_menus_command();
                this.#auto_light.main() && setTimeout(() => this.light_control(1), 300);
                this.#visited_record();
                GM_Objects.get_value('speed_up_video', false) && this.#auto_speed_up();
            } else Colorful_Console.main('video module will not function properly', 'debug');
        }
    }
    // 视频控制模块 ---------

    // ----------- 优化器主体
    class Bili_Optimizer {
        // 执行配置
        #configs = null;
        // 搜索页面初始化数据保存
        #init_data = null;
        // 搜索页面的fetch数据保存
        #search_page_results = null;
        // 视频模块
        #video_instance = null;
        // 视频模块成功加载标志
        #video_module_init_flag = false;
        // 需要等待页面加载完成后加载的函数
        #end_load_funcs = [];
        // 启动时需要启动的函数
        #start_load_funcs = [];
        // 不同站点的配置
        #site_configs = {
            home: {
                // 站点所在
                id: 0,
                // 初始化时需要检查的元素的class_name
                init_class: 'feed-card',
                // 之后需要检查的目标元素的class_name
                target_class: 'bili-video-card is-rcmd',
                // api url 后缀
                api_suffix: 'wbi/index/top/feed/rcmd',
                // 处理api返回的数据
                handle_data_func(data) {
                    // 存在有空数据返回, 注意
                    const info = {
                        video_id: data.bvid,
                        up_id: data.owner?.mid || '',
                        up_name: data.owner?.name || '',
                        title: data.title
                    };
                    // 确保数据都是字符串类型
                    for (const k in info) info[k] += '';
                    return (!info.video_id && data.arcurl?.includes('/cheese')) || Dynamic_Variants_Manager.completed_check(info);
                },
                // 读取目标元素的视频标题和up的名称
                get_title_up_name(node, info) {
                    info.title = node.getElementsByTagName('h3')[0]?.title.trim() || '';
                    info.up_name = node.getElementsByClassName('bili-video-card__info--author')[0]?.innerHTML.trim() || '';
                },
                // 如何处理节点的方式
                hide_node: (node) => (node.style.visibility = 'hidden'),
                // 判断发起请求数据api url是否需要进行拦截操作
                handle_fetch_url: (url) => url.startsWith(this.#configs.api_prefix) ? (data) => data.data?.item : null,
            },
            video: {
                id: 1,
                // 视频部分的内容, 上层的classname无法覆盖全部的视频, 需要使用下一层的classname
                init_class: 'card-box',
                target_class: 'card-box',
                api_suffix: 'archive/related',
                handle_data_func(data) {
                    const info = {
                        video_id: data.bvid,
                        up_id: data.owner?.mid || data.mid || '',
                        up_name: data.owner?.name || data.author || '',
                        title: data.title
                    };
                    for (const k in info) info[k] += '';
                    return (!info.video_id && data.arcurl?.includes('/cheese')) || Dynamic_Variants_Manager.completed_check(info);
                },
                get_title_up_name(node, info) { [['title', 'title'], ['up_name', 'name']].forEach(e => (info[e[0]] = node.getElementsByClassName(e[1])[0]?.innerText.trim() || '')); },
                hide_node: (node) => (node.style.display = 'none'),
                handle_fetch_url: (url) => url.startsWith(this.#configs.api_prefix) ? (data) => data.data : null,
            },
            search: {
                id: 2,
                parent_class: 'video-list row',
                init_class: 'bili-video-card',
                target_class: 'bili-video-card',
                api_suffix: 'wbi/search/',
                fetch_flag: false,
                handle_data_func: (data) => {
                    const info = {
                        video_id: data.bvid,
                        up_id: data.mid || data.owner?.mid || '',
                        up_name: data.author || data.owner?.name || '',
                        title: data.title
                    };
                    for (const k in info) info[k] += '';
                    if (!info.video_id && data.arcurl?.includes('/cheese')) {
                        this.#search_page_results.push(null);
                        return true;
                    }
                    // 内容带有标签信息
                    ['<em class=\"keyword\">', '</em>', '<em class="keyword">'].forEach(e => (info.title = info.title.replaceAll(e, '')));
                    const r = Dynamic_Variants_Manager.completed_check(info);
                    if (r) this.#search_page_results.push(null);
                    else {
                        const v_r = { v: 0, r: 0 };
                        if (Dynamic_Variants_Manager.visited_videos.includes(info.video_id)) v_r.v = 1;
                        v_r.r = Dynamic_Variants_Manager.rate_videos.check_rate(info.video_id);
                        this.#search_page_results.push(((v_r.r !== 0 || v_r.v !== 0) ? v_r : null));
                    }
                    return r;
                },
                get_title_up_name: (node, info) => this.#site_configs.home.get_title_up_name(node, info),
                hide_node: (node) => (node.style.display = 'none'),
                handle_fetch_url: (url) => {
                    const a = (data) => {
                        this.#search_page_results = [];
                        if (data.data?.page === 1) {
                            const r = data.data.result;
                            this.#configs.fetch_flag = true;
                            return r[r.length - 1].data;
                        }
                        return data.data?.result;
                    };
                    const b = (data) => (this.#search_page_results = [], data.data?.result);
                    const pref = this.#configs.api_prefix;
                    const index = [
                        ['all/v2?__refresh__=true'],
                        ['type?category_id=&search_type=video'],
                        ['type?__refresh__=true', 'search_type=video']
                    ].findIndex(e => e.length > 1 ? url.startsWith(pref + e[0]) && url.includes(e[1]) : url.startsWith(pref + e[0]));
                    return index < 0 ? null : index === 0 ? a : b;
                }
            },
            space: { id: 3 },
            other: { id: 4 },
            play: { id: 5 }
        };
        // 通用工具函数
        #utilities_module = {
            /**
             * 获取节点的up, video的信息
             * @param {HTMLElement} node
             * @returns {object}
             */
            get_up_video_info: (node) => {
                const links = node.getElementsByTagName('a');
                const info = {
                    'up_id': '',
                    'up_name': '',
                    'video_id': '',
                    'title': '',
                    'is_video': true // 清除掉课堂的内容
                };
                for (const a of links) {
                    const href = a.href;
                    if (!info.video_id) {
                        // 小课堂的内容清除掉
                        if (href.includes('/cheese')) {
                            Colorful_Console.main(`cheese clear: ${href}`);
                            info.is_video = false;
                            return info;
                        }
                        info.video_id = Base_Info_Match.get_video_id(href);
                    }
                    else if (!info.up_id) info.up_id = Base_Info_Match.get_up_id(href);
                    else break;
                }
                this.#configs.get_title_up_name(node, info);
                let i = 0, j = 0;
                for (const k in info) {
                    if (!info[k]) {
                        j > 0 && Colorful_Console.main(`less data: ${k}`, 'debug');
                        i++;
                    } else j++;
                }
                return i > 1 ? null : (['up_name', 'title'].forEach(e => (info[e] = info[e].toLowerCase())), info);
            },
            /**
             * 将拦截对象的数据设置为空
             * @param {object} data
             */
            clear_data(data) {
                // 递归调用, 遍历清空各层级的内容, 不涉及数组
                for (const key in data) {
                    const tmp = data[key];
                    const vtype = typeof tmp;
                    if (vtype === 'string') data[key] = '';
                    else if (vtype === 'number') data[key] = 0;
                    else if (data) this.clear_data(tmp);
                }
            }
        };
        // 代理拦截函数
        #proxy_module = {
            /**
             * 代理设置
             * @param {object} target
             * @param {string} name
             * @param {object} handle
             */
            __proxy(target, name, handle) { target[name] = new Proxy(target[name], handle); },
            // 在视频播放页面, 当视频被加载完成, 会载入url追踪参数
            _history_replacestate() {
                this.__proxy(GM_Objects.window.history, 'replaceState', {
                    apply(...args) {
                        const a = args[2]?.[2];
                        !(a && ['vd_source=', 'spm_id_from'].some(e => a.includes(e))) && Reflect.apply(...args);
                    }
                });
            },
            // 当点击右侧的视频, 更新历史url会添加追踪参数, from_spmid
            _history_pushstate() {
                this.__proxy(GM_Objects.window.history, 'pushState', {
                    apply(...args) {
                        if (args.length === 3) {
                            const a = args[2];
                            if (a instanceof Array) {
                                const i = a.length - 1;
                                if (i >= 0) {
                                    const b = a[i];
                                    if (b) {
                                        const t = b.split('spm_id_from')[0];
                                        a[i] = t.endsWith('&') || t.endsWith('?') ? t.slice(0, -1) : t;
                                    }
                                }
                            }
                        }
                        Reflect.apply(...args);
                    }
                });
            },
            // 页面中的handleDocumentInitActive, 这个点击函数会导致url被添加追踪参数
            _addeventlistener() { this.__proxy(document, 'addEventListener', { apply(...args) { !(args.length === 3 && args[2][0] === 'click' && args[2][1]?.name === 'handleDocumentInitActive') && Reflect.apply(...args); } }); },
            // 干预页面进行的href添加追踪参数的操作
            // 由于当前页面的元素已经添加了追踪参数, 所以拦截的操作可以在这里启动, 而不是在页面刚加载的时候启动
            _setattribute() { this.__proxy(HTMLAnchorElement.prototype, 'setAttribute', { apply(...args) { args.length === 3 && args[2]?.length === 2 && args[2][0] === 'href' && (args[2][1] = args[2][1].split('?spm_id_from')[0]), Reflect.apply(...args); } }); },
            // 拦截document.body菜单事件
            // 由于事件是由于document.body所创建, 通过window/document无法直接拦截到
            // 但是document.body要等待body元素的载入, 需要监听body载入的事件颇为麻烦(无法准确及时进行)
            // 通过原型链就可以精确执行拦截的操作
            _disable_body_contextmenu_event() { this.__proxy(HTMLBodyElement.prototype, 'addEventListener', { apply(...args) { (args.length !== 3 || args[2]?.[0] !== 'contextmenu') && Reflect.apply(...args); } }); },
            // 顶部检索框点击/回车, 操作方式均为window.open(url), 只需要拦截这个函数就可以拦截所有的这些操作
            _search_box_clear() {
                this.__proxy(GM_Objects.window, 'open', {
                    apply(...args) {
                        // 清除掉追踪参数
                        const url = args[2]?.[0]?.split('&')[0] || '';
                        if (url) {
                            // 检查搜索的内容是否包含垃圾
                            if (Dynamic_Variants_Manager.key_check(decodeURIComponent(url))) {
                                Colorful_Console.main('search content contain black key', 'warning', true);
                                return;
                            }
                            args[2][0] = url;
                        }
                        Reflect.apply(...args);
                    }
                });
            },
            // 拦截fetch的返回结果
            _fetch: () => {
                // B站的fetch进行了bind(window)的操作, 拦截这个操作, 不能直接拦截fetch
                Function.prototype.bind = new Proxy(Function.prototype.bind, {
                    apply: (...args) => {
                        if (args[1]?.name === 'fetch') {
                            // 填充拦截之后的空白图片
                            const lost_pic = '//i2.hdslb.com/bfs/archive/1e198160b7c9552d3be37f825fbeef377c888450.jpg';
                            // 返回自定义的fetch函数替换掉fetch.bind(window)生成的函数
                            args[1] = async (...args) => {
                                const [url, config] = args;
                                const response = await fetch(url, config);
                                // 根据配置的函数, 决定是否需要干预返回的结果
                                const hfu = this.#configs.handle_fetch_url(url);
                                // response, 只允许访问一次, clone一份, 在复制上进行操作
                                // 然后拦截json函数的返回内容, 从而实现对返回结果的拦截
                                if (hfu) response.json = () => response.clone().json().then((data) => {
                                    const results = hfu(data), hdf = this.#configs.handle_data_func;
                                    // 假如拦截内容, 则清空该组内容, 图片填充
                                    results ? results.forEach(e => hdf(e) && (this.#utilities_module.clear_data(e), (e.pic = lost_pic))) : Colorful_Console.main('url no match rule: ' + url, 'debug');
                                    return data;
                                });
                                return response;
                            };
                        }
                        return Reflect.apply(...args);
                    }
                });
            },
            /**
             * 获得配置函数
             * @param {number} id
             * @returns {Array}
             */
            get_funcs(id) {
                // 运行参数配置
                const run_configs = {
                    _disable_body_contextmenu_event: { run_at: 0, run_in: Array.from({ length: 5 }, (_val, index) => index), type: 1 },
                    _fetch: { run_at: 0, run_in: Array.from({ length: 3 }, (_val, index) => index), type: 0 },
                    _search_box_clear: { run_at: 0, run_in: [0, 1, 3, 4, 5], type: 1 },
                    _addeventlistener: { run_at: 0, run_in: [2], type: 1 },
                    _setattribute: { run_at: 1, run_in: [1], type: 1 },
                    _history_replacestate: { run_at: 0, run_in: [1, 5], type: 1 },
                    _history_pushstate: { run_at: 1, run_in: [1, 5], type: 1 }
                }, arr = [];
                for (const k in run_configs) {
                    const c = run_configs[k];
                    if (c.run_in.includes(id)) {
                        const a = c.type === 1 ? this[k].bind(this) : this[k];
                        a.start = c.run_at, a.type = c.type;
                        arr.push(a);
                    }
                }
                return arr;
            }
        };
        // css注入模块
        #css_module = {
            // 顶部位置广告, 搜索框广告
            _all: {
                run_in: Array.from({ length: 6 }, (_val, index) => index),
                css: `
                .bili-header .left-entry .default-entry,
                a.download-entry.download-client-trigger,
                .bili-header .loc-mc-box,
                .bili-header .bili-header__banner .banner-img,
                .bili-header .bili-header__banner .header-banner__inner,
                .animated-banner,
                li.v-popover-wrap.left-loc-entry{
                    visibility: hidden !important;
                }
                .trending{
                    display: none !important;
                }
                input::-webkit-input-placeholder {
                        /* placeholder字体大小  */
                        font-size: 0px;
                        /* placeholder位置  */
                        text-align: right;
                }
                .bili-header__banner{
                    height: 100px !important;
                }`
            },
            _home: {
                run_in: [0],
                css: `
                .floor-single-card,
                .bili-live-card.is-rcmd{
                    visibility: hidden !important;
                }
                .bili-header .animated-banner,
                section.channel-floor.bili-grid.no-margin,
                picture#bili-header-banner-img,
                .adblock-tips,
                .recommended-swipe,
                .channel-items__left,
                .channel-items__right,
                a.channel-icons__item:nth-of-type(2),
                .header-channel-fixed,
                .carousel{
                    display: none !important;
                }`
            },
            _video: {
                run_in: [1],
                css: `
                .video-page-special-card-small,
                .pop-live-small-mode.part-undefined{
                    display: none !important;
                }`
            },
            _search: {
                run_in: [2],
                css: '.activity-game-list.i_wrapper.search-all-list {display: none !important;}'
            },
            inject_css(id) {
                const arr = [];
                for (const k in this) {
                    const c = this[k];
                    c.run_in?.includes(id) && arr.push(c.css);
                }
                arr.length > 0 && GM_Objects.addstyle(arr.join(''));
            }
        };
        // 事件函数
        #event_module = {
            // 右键菜单事件
            _contextmenu: () => {
                // 隐藏视频的可见, 和是否拉黑视频
                document.addEventListener('contextmenu', (event) => {
                    const [shift, ctrl] = [event.shiftKey, event.ctrlKey];
                    if (!(shift || ctrl)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const target_name = this.#configs.target_class;
                    let i = 0;
                    try {
                        for (const p of event.composedPath()) {
                            const clname = p.className;
                            if (clname === target_name) {
                                if (p.style.visibility !== 'hidden' && p.style.display !== 'none') {
                                    this.#configs.hide_node(p);
                                    const info = this.#utilities_module.get_up_video_info(p);
                                    if (!info.is_video) break;
                                    info.video_id && (shift ? Dynamic_Variants_Manager.block_video(info.video_id) : ((Dynamic_Variants_Manager.cache_block_videos.push(info.video_id)), Dynamic_Variants_Manager.bayes_module.add_new_content(info.title, false)));
                                }
                                break;
                            }
                            if (++i > 6) break;
                        }
                    } catch (error) {
                        console.log(error);
                        GM_Objects.notification('some error cause on menus event', 'warning');
                    }
                }, true);
            },
            // 点击链接事件
            _click: () => {
                const cure_href_reg = /[&\?](live|spm|from)[\w]+=\d+/;
                const get_cure_href = (href) => href && href.startsWith('http') ? href.split(cure_href_reg)?.[0] || href : href;
                document.addEventListener('click', (event) => {
                    const path = event.composedPath();
                    let i = 0;
                    for (const p of path) {
                        if (p.localName === 'a') {
                            let href = p.href || '';
                            if (href && !href.startsWith('javascript')) {
                                if ((this.#configs.id === 1 || this.#configs.id === 5) && (href.includes('/video/') || href.includes('play/'))) return;
                                event.preventDefault();
                                event.stopImmediatePropagation();
                                // 干预因为清除掉拦截的视频信息后生成的href
                                if (href.endsWith('video//')) p.href = 'javascript:void(0)';
                                else {
                                    href = get_cure_href(href);
                                    event.ctrlKey && GM_Objects.set_value('speed_up_video', true);
                                    if (p.target === '_blank') GM_Objects.openintab(href, { insert: 1, active: true });
                                    else window.location.href = href;
                                }
                            }
                            break;
                        }
                        if (++i > 4) break;
                    }
                }, true);
            },
            // 按键事件
            _key_down: () => {
                /*
                    b = bing
                    z = zhihu
                    s = bili
                */
                /*
                    video_page
                    p = play / pause, 判断是否播放, 反向操作
                    l = light on / off, 灯控制
                    t = theatre, 影院模式
                    u = 宽屏
                    +, 声音 +
                    -, 声音 -

                    f = fullscreen // 原生
                    m = mute // 原生
                */
                // 搜索
                const search = {
                    /**
                     * 获取选中的内容
                     * @returns {string}
                     */
                    _get_content() {
                        const select = window.getSelection();
                        const data = select.toString().trim() || this._get_input_box() || '';
                        return data.length > 25 ? data.slice(0, 25) : data;
                    },
                    _box_class_names: ['search-input-el', 'nav-search-input'],
                    _get_input_box() {
                        for (const c of this._box_class_names) {
                            const node = document.getElementsByClassName(c);
                            if (node.length > 0) return node[0].value?.trim();
                        }
                    },
                    _protocols: "https://",
                    s: `search.bilibili.com/all?keyword=`,
                    z: `www.zhihu.com/search?type=content&q=`,
                    b: `cn.bing.com/search?q=`,
                    main(key) {
                        const url = this[key];
                        if (url) {
                            const s = this._get_content();
                            s && (Dynamic_Variants_Manager.key_check(s) === 0 ? GM_Objects.openintab(this._protocols + url + encodeURIComponent(s), { insert: true, activate: true }) : Colorful_Console.main('search content contain black key', 'warning', true));
                            return true;
                        }
                        return false;
                    }
                };
                // 视频控制
                const video_control = {
                    p: () => this.#video_instance.play_control(),
                    l: () => this.#video_instance.light_control(),
                    t: () => this.#video_instance.theatre_mode(),
                    u: () => this.#video_instance.wide_screen(),
                    '=': () => this.#video_instance.voice_control(true),
                    '-': () => this.#video_instance.voice_control(false),
                    main(key) { this[key]?.(); }
                };
                // 关键词黑名单管理
                const manage_black_key = {
                    _func: (data) => {
                        const nodes = document.getElementsByClassName(this.#configs.target_class);
                        for (const node of nodes) {
                            const info = this.#utilities_module.get_up_video_info(node);
                            if (info) {
                                const { title, up_name } = info;
                                (!info.is_video || data.some(e => title.includes(e) || up_name.includes(e))) && this.#configs.hide_node(node);
                            }
                        }
                    },
                    a: { title: 'add', mode: true },
                    r: { title: 'remove', mode: false },
                    main(key) {
                        const c = this[key];
                        if (c) {
                            const title = c.title + ' black key; use space to separate mult words; e.g.: "abc"; or "abc" "bcd".';
                            const s = prompt(title).trim();
                            if (s) {
                                const a = s.split(' ').map(e => e.trim()).filter(e => e && !e.includes("_")).map(e => e.toLowerCase());
                                c.mode ? (Dynamic_Variants_Manager.black_keys.add(a), this._func(a)) : Dynamic_Variants_Manager.black_keys.remove(a);
                            }
                            return true;
                        }
                        return false;
                    }
                };
                // 管理贝叶斯
                const manage_bayes = {
                    _add_white() {
                        const s = prompt('add content to bayes white list(`bayes reset` to reset)').trim();
                        s === 'bayes reset' ? this._reset() : s.length < 6 && Dynamic_Variants_Manager.bayes_module.add_new_content(s, true);
                    },
                    _reset() { confirm('reset bayes? it will clear bayes words, continue?') && Dynamic_Variants_Manager.bayes_module.reset(); },
                    main(key) {
                        if (key !== 'w') return;
                        this._add_white();
                    }
                };
                // 文本标签, 需要排除输入
                const text_tags = ["textarea", "input"];
                document.addEventListener('keydown', (event) => {
                    if (event.shiftKey || event.ctrlKey || event.altKey) return;
                    const target = event.target;
                    const localName = target.localName || '';
                    if (text_tags.includes(localName)) return;
                    const className = target.className || '';
                    if (className && className.includes("editor")) return;
                    const key = event.key.toLowerCase();
                    const id = this.#configs.id;
                    search.main(key) ? null : this.#video_module_init_flag ? video_control.main(key) : (id === 0 || id === 2) && !manage_black_key.main(key) && manage_bayes.main(key);
                });
            },
            /**
             * 配置执行函数
             * @param {number} id
             * @returns {Array}
             */
            get_funcs(id) { return (id < 3 ? Object.getOwnPropertyNames(this).filter(e => e !== 'get_funcs').map(e => this[e]) : [this._click, this._key_down]).map(e => (e.start = 1, e)); }
        };
        // 特定页面执行函数
        #page_modules = {
            // space页面
            _space_module: {
                _create_button(mode) {
                    let button = document.createElement("button");
                    button.id = "AssistButton";
                    button.style.position = "fixed";
                    button.style.bottom = "7%";
                    button.style.left = "4%";
                    button.style.fontSize = "11px";
                    button.style.width = "72px";
                    button.style.height = "30px";
                    button.innerHTML = mode ? 'unBlock' : "Block";
                    document.body.appendChild(button);
                    return button;
                },
                _create_event(button, mode, up_id, up_name) {
                    button.onclick = (event) => {
                        const target = event.target;
                        let text = "Block";
                        if (mode) Statics_Variant_Manager.up_part.unblock(up_id);
                        else {
                            // 拦截up
                            const now = Date.now();
                            const info = {
                                up_id: up_id,
                                up_name: up_name,
                                add_date: now,
                                last_active_date: now,
                                visited_times: 1,
                                block_reason: 0,
                                block_from: 0
                            };
                            Statics_Variant_Manager.up_part.block(info);
                            text = 'unBlock';
                        }
                        target.innerHTML = text;
                        mode = !mode;
                    };
                },
                main() {
                    setTimeout(() => {
                        const title = document.title;
                        const up_name = title.split('的个人空间')[0];
                        if (up_name === 'undefined' || up_name.length === title.length) return;
                        const up_id = Base_Info_Match.get_up_id(location.href);
                        if (up_id) {
                            const mode = Statics_Variant_Manager.up_part.check(up_id);
                            this._create_event(this._create_button(mode), mode, up_id, up_name);
                        }
                    }, 1000);
                }
            },
            // 搜索页面
            _search_module: {
                init: (href) => {
                    // B站页面改变, 非all首次访问的数据也被整合到html
                    if (!['com/video', 'com/all'].some(e => href.includes(e))) return;
                    let init_data = null;
                    Object.defineProperty(GM_Objects.window, '__pinia', {
                        set: (val) => {
                            // 记录, => 标签也写
                            this.#init_data = [];
                            if (val) {
                                const { searchResponse, searchAllResponse } = val.index ? val.index : val;
                                const data = (searchResponse || searchAllResponse)?.searchAllResponse?.result[11]?.data;
                                data ? data.forEach(e => {
                                    const info = {
                                        up_id: e.mid,
                                        up_name: e.author,
                                        title: e.title,
                                        video_id: e.bvid
                                    };
                                    for (const k in info) info[k] = info[k] + ''; // 确保所有的数据都是字符串
                                    ['<em class=\"keyword\">', '</em>', '<em class="keyword">'].forEach(e => (info.title = info.title.replaceAll(e, '')));
                                    if ((!info.video_id && e.arcurl.includes('/cheese')) || Dynamic_Variants_Manager.completed_check(info)) {
                                        this.#utilities_module.clear_data(e);
                                        this.#init_data.push('hide');
                                    } else {
                                        const v_r = { v: 0, r: 0 };
                                        if (Dynamic_Variants_Manager.visited_videos.includes(info.video_id)) v_r.v = 1;
                                        v_r.r = Dynamic_Variants_Manager.rate_videos.check_rate(info.video_id);
                                        this.#init_data.push(((v_r.r !== 0 || v_r.v !== 0) ? v_r : null));
                                    }
                                }) : Colorful_Console.main('init data info object api has changed', 'warning', true);
                            }
                            if (this.#init_data.length === 0) this.#init_data = null;
                            init_data = val;
                        },
                        get() { return init_data; }
                    });
                },
                main: () => {
                    // 插入视频播放, 评分信息
                    const insert_video_stat = (node, v_r) => {
                        const html = `
                        <span class="bili-video-card__stats--item" data-v-62f526a6="">
                            <span data-v-62f526a6="">r: ${v_r.r} | v: ${v_r.v}</span>
                        </span>`;
                        const ele = node.getElementsByClassName('bili-video-card__stats--left');
                        ele.length > 0 ? ele[0].insertAdjacentHTML('beforeend', html) : Colorful_Console.main('fail to insert element to video card', 'debug');
                    };
                    // 执行遍历html元素
                    const clear_all_card = (target, data) => {
                        if (!data || data.length === 0) {
                            Colorful_Console.main('search clear card no data', 'debug');
                            return;
                        }
                        const p = target.getElementsByClassName(this.#configs.parent_class);
                        const k = p.length;
                        if (k === 0) {
                            Colorful_Console.main('search clear card no node', 'debug');
                            return;
                        }
                        const nodes = p[k - 1].getElementsByClassName(this.#configs.target_class);
                        const hd = this.#configs.hide_node;
                        for (const node of nodes) {
                            const v_r = data.shift();
                            v_r && (v_r === 'hide' ? hd(node) : insert_video_stat(node, v_r));
                        }
                    };
                    // 节点变化监, 用于精确执行操作html元素操作
                    const node_monitor = () => {
                        const wrapper = document.getElementsByClassName('search-page-wrapper');
                        wrapper.length > 0 ? new MutationObserver((records) => {
                            let f = false;
                            for (const r of records) {
                                for (const node of r.addedNodes) {
                                    f = (node.className || '').startsWith('search-page');
                                    if (f) {
                                        setTimeout(() => clear_all_card(node, this.#search_page_results), 100);
                                        break;
                                    }
                                }
                                if (f) break;
                            }
                            !f && Colorful_Console.main('search-page monitior records no target', 'debug');
                        }).observe(wrapper[0], { childList: true }) : Colorful_Console.main('search page monitor no target node', 'debug');
                    };
                    this.#init_data ? setTimeout(() => (clear_all_card(document, this.#init_data), this.#init_data = null, node_monitor()), 3000) : node_monitor();
                    const configs = this.#configs;
                    let tmp = null;
                    // 由于首页插入的节点的操作在请求数据之前, 需要额外监听等待数据请求后才执行操作.
                    Object.defineProperty(configs, 'fetch_flag', {
                        set: (v) => { tmp = v, v && setTimeout(() => clear_all_card(document, this.#search_page_results), 300); },
                        get: () => tmp
                    });
                }
            },
            // 视频播放页面
            _video_module: {
                main: () => {
                    // 遍历html元素, 同时清除url的追踪参数
                    const clear_all_card = () => {
                        const nodes = document.getElementsByClassName(this.#configs.target_class);
                        for (const node of nodes) {
                            const links = node.getElementsByTagName('a');
                            for (const a of links) {
                                const href = a.href;
                                if (href) a.href = href.split('?spm_id_from')[0];
                            }
                        }
                    };
                    // 稍微等待一下视频的加载, 这里的这种方式不是很靠谱, 但是懒得监听元素来实现加载, 因为这里的操作对时间不是很敏感.
                    setTimeout(() => {
                        // 页面中相关的信息已经集成在html上
                        clear_all_card();
                        this.#video_instance = new Video_Module();
                        this.#video_module_init_flag = this.#video_instance.is_init_success;
                        this.#video_module_init_flag && this.#video_instance.main();
                    }, 3000);
                }
            },
            _home_module: {
                _maintain() {
                    if (!confirm('data maintenance will take some time, start?')) return;
                    Colorful_Console.main('data maintenance has started', 'info', true), GM_Objects.set_value('maintain', true);
                    try {
                        const data = GM_Objects.get_value('block_ups', []);
                        if (data.length > 1500) {
                            const now = Date.now();
                            const tmp = data.filter(e => {
                                const gap = (now - e.last_active_date) / 1000 / 60 / 60 / 24;
                                if (gap > 210) return false;
                                else if (gap > 150) {
                                    const vtimes = e.visited_times;
                                    return !(vtimes < 2 || (vtimes < 3 && gap > 180));
                                }
                                return true;
                            });
                            tmp.length < data.length && GM_Objects.set_value('block_ups', tmp);
                        }
                    } catch (error) {
                        console.error(error);
                        GM_Objects.set_value('maintain', false), Colorful_Console.main('data maintenance has been completed, close all pages to restart', 'info', true);
                    }
                    setTimeout(() => GM_Objects.window_close(), 5000);
                },
                main() { GM_Objects.registermenucommand('maintain', this._maintain.bind(this)); }
            },
            // 监听拦截up或者视频的变化, 对整个页面遍历, 检查是否是否被拦截
            _block_video_up_data_sync_monitor: () => {
                // 监听同步数据的改变
                // 搜索页, 播放页, 首页
                // add or Remove
                const clear_all_card = (data) => {
                    // 同步数据, 执行清除的操作
                    // 拦截up, 要全部执行, 拦截视频, 则挑出
                    const val = data.value;
                    const [name, id] = typeof val === 'string' ? ['video_id', val] : ['up_id', val['up_id']];
                    const func = this.#configs.hide_node;
                    const nodes = document.getElementsByClassName(this.#configs.target_class);
                    for (const node of nodes) {
                        const info = this.#utilities_module.get_up_video_info(node);
                        if (info) {
                            if (info[name] === id) {
                                func(node);
                                // 如果拦截的是视频, 则跳出, 如果是up, 继续遍历
                                if (name === 'video_id') break;
                            } else if (!info.is_video) func(node);
                        }
                    }
                };
                let tmp = null;
                Object.defineProperty(Dynamic_Variants_Manager, 'up_video_data_sync_info', { set: (v) => { clear_all_card(v), tmp = v; }, get: () => tmp });
            },
            // 主页, 视频播放的初始化过滤
            _init_filter: () => {
                setTimeout(() => {
                    const nodes = document.getElementsByClassName(this.#configs.init_class);
                    if (nodes.length === 0) {
                        Colorful_Console.main('no initial elements', 'debug', true);
                        return;
                    }
                    const hd = this.#configs.hide_node, guvi = this.#utilities_module.get_up_video_info;
                    for (const node of nodes) {
                        const info = guvi(node);
                        info && (!info.is_video || Dynamic_Variants_Manager.completed_check(info)) && hd(node);
                    }
                }, 300);
            },
            /**
             * 配置执行函数
             * @param {number} id
             * @param {string} href
             * @returns {Array}
             */
            get_funcs(id, href) {
                const data = [];
                if (id > 3) return data;
                else if (id !== 3) {
                    if (id !== 2) this._init_filter.start = 1, data.push(this._init_filter);
                    this._block_video_up_data_sync_monitor.start = 0;
                    data.push(this._block_video_up_data_sync_monitor);
                }
                let a = null;
                switch (id) {
                    case 0:
                        a = this._home_module.main.bind(this._home_module), a.type = 1, a.start = 1, data.push(a);
                        break;
                    case 1:
                        this._video_module.main.start = 1, data.push(this._video_module.main);
                        break;
                    case 2:
                        a = this._search_module.init.bind(null, href), a.start = 0, a.type = 0, data.push(a);
                        this._search_module.main.start = 1, data.push(this._search_module.main);
                        break;
                    case 3:
                        a = this._space_module.main.bind(this._space_module), a.start = 1, a.type = 1, data.push(a);
                        break;
                    default:
                        break;
                }
                return data;
            }
        };
        // 添加html元素
        #html_modules = {
            _shade: {
                run_in: Array.from({ length: 6 }, (_val, index) => index).filter(e => e !== 1),
                colors: {
                    yellow: "rgb(247, 232, 176)",
                    green: "rgb(202 ,232, 207)",
                    grey: "rgb(182, 182, 182)",
                    olive: "rgb(207, 230, 161)",
                },
                current_color: '',
                current_opacity: 0,
                id_name: 'screen_shade_cover',
                get opacity() {
                    const h = new Date().getHours();
                    return h > 20
                        ? 0.55
                        : h < 7
                            ? 0.65
                            : h > 15
                                ? h === 18
                                    ? 0.35
                                    : h === 19
                                        ? 0.45
                                        : h === 20
                                            ? 0.5
                                            : 0.3
                                : 0.15;
                },
                get shade_node() { return document.getElementById(this.id_name); },
                /**
                 * 创建遮罩
                 * @param {string} color
                 * @param {number} opacity
                 */
                create_cover(color, opacity = 0.5) {
                    const html = `
                        <div
                            id="${this.id_name}"
                            style="
                                transition: opacity 0.1s ease 0s;
                                z-index: 10000000;
                                margin: 0;
                                border-radius: 0;
                                padding: 0;
                                background: ${color};
                                pointer-events: none;
                                position: fixed;
                                top: -10%;
                                right: -10%;
                                width: 120%;
                                height: 120%;
                                opacity: ${opacity};
                                mix-blend-mode: multiply;
                                display: block;
                            "
                        ></div>`;
                    document.documentElement?.insertAdjacentHTML("afterbegin", html);
                },
                set_color(color, mode = true) {
                    if (this.current_color === color) return;
                    this.change_color(color);
                    this.current_color = color;
                    mode && GM_Objects.set_value('shade_color', color);
                },
                change_color(color) {
                    const node = this.shade_node;
                    node && (node.style.background = color);
                },
                change_opacity(opacity) {
                    if (this.current_opacity !== opacity) return;
                    this.current_opacity = opacity;
                    const node = this.shade_node;
                    node && (node.style.opacity = opacity);
                },
                init() {
                    this.current_color = GM_Objects.get_value('shade_color') || this.colors.yellow;
                    this.current_opacity = this.opacity;
                    this.create_cover(this.current_color, this.current_opacity);
                },
                main() {
                    // 每次打开页面都写入透明度
                    GM_Objects.set_value('shade_opacity', this.current_opacity);
                    const uppercase = (e) => e.slice(0, 1).toUpperCase() + e.slice(1);
                    Object.keys(this.colors).forEach((e, index) => GM_Objects.registermenucommand(uppercase(e), this.set_color.bind(this, e), e.slice(0, 1) + index));
                    GM_Objects.addvaluechangeistener('shade_color', ((...args) => this.set_color(args[2], false)).bind(this));
                    GM_Objects.addvaluechangeistener('shade_opacity', ((...args) => this.change_opacity(args[2])).bind(this));
                }
            },
            get_funcs(id) {
                if (this._shade.run_in.includes(id)) {
                    this._shade.init();
                    const a = this._shade.main.bind(this._shade);
                    a.start = 1;
                    return [a];
                }
                return [];
            }
        };
        /**
         * 构造函数
         * @param {string} href
         */
        constructor(href) {
            // 确定配置参数
            const site = ['search', 'space', 'video', 'play'].find(e => href.includes(e)) || (href.endsWith('.com/') && href.includes('www.') ? 'home' : 'other');
            // 载入配置
            this.#configs = this.#site_configs[site];
            this.#configs['api_suffix'] && (this.#configs['api_prefix'] = 'https://api.bilibili.com/x/web-interface/' + this.#configs['api_suffix']);
            // 根据id生成执行函数
            const id = this.#configs.id;
            // 注入css, 尽快执行
            this.#css_module.inject_css(id);
            // 初始化动态数据管理模块
            Dynamic_Variants_Manager.data_init(id);
            // 配置启动函数
            [[this.#proxy_module], [this.#page_modules, href], [this.#event_module], [this.#html_modules]].forEach(e => (e.length === 1 ? e[0].get_funcs(id) : e[0].get_funcs(id, e[1])).forEach(e => (e.start ? this.#end_load_funcs : this.#start_load_funcs).push(e)));
        }
        // 启动整个程序
        start() {
            /**
             * 执行函数, call(this), 即使用当前optimizer这整个对象的this, 其他的自定义this
             * @param {boolean} mode
             */
            const load_func = (mode) => (mode ? this.#start_load_funcs : this.#end_load_funcs).forEach(e => e.type ? e() : e.call(this));
            load_func(true), GM_Objects.window.onload = () => (load_func(false), !Dynamic_Variants_Manager.show_status() && Colorful_Console.main('bili_optimizer has started'));
        }
    }
    // 优化器主体 -----------

    // ----------------- 启动
    (() => {
        // 假如数据处于维护中, 就不执行脚本
        if (GM_Objects.get_value('maintain', false)) Colorful_Console.main('data under maintenance, wait a moment', 'warning', true);
        else {
            const { href, search, origin, pathname } = location;
            // 清除直接访问链接带有的追踪参数
            search.startsWith('?spm_id_from') ? (window.location.href = origin + pathname) : (new Bili_Optimizer(href)).start();
        }
    })();
    // 启动 -----------------
})();
