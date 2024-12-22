// ==UserScript==
// @name         bili_bili_optimizer
// @namespace    https://github.com/Kyouichirou
// @version      3.5.0
// @description  control and enjoy bilibili!
// @author       Lian, https://kyouichirou.github.io/
// @icon         https://www.bilibili.com/favicon.ico
// @homepage     https://github.com/Kyouichirou/BiliBili_Optimizer
// @updateURL    https://github.com/Kyouichirou/BiliBili_Optimizer/raw/main/bili_bili_optimizer.user.js
// @downloadURL  https://github.com/Kyouichirou/BiliBili_Optimizer/raw/main/bili_bili_optimizer.user.js
// @supportURL   https://github.com/Kyouichirou/BiliBili_Optimizer
// @match        https://t.bilibili.com/
// @match        https://www.bilibili.com/*
// @match        https://space.bilibili.com/*
// @match        https://search.bilibili.com/*
// @connect      files.superbed.cn
// @connect      8.z.wiki
// @connect      wkphoto.cdn.bcebos.com
// @grant        GM_info
// @grant        GM_getTab
// @grant        GM_getTabs
// @grant        GM_saveTab
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        window.close
// @grant        unsafeWindow
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
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
         * @param {boolean} mode true, 检查值是否为空, 默认false
         * @returns {null}
         */
        set_value: (key_name, value, mode = false) => (!mode || (mode && value)) && GM_setValue(key_name, value),
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
         * @returns {number}
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
         * 移除键值监听
         * @param {number} cid
         * @returns {null}
         */
        removevaluechangeistener(cid) { return GM_removeValueChangeListener(cid); },
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
        /**
         * 设置标签
         * @param {string} key
         * @param {any} val
         */
        set_tab(key, val) {
            this.get_tab((tab) => {
                tab[key] = Array.isArray(val) ? Array.from(val) : val;
                GM_saveTab(tab);
            });
        },
        /**
         * 读取多个标签
         * @param {Function} func
         * @returns {undefined}
         */
        get_tabs: (func) => GM_getTabs(func),
        /**
         * 读取单个标签
         * @param {Function} func
         * @returns {undefined}
         */
        get_tab: (func) => GM_getTab(func),
        // 脚本信息
        info: GM_info,
        // 宿主页面window
        window: unsafeWindow,
        // 判断是否支持监听url的改变
        supportonurlchange: window.onurlchange,
        // httprequest, 可跨越
        xmlhttprequest: GM_xmlhttpRequest
    };
    // GM内置函数/对象 ---------------

    // --------------- 通用函数
    // 自定义打印内容
    const Colorful_Console = {
        _colors: {
            warning: "#F73E3E",
            debug: "#327662",
            info: "#1475b2",
            crash: "#FF0000"
        },
        /**
         * 执行打印
         * @param {string} content
         * @param {string} type
         * @param {boolean} mode
         */
        print(content, type = 'info', mode = false) {
            let bc = this._colors[type];
            const title = bc ? type : (bc = this._colors.info, 'info'),
                params = [
                    `%c ${title} %c ${content} `,
                    "padding: 1px; border-radius: 3px 0 0 3px; color: #fff; font-size: 12px; background: #606060;",
                    `padding: 1px; border-radius: 0 3px 3px 0; color: #fff; font-size: 12px; background: ${bc};`
                ];
            console.log(...params), mode && GM_Objects.notification(content, type);
            bc === this._colors.crash && Statics_Variant_Manager.add_crash_log(content);
        }
    };

    // bvid & aid 相互转换
    const Bili_id_Convertor = {
        _xor_c: 23442827791579n,
        _mask_c: 2251799813685247n,
        _alphabet: "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf",
        _max_aid: 1n << 51n,
        _bv_indexs: [8, 7, 0, 5, 1, 3, 2, 4, 6],
        _av_indexs: [8, 7, 0, 5, 1, 3, 2, 4, 6].reverse(),
        _prefix: "BV1",
        _bvid_len: 9,
        get _alpha_bi() { return BigInt(this._alphabet.length); },
        _av2bv(aid) {
            let tmp = (this._max_aid | BigInt(aid)) ^ this._xor_c;
            const ba = this._alpha_bi;
            return this._prefix + this._bv_indexs.reduce((acc, cur) => {
                acc[cur] = this._alphabet[Number(tmp % ba)];
                tmp /= ba;
                return acc;
            }, new Array(this._bvid_len).fill("")).join('');
        },
        _bv2av(bvid) {
            const ba = this._alpha_bi, bid = bvid.slice(this._prefix.length),
                tmp = this._av_indexs.reduce((acc, cur) => acc * ba + BigInt(this._alphabet.indexOf(bid[cur])), 0n);
            return Number((tmp & this._mask_c) ^ this._xor_c);
        },
        /**
         * @param {string|number} id
         * @returns {number|null|string}
         */
        main(id) { return typeof id === 'number' ? this._av2bv(id) : id.startsWith(this._prefix) ? this._bv2av(id) : null; }
    };

    // 数据转换为对应的模板
    const Data_Switch = {
        // 首页的aid没有使用aid, 而是id
        home: {
            id: 0, bvid: '', cid: 0, goto: '', uri: '', pic: '', pic_4_3: '',
            title: '', duration: 0, pubdate: 0, owner: { mid: 0, name: '', face: '' },
            stat: { view: 0, like: 0, danmaku: 0, vt: 0 },
            av_feature: null, is_followed: 0,
            rcmd_reason: { reason_type: 0 },
            show_info: 0, track_id: '', pos: 0, room_info: null, ogv_info: null,
            business_info: null, is_stock: 0, enable_vt: 0, vt_display: '',
            dislike_switch: 0, dislike_switch_pc: 0
        },
        _search_title_tags: ['<em class="keyword">', '</em>'],
        _get_data(key, obj) {
            try {
                const d = obj[key];
                if (d === undefined) {
                    for (const k in obj) {
                        const tmp = obj[k];
                        if (tmp && tmp.constructor === Object) {
                            const m = this._get_data(key, tmp);
                            if (m === undefined) continue;
                            return m;
                        }
                    }
                } else return d.constructor === Object ? d.count : d;
                return undefined;
            } catch (error) {
                debugger;
            }
        },
        _get_key(module, target) {
            // 递归调用, 遍历清空各层级的内容, 不涉及数组
            // null => object
            if (module && module.constructor === Object) {
                for (const key in module) {
                    const tmp = module[key];
                    const vtype = typeof tmp;
                    if (vtype === 'string') module[key] = this._get_data(key, target) ?? '';
                    else if (vtype === 'number') module[key] = this._get_data(key, target) ?? 0;
                    else if (tmp) this._get_key(tmp, target);
                }
            }
        },
        _check(module, module_name, check_id) {
            module.add_time = Date.now();
            if (module_name === 'home') {
                // 假如没有 av, 内容不会被写入
                if (!module.goto) module.goto = 'av';
                if (!module.id) {
                    const id = module[check_id];
                    // 由于首页的aid没有使用aid, 而是id, 所以需要转换, 不做额外的处理
                    // aid不存在会导致视频的更新出现问题
                    if (id) module.id = Bili_id_Convertor.main(id);
                    else module = null;
                } else module.id = parseInt(module.id);
                if (module && module.owner.mid) module.owner.mid = parseInt(module.owner.mid);
            }
            return module;
        },
        // 视频持续的时间(s), 将09:01这种格式的时间转为秒
        duration_convertor: (duration) => typeof duration === 'string' ? duration.includes(':') ? [0, ...duration.replaceAll(' ', '').split(':')].slice(-3).reduce((units, cur, index) => {
            units[index] = units[index] * parseInt(cur);
            return units;
        }, [3600, 60, 1]).reduce((ic, cur) => ic + cur, 0) : 1e8 : duration,
        search_title_clear(title) { return this._search_title_tags.reduce((acc, cur) => acc.replaceAll(cur, ''), title); },
        dynamic_to_home(target, module_name = 'home', check_id = 'bvid') {
            // 深度拷贝对象
            const module = JSON.parse(JSON.stringify(this[module_name]));
            this._get_key(module, target);
            const b = {
                play: 0,
                cover: "",
                duration_text: "",
                aid: 0
            }, a = {
                cover: "pic",
                duration_text: "duration",
                aid: "id"
            };
            this._get_key(module, target);
            this._get_key(b, target);
            for (const k in a) {
                const e = a[k];
                if (!module[e]) module[e] = b[k];
            }
            const bp = b.play;
            if (!module.stat.view && bp) module.stat.view = bp.includes('万') ? Number(bp.replaceAll('万', '')) * 1e4 : parseInt(bp);
            if (module.duration) module.duration = this.duration_convertor(module.duration);
            const dm = module.stat.danmaku;
            if (dm) module.stat.danmaku = dm.includes('万') ? Number(dm.replaceAll('万', '')) * 1e4 : parseInt(dm);
            return this._check(module, module_name, check_id);
        },
        video_to_home(target, module_name = 'home', check_id = 'bvid') {
            // 深度拷贝对象
            const module = JSON.parse(JSON.stringify(this[module_name]));
            Array.isArray(target) ? target.forEach(e => this._get_key(module, e)) : this._get_key(module, target);
            return this._check(module, module_name, check_id);
        },
        search_to_home(target, module_name = 'home', check_id = 'bvid') {
            const module = JSON.parse(JSON.stringify(this[module_name]));
            this._get_key(module, target);
            if (!module.stat.view) module.stat.view = target.play || 0;
            if (!module.owner.name) module.owner.name = target.author || '';
            if (!module.owner.face) module.owner.face = target.upic || '';
            if (module.duration) module.duration = this.duration_convertor(module.duration);
            const title = module.title;
            if (title) module.title = this.search_title_clear(title);
            return this._check(module, module_name, check_id);
        },
        base_video_info_to_home(target, module_name = 'home', check_id = 'bvid') {
            const module = JSON.parse(JSON.stringify(this[module_name]));
            this._get_key(module, target);
            return this._check(module, module_name, check_id);
        }
    };

    // 基本信息匹配
    const Base_Info_Match = {
        // video id
        _bvid_reg: /[a-z\d]{10,}/i,
        // up uid, up的长度范围很广从1位数到16位数
        _mid_reg: /(?<=com\/)\d+/,
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
        get_bvid(href) { return href.includes('/video/') ? this._match(this._bvid_reg, href) : ''; },
        /**
         * 匹配up id
         * @param {string} href
         * @returns {number}
         */
        get_mid(href) { return href.includes('space.bilibili') ? parseInt(this._match(this._mid_reg, href)) : 0; }
    };
    // 通用函数 ---------------

    // ---------------- 链接常量
    const Constants_URLs = {
        blog: 'https://kyouichirou.github.io/',
        manual: 'https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/README.md',
        weibo_ico: 'https://files.superbed.cn/store/images/dc/0c/6630afa60ea9cb140356dc0c.webp',
        weibo_url: 'https://files.superbed.cn/store/images/b9/2a/6630af950ea9cb140356b92a.png',
        tea_ico: 'https://files.superbed.cn/store/images/72/8c/6630af710ea9cb140356728c.png',
        support: 'https://8.z.wiki/autoupload/20240518/nodV/payme.webp',
        install: 'https://github.com/Kyouichirou/BiliBili_Optimizer/raw/main/bili_bili_optimizer.user.js',
        feedback: 'https://github.com/Kyouichirou/BiliBili_Optimizer/issues',
        /**
         * 将字符串响应头转为字典, 请求头存在没有空格的现象
         * @param {string} content
         * @returns {object}
         */
        _convert_dic(content) {
            return content.split('\n').map(e => e.trim()).filter(e => e.length > 0).map(e => e.replaceAll(' ', '').split(':')).reduce((acc, e) => {
                acc[e[0]] = e[1];
                return acc;
            }, {});
        },
        /**
         * 发起请求
         * @param {string} url
         * @returns {Promise}
         */
        _http(url) {
            return new Promise((resolve, reject) => GM_Objects.xmlhttprequest({
                method: "HEAD",
                url: url,
                headers: { "Cache-Control": "no-cache" },
                onload: (response) => {
                    const code = response.status;
                    // 请求头得到的内容是字符串, 需要转换为对象
                    if (code === 200) {
                        const cl = this._convert_dic(response.responseHeaders)['content-length'];
                        cl && parseInt(cl) > 0 ? resolve(true) : reject('content-length: ' + cl + `, : ${url}`);
                    } else reject('request code: ' + code + `, : ${url}`);
                },
                onerror: (response) => (console.error(response), reject('error: ' + url)),
                ontimeout: (_response) => reject('timeout: ' + url)
            }));
        },
        // 检查图床的图片是否可以正常访问, 每10天检查一次
        _check_pic() {
            const xmls = [];
            for (const k in this) {
                const url = (k === 'main' || k.startsWith('_')) ? '' : this[k];
                GM_Objects.info.script.connects.some((e) => url.includes(e)) && xmls.push(this._http(url));
            }
            Promise.allSettled(xmls).then(res => {
                const error_urls = res.filter(item => item.status === 'rejected').map(item => item.reason);
                error_urls.length > 0 ? (GM_Objects.notification('fail to load some pics', 'warning', true), console.log(`fail to load some pics:\n${error_urls.join(';\n')}`)) : Colorful_Console.print('all pics have been loaded successfully', 'debug');
                GM_Objects.set_value('pic_check_date', Date.now());
            });
        },
        main() { setTimeout(() => (Date.now() - GM_Objects.get_value('pic_check_date', 0)) / 1000 / 60 / 60 / 24 > 10 && this._check_pic(), 10000); }
    };
    // 链接常量 ---------------

    // tampermonkey的存储读写操作太过于麻烦, 大规模的数据很是不便
    // 更大规模的历史数据存储, 更详细的视频数据存储
    // 相关视频的推荐
    // 相关up的推荐
    // 自定义一套算法来补充数据的推荐
    class Indexed_DB {
        // 打开的数据库名称
        static tb_name_dic = {
            pocket: 'pocket_tb',
            recommend: 'rec_video_tb',
            history: 'his_tb'
        };
        #db_name = null;
        // 打开数据库的
        #db_open = null;
        #db_instance = null;
        // 需要创建的表
        #table_arr = null;
        // 是否触发更新标志
        #is_update_flag = false;
        // 是否有错误标志
        #error_flag = false;
        get error_flag() { return this.#error_flag; }
        // 错误处理
        #error_wrapper(event, source_name) {
            this.#error_flag = true;
            const error = 'indexeddb error, ' + source_name + ': ' + event.target.error.message;
            Colorful_Console.print(error);
            return error;
        }
        // request的简单封装
        #request_wrapper(request, return_type) {
            return new Promise((resolve, reject) => {
                request.onsuccess = (e) => resolve(return_type === 'value' ? e.target.result : e.target.result ? true : false);
                request.onerror = (e) => reject(this.#error_wrapper(e, 'request wrapper'));
            });
        }
        // 事务的简单封装
        #transaction_wrapper(transaction) {
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(this.#error_wrapper(e, 'transaction wrapper'));
            });
        }
        // 其他事件
        #create_other_event() {
            // 版本变化监听事件
            this.#db_open.onversionchange = (_e) => console.log("The version of this database has changed");
            // 意外关闭才会触发这个事件, 如数据库被手动删除, 正常关闭数据库不会触发这个事件
            this.#db_open.onclose = (e) => this.#error_wrapper(e, 'close error');
        }
        // 检查表是否存在
        #check_tables_is_exist() { return this.#table_arr.filter(e => !this.#db_instance.objectStoreNames.contains(e.table_name)); }
        // 重新打开数据库, 创建新的表
        #reopen_db() {
            const v = this.#db_instance.version + 1;
            this.#db_instance.close();
            this.#db_open = indexedDB.open(this.#db_name, v);
            return this.initialize();
        }
        // 创建表
        #create_tables() {
            // transaction中只有最后的事务执行完毕才会执行oncomplete回调函数, 而不是每个事务执行完毕时执行oncomplete回调函数
            return this.#transaction_wrapper(this.#table_arr.map(e => {
                const keypath = e.key_path;
                return this.#db_instance.createObjectStore(e.table_name, keypath ? { keyPath: keypath } : { autoIncrement: true });
            }).pop().transaction);
        }
        // 获得表对象
        #get_table_obj(table_name, rwmode) { return this.#db_instance.transaction(table_name, rwmode).objectStore(table_name); }
        /**
         * 具体的表内容操作, 增/删/改/查
         * @param {string|Array} data
         * @param {string} table_name
         * @param {string} rwmode
         * @param {string} operator
         * @param {string} value_type
         * @param {boolean} is_mult_args 多参数传递
         * @returns {Promise}
         */
        #table_operation(data, table_name, rwmode, operator, value_type, is_mult_args = false) {
            if (Array.isArray(data) && !is_mult_args) {
                const table = this.#get_table_obj(table_name, rwmode);
                return Promise.all(data.map(e => this.#request_wrapper(table[operator](e), value_type)));
            } else return this.#request_wrapper(this.#get_table_obj(table_name, rwmode)[operator](...(is_mult_args ? data : [data])), value_type);
        }
        add(table_name, data) { return this.#table_operation(data, table_name, 'readwrite', 'put', 'boolean'); }
        delete(table_name, data) { return this.#table_operation(data, table_name, 'readwrite', 'delete', 'boolean'); }
        get(table_name, data) { return this.#table_operation(data, table_name, 'readonly', 'get', 'value'); }
        check(table_name, data) { return this.#table_operation(data, table_name, 'readonly', 'get', 'boolean'); }
        /**
         * 自定义筛选检索
         * @param {string} table_name
         * @param {Function} condition_func 自定义条件函数
         * @param {any} args
         * @param {number} limit
         * @returns {Promise}
         */
        batch_get_by_condition(table_name, condition_func, args, limit = 10) {
            return new Promise((resolve, reject) => {
                const table = this.#get_table_obj(table_name, 'readonly'), request = table.openCursor(), results = [];
                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor && results.length < limit) {
                        const value = cursor.value;
                        condition_func(value, ...args) && results.push(value);
                        cursor.continue();
                    } else resolve(results.length === 0 ? false : results);
                };
                request.onerror = (e) => reject(this.#error_wrapper(e, 'batch get by condition error'));
            });
        }
        /**
         * 批量获取数据
         * @param {string} table_name
         * @param {number} limit
         * @param {number} offset 游标指针移动的位置
         * @returns {Promise}
         */
        batch_get(table_name, limit = 10, offset = 0) {
            return new Promise((resolve, reject) => {
                const table = this.#get_table_obj(table_name, 'readonly'), request = table.openCursor(), results = [];
                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor && results.length < limit) {
                        if (offset > 0) {
                            cursor.advance(offset);
                            offset = 0;
                        } else {
                            results.push(cursor.value);
                            cursor.continue();
                        }
                    } else resolve(results.length === 0 ? false : results);
                };
                request.onerror = (e) => reject(this.#error_wrapper(e, 'batch get error'));
            });
        }
        get_all(table_name, limit = 10) { return this.#table_operation([null, limit], table_name, 'readonly', 'getAll', 'value', true); }
        /**
         * 批量根据条件删除
         * @param {string} table_name
         * @param {Function} condition_func
         * @param {Array} args
         * @returns {Promise}
         */
        batch_del_by_condition(table_name, condition_func, args) {
            return new Promise((resolve, reject) => {
                let f = false;
                const table = this.#get_table_obj(table_name, 'readwrite'), request = table.openCursor();
                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        if (condition_func(cursor.value, ...args)) {
                            f = true;
                            table.delete(cursor.key);
                        }
                        cursor.continue();
                    } else resolve(f);
                };
                request.onerror = (e) => reject(this.#error_wrapper(e, 'batch delete error'));
            });
        }
        // 数据库关闭
        close() { this.#db_instance.close(); }
        // 初始化数据库
        initialize() {
            return new Promise((resolve, reject) => {
                // 升级事件, 当数据库不存在时, 先触发
                // 创建表格等操作必须在这个事件之下才能执行
                this.#db_open.onupgradeneeded = (e) => {
                    this.#db_instance = e.target.result;
                    this.#is_update_flag = true;
                    this.#create_tables().then(() => resolve(0)).catch(() => reject('fail to create tables'));
                };
                // 数据库不存在时, 先触发上面的升级事件, 然后才触发本事件
                this.#db_open.onsuccess = (e) => {
                    this.#create_other_event();
                    if (this.#is_update_flag) return;
                    this.#db_instance = e.target.result;
                    const arr = this.#check_tables_is_exist();
                    if (arr.length > 0) {
                        this.#table_arr = arr;
                        this.#reopen_db().then(() => resolve(2)).catch(e => reject(this.#error_wrapper(e, 'reopen error')));
                    } else resolve(1);
                };
                this.#db_open.onerror = (e) => reject(this.#error_wrapper(e, 'open error'));
                /*
                The event handler for the blocked event.
                This event is triggered when the upgradeneeded event should be triggered _
                because of a version change but the database is still in use (i.e. not closed) somewhere,
                even after the versionchange event was sent.
                */
                this.#db_open.onblocked = (e) => reject(this.#error_wrapper(e, 'blocked error'));;
            });
        }
        /**
         * @param {string} dbname
         * @param {Array} table_dics [{'table_name':'', 'key_path':''}]
         */
        constructor(dbname, table_arr) {
            this.#db_name = dbname;
            this.#table_arr = table_arr;
            this.#db_open = indexedDB.open(dbname);
        }
    }
    // ----------indexedDB end--------

    // api数据请求部分
    class Web_Request {
        // 需要注意登录与否
        // 携带请求信息
        static api_prefix = '//api.bilibili.com/x/';
        #api_prefix = null;
        constructor(api_prefix) { this.#api_prefix = 'https:' + api_prefix; }
        #request(url, configs) {
            return new Promise((resolve, reject) => fetch(url, configs)
                .then(res => res.json())
                .then(data => {
                    if (data.code !== 0) {
                        console.log(data);
                        reject();
                    } else resolve(data);
                }).catch(e => reject(e))
            );
        }
        // up动态
        get_dynamic_data() { return this.#request(`${this.#api_prefix}polymer/web-dynamic/v1/feed/all?timezone_offset=-480&type=video&platform=web&page=1`, { credentials: "include" }); }
        // 获取视频基本信息
        get_video_base_info(bvid) { return this.#request(`${this.#api_prefix}web-interface/view?bvid=${bvid}`, { credentials: "include" }); }
    }

    // 暂未启用部分 -----------
    // 数据导出导入管理
    const Data_Manager = {};
    // ------------- 暂未启用部分

    // ------- 支持模块
    const Support_Me = {
        _id_name: 'support_me',
        _interval_id: 0,
        _support: null,
        _tips: null,
        _opacity: null,
        _timeout: 30,
        _tips_text: 'this tips will be automatically closed or you can click anywhere of popup to close it.',
        get _html() {
            const mt = -5;
            return `
                <div
                    id="${this._id_name}"
                    style="
                        background: darkgray;
                        text-align: justify;
                        width: 700px;
                        font-size: 16px;
                        height: 468px;
                        position: fixed;
                        top:50%;
                        left:50%;
                        transform: translate(-50%,-50%);
                        z-index: 100000;
                    "
                >
                    <div style="padding: 2.5%; font-weight: bold; font-size: 18px; font-family: Microsoft YaHei;">
                        Support Me!
                        <span
                            class="manual_btn"
                            style="font-size: 12px; font-weight: normal; float: right"
                        >
                            <i
                                title="click, share with your friends. share to weibo"
                                style="
                                    margin-right: 10px;
                                    content: url(${Constants_URLs.weibo_ico});
                                "
                            ></i>
                            <a
                                href=${Constants_URLs.manual}
                                target="_blank"
                                title="help manual"
                                style="color: #2b638b"
                                >Manual</a
                            >
                            <span> || version: ${GM_info.script.version}</span>
                        </span>
                    </div>
                    <div style="font-family: Monotype Corsiva; font-size: 16px; padding-left: 2%">
                        make thing better and simpler.!
                        <img
                            src="${Constants_URLs.tea_ico}"
                            style="
                                float: left;
                                height: 42px;
                                width: 42px;
                                margin: -10px 4px 0 0px;
                            "
                        />
                    </div>
                    <div
                        class="support_img"
                        style="padding-top: 4%; width: 100%; padding-left: 7.5%"
                        title="any help, support me.!"
                    >
                        <div class="qrCode">
                            <img
                                src="${Constants_URLs.support}"
                            />
                        </div>
                    </div>
                    <div class="timeout" style="font-size: 12px; padding: 3%">
                        ${this._timeout}s, ${this._tips_text}.
                    </div>
                    <a
                        href=${Constants_URLs.blog}
                        target="_blank"
                        style="margin: ${mt}px 10px 0px 0px; float: right; font-size: 14px; color: teal"
                        title="my blog"
                    >
                        Github: Lian
                    </a>
                </div>`;
        },
        /**
         * 更变透明度
         * @param {number} opacity
         */
        _opacity_change(opacity) {
            const target = document.getElementById("screen_shade_cover");
            target && (this._opacity === null ? (this._opacity = target.style.opacity) : target.style.opacity !== opacity) && (target.style.opacity = opacity);
        },
        // 微博分享
        _share_weibo() {
            const url = `https://service.weibo.com/share/share.php?url=${GM_Objects.info.script.supportURL}&title=BiliBili_Optimizer, 更好的B站.!&summery=undefined&pic=${Constants_URLs.weibo_url}&#_loginLayer_${Date.now()}`;
            GM_Objects.openintab(url, { insert: 1, active: true });
        },
        // 倒计时
        _timer() {
            let time = this._timeout;
            this._interval_id = setInterval(() => {
                this._tips.innerText = `${--time}s, ${this._tips_text}`;
                time === 0 && this._remove();
            }, 1000);
        },
        // click事件
        _click_event() { this._support.onclick = (e) => e.target.localName === "i" ? this._share_weibo() : e.target.localName !== "a" && setTimeout(() => this._remove(), 300); },
        // 创建弹窗
        _creat_popup() {
            // 假如是视频播放页面就暂停播放
            unsafeWindow.player?.pause();
            // 先将遮罩设置为透明
            this._opacity_change(0);
            document.documentElement.insertAdjacentHTML("beforeend", this._html);
            setTimeout(() => {
                this._support = document.getElementById(this.id_name);
                this._tips = this._support.getElementsByClassName("timeout")[0];
                this._click_event();
                this._timer();
            }, 300);
        },
        // 销毁弹窗
        _remove() {
            if (this._interval_id) {
                clearInterval(this._interval_id);
                this._interval_id = null;
            }
            this._opacity_change(this._opacity);
            this._opacity = null;
            this._support.remove();
            this._support = null;
            this._tips = null;
            unsafeWindow.player?.play();
        },
        main() { this._support ? this._remove() : this._creat_popup(); },
    };
    // 支持模块 -------

    // Bayes_Module ----------
    class Bayes_Module {
        // 启用状态
        enable_state = true;
        #module_monitor_id = null;
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
            '【Udemy付费课程】PythonNLP自然语言处理（SpaCy、NLTK、Sklearn、CNN）和8实践个项目（中英文字幕）',
            '【Udemy高分付费课程】2022Python数据科学和机器学习训练营-Tensorflow、深度学习、神经网络、回归分类、人工智能（中英文字幕）',
            '【Udemy高分付费课程】Python数据结构与算法-终极Python编码面试和计算机科学训练营（中英文字幕）',
            '【Udemy高分Python机器学习课程】2022完整训练营-使用Tensorflow、Pandas进行Python机器学习（中英文字幕）下',
            '【Udemy高分Python机器学习课程】2022完整训练营-使用Tensorflow、Pandas进行Python机器学习（中英文字幕）上',
            '【UdemyPython机器学习】在Python中学习机器学习、深度学习、贝叶斯学习和模型部署（中英文字幕）',
            '【Udemy排名第一的Python课程】2022PythonPRO训练营-100天构建100个Python项目成为实战专家！（中英文字幕）P3',
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
            '「Python」进阶教程什么是构造方法？构造方法__initial__以及参数self的作用',
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
        #bayes_white_len = 0;
        #bayes_black_len = 0;
        #bayes_total_len = 0;
        // 词频
        #bayes_black_counter = null;
        #bayes_white_counter = null;
        // 词汇出现总数
        #white_words = 0;
        #black_words = 0;
        // 内容长度限制 = (feature_length_limit - 1) * 1 + 2, 即假设内容最起码包好一个词(2) + 单个值(1)
        #content_len_limit = 0;
        // 模型参数/超参数
        #configs = {
            // 拉普拉斯平滑系数, 越小越细腻
            alpha: 1,
            // 临界值, 当w和b的概率的差距大于临界值时，执行判断
            threshold: 0.15,
            // 单个字的权重
            single_weight: 1,
            // 特征值个数限制
            feature_length_limit: 5,
            // 模型名称
            name: 'multinomialnb',
        };
        // 计算的详情
        #result_detail = { 'content': '', 'seg_array': null, 'black_pro': 0, 'white_pro': 0, 'ratio': 0, 'class': '' };
        // 预先计算部分的值
        #pre_cal_data = {
            'w_t': 0,
            'b_t': 0,
            'w_1': 0,
            'b_1': 0
        };
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
        // 获取词-数量
        #get_word_counter() { this.#bayes_black_counter = GM_Objects.get_value('bayes_black_counter'), this.#bayes_white_counter = GM_Objects.get_value('bayes_white_counter'); }
        // 总词汇数
        get #features_length() { return Object.keys(Object.assign({}, this.#bayes_black_counter, this.#bayes_white_counter)).length; }
        #update_pre_cal() {
            // 当数值为0时, 取alpha进行计算的结果
            const w_t = Math.log(this.#white_words), b_t = Math.log(this.#black_words), a = Math.log(this.#configs.alpha), w_1 = a - w_t, b_1 = a - b_t;
            this.#pre_cal_data.w_t = w_t;
            this.#pre_cal_data.b_t = b_t;
            this.#pre_cal_data.w_1 = w_1;
            this.#pre_cal_data.b_1 = b_1;
        }
        // 各个类别下词数
        #update_words_cal() {
            const sum = (dic) => Object.values(dic).reduce((acc, cur) => acc + cur, 0);
            const total_features_length = this.#features_length * this.#configs.alpha;
            // 对所有值 + alpha
            this.#white_words = sum(this.#bayes_white_counter) + total_features_length;
            this.#black_words = sum(this.#bayes_black_counter) + total_features_length;
        }
        #update_content_len_limit() { this.#content_len_limit = (this.#configs.feature_length_limit - 1) * 1 + 2; }
        /**
         * 计算先验概率
         * @param {number} bayes_black_len
         * @param {number} bayes_white_len
         * @param {number} bayes_total_len
         */
        #update_prior_probability(bayes_black_len, bayes_white_len, bayes_total_len) {
            this.#black_p = bayes_black_len > 0 ? Math.log(bayes_black_len) - Math.log(bayes_total_len) : Math.log(this.#configs.alpha / (bayes_total_len + 2 * this.#configs.alpha));
            this.#white_p = bayes_white_len > 0 ? Math.log(bayes_white_len) - Math.log(bayes_total_len) : Math.log(this.#configs.alpha / (bayes_total_len + 2 * this.#configs.alpha));
        }
        /**
         * 更新模型使用的参数
         * @param {boolean} mode
         */
        #update_paramters() {
            // 先验概率
            this.#update_prior_probability(this.#bayes_black_len, this.#bayes_white_len, this.#bayes_total_len);
            // 特征数量
            this.#update_words_cal();
            // 预先计算部分的值
            this.#update_pre_cal();
            // 内容长度限制
            this.#update_content_len_limit();
        }
        #get_configs() { this.#configs = GM_Objects.get_value('bayes_configs', this.#configs); }
        #get_module() { this.bayes = this.#cal_bayes.bind(this, ...(this.#configs.name !== 'multinomialnb' ? [0, 0] : [this.#white_p, this.#black_p])); }
        /**
         * 调整具体的数值
         * @param {string} key
         * @param {number} lower
         * @param {number} upupper
         * @param {function} func
         * @param {number} old_val
         * @param {number} new_val
         * @returns {number}
         */
        #adjust_config_val(key, lower, upupper, func, old_val, new_val) {
            // 确保输入内容为数字
            new_val = func(new_val);
            // 浮点数的比较, 精度为10^-5
            if (Math.abs(old_val - new_val) < 1e-5) return 0;
            const r = (lower < new_val && new_val < upupper) ? [`successfully adjust ${key} : from ${old_val} to ${new_val}`] : [`${key} must be between ${lower} and ${upupper}`, 'warning'];
            Colorful_Console.print(...r);
            return r.length === 1 ? new_val : 0;
        }
        // 初始化模型
        #initial_module() {
            this.enable_state = GM_Objects.get_value('bayes_enable_state', true);
            if (!this.enable_state) return;
            let bayes_white_len = GM_Objects.get_value('bayes_white_len', 0), bayes_black_len = 0;
            if (bayes_white_len) {
                bayes_black_len = GM_Objects.get_value('bayes_black_len', 0);
                this.#get_word_counter();
            } else {
                bayes_white_len = this.#white_list.length;
                bayes_black_len = this.#black_list.length;
                GM_Objects.set_value('bayes_white_len', bayes_white_len);
                GM_Objects.set_value('bayes_black_len', bayes_black_len);
                this.#bayes_black_counter = this.#word_counter(this.#black_list.map(e => this.#seg_word(e)).flat());
                this.#bayes_white_counter = this.#word_counter(this.#white_list.map(e => this.#seg_word(e)).flat());
                GM_Objects.set_value('bayes_black_counter', this.#bayes_black_counter);
                GM_Objects.set_value('bayes_white_counter', this.#bayes_white_counter);
            }
            this.#bayes_white_len = bayes_white_len;
            this.#bayes_black_len = bayes_black_len;
            this.#bayes_total_len = bayes_white_len + bayes_black_len;
            this.#get_configs();
            this.#update_paramters();
            this.#get_module();
        }
        // 取消模型监听
        #cancel_monitor_module() {
            GM_Objects.removevaluechangeistener(this.#module_monitor_id);
            this.#module_monitor_id = null;
        }
        // 监听判断是否需要重新载入/切换模型/更新参数
        #monitor_paramters_change() {
            this.#module_monitor_id = GM_Objects.addvaluechangeistener('bayes_reload', ((...args) => {
                const funcs = {
                    0: (_id) => null,
                    1: (_id) => this.#initial_module(),
                    5: (_id) => {
                        this.#cancel_monitor_module();
                        this.enable_state = false;
                    },
                    other: (id) => {
                        this.#get_configs();
                        if (id === 2) this.#update_paramters();
                        else if (id === 3) this.#get_module(); // 切换先验概率
                        else if (id === 4) this.#update_paramters(), this.#get_module();
                    }
                }, id = args[2]['mode'], f = funcs[id] || funcs.other;
                f && f(id);
            }).bind(this));
        }
        /**
         * 触发重新加载
         * @param {number} mode
         */
        #trigger_reload(mode) { GM_Objects.set_value('bayes_reload', { 'mode': mode, 'update': Date.now() }); }
        /**
         * 计算概率
         * @param {number} w_pro
         * @param {number} b_pro
         * @param {string} content
         * @returns {number}
         */
        #cal_bayes(w_pro, b_pro, content) {
            if (content.length < this.#content_len_limit) return -1;
            const c = Object.entries(this.#word_counter(this.#seg_word(content)));
            const i = c.length;
            if (i < this.#configs.feature_length_limit) return -1;
            // 预先计算部分数值
            const { w_t, b_t, w_1, b_1 } = this.#pre_cal_data, sweight = this.#configs.single_weight, alpha = this.#configs.alpha, [bp, wp] = c.reduce((acc, cur) => {
                const [word, count] = cur, bc = this.#bayes_black_counter[word], wc = this.#bayes_white_counter[word], sw = word.length === 1 ? sweight : 1;
                acc[0] += (bc ? Math.log(bc + alpha) - b_t : b_1) / sw * count;
                acc[1] += (wc ? Math.log(wc + alpha) - w_t : w_1) / sw * count;
                return acc;
            }, [b_pro, w_pro]), r = (bp - wp) / Math.abs(bp), f = r > (i > 7 ? this.#configs.threshold : 0.21) ? r : 0;
            this.#result_detail = { 'content': content, 'seg_array': c, 'black_pro': bp, 'white_pro': wp, 'ratio': r, 'class': f > 0 ? 'black' : 'white' };
            return f;
        }
        /**
         * 贝叶斯判断
         * @param {string} _content
         * @returns {number}
         */
        bayes(_content) { }
        /**
         * 添加新内容
         * @param {string} content
         * @param {boolean} mode
         */
        add_new_content(content, mode) {
            if (content.length < this.#content_len_limit) {
                Colorful_Console.print('the length of input is less than 7, check your input', 'warning', true);
                return;
            }
            const ws = this.#seg_word(content);
            const [dic, dic_name, len_name, len_data, target] = mode ? [this.#bayes_white_counter, 'bayes_white_counter', 'bayes_white_len', ++this.#bayes_white_len, 'white'] : [this.#bayes_black_counter, 'bayes_black_counter', 'bayes_black_len', ++this.#bayes_black_len, 'black'];
            ws.forEach(e => dic[e] ? ++dic[e] : (dic[e] = 1));
            this.#bayes_total_len += 1;
            GM_Objects.set_value(dic_name, dic);
            GM_Objects.set_value(len_name, len_data);
            // 更新模型参数
            this.#update_paramters();
            // 触发重新加载
            this.#trigger_reload(1);
            Colorful_Console.print(`successfully add content to bayes ${target} list`);
        }
        /**
         * 重置模型
         * @param {number} mode 0, all; 2, configs; 1, words
         * @returns {null}
         */
        reset(mode) {
            if (mode === 0 && !confirm('reset bayes? it will clear current settings and words data to restore default settings, continue?')) return;
            const config_names = ['bayes_black_counter', 'bayes_black_len', 'bayes_white_counter', 'bayes_white_len', 'bayes_configs'], i = config_names.length;
            config_names.slice(...[[0, i], [0, i - 1], [-1, i]][mode]).forEach(e => GM_Objects.set_value(e, null));
            this.#initial_module();
            this.#trigger_reload(1);
            Colorful_Console.print('successfully reset bayes', 'info', true);
        }
        /**
         * 调整模型配置
         * @param {object} configs { threshold: number, alpha: number, name: string }
         */
        adjust_configs(configs) {
            try {
                if (typeof configs === 'object') {
                    let f = [['threshold', 0.029, 0.31, Number, 1], ['single_weight', 0.79, 2.1, Number, 1], ['feature_length_limit', 2, 10, parseInt, 10], ['alpha', 0.009, 1.1, Number, 10]].reduce((b, e) => {
                        const key = e[0], new_val = configs[key];
                        if (new_val) {
                            const i = e.pop(), old_val = this.#configs[key] || 0;
                            e.push(old_val, new_val);
                            const nv = this.#adjust_config_val(...e);
                            if (nv > 0) {
                                this.#configs[key] = nv;
                                return b + i;
                            }
                            return b;
                        }
                        return b;
                    }, 0), name = configs.name;
                    if (name) {
                        name = name.toLowerCase();
                        if (name !== this.#configs.name) {
                            if (['multinomialnb', 'complementnb'].includes(name)) {
                                this.#configs.name = name;
                                f += 3;
                                this.#get_module();
                                Colorful_Console.print(`successfully change bayes model to ${name}`, 'info');
                            } else Colorful_Console.print(`${name} is not a valid bayes model name, please check your input: 'multinomialnb' | 'complementnb'`, 'warning', true);
                        }
                    }
                    // threshold, single_weight这两个参数发生变化, 则只更新configs内容, 不需要更新预计算参数
                    // 模型类型发生变化, 则需要更新预计算参数中的先验参数
                    // alpha发生变化, 则需要更新预计算参数中的所有参数
                    if (f > 0) {
                        GM_Objects.set_value('bayes_configs', this.#configs);
                        f > 9 && this.#update_paramters();
                        f -= 3;
                        this.#trigger_reload(f < 3 ? f < 0 ? 5 : 3 : (f > 9 && f < 13 || f > 19) ? 4 : 2);
                    }
                } else Colorful_Console.print('configs must be an object: e.g, { threshold: 0.1, alpha: 1, name: "multinomialnb" } ', 'warning');
            } catch (error) {
                console.error(error);
            }
        }
        // 展示模型细节
        show_detail() {
            const data = [
                '--------',
                '------------------',
                'details of bayes model:',
                '-----------------------------',
                `name of model: ${this.#configs.name};`,
                `totally blocked times: ${Dynamic_Variants_Manager.accumulative_bayes}`,
                `white list length: ${this.#bayes_white_len};`,
                `black list length: ${this.#bayes_black_len};`,
                `white features length: ${this.#white_words};`,
                `black features length: ${this.#black_words};`,
                `threshold: ${this.#configs.threshold}`,
                `alpha: ${this.#configs.alpha}`,
                `single feature weight: ${this.#configs.single_weight}`,
                `feature length limit: ${this.#configs.feature_length_limit}`,
                '-----------------------------'
            ];
            console.log(data.join('\n'));
        }
        /**
         * 启用/禁用模型
         * @param {boolean} state
         */
        set_enable_state(state) {
            const s = typeof state;
            if (s !== 'boolean' || (s === 'number' && state !== 0 || state !== 1)) {
                Colorful_Console.print('enable state must be a boolean or a number: 0 | 1', 'warning');
                return;
            }
            if (state == this.enable_state) return;
            Colorful_Console.print(`setup bayes to ${state} from ${this.enable_state}; enable will take effect after reload; disable will take effect now.`, 'info');
            if (!state) {
                this.#cancel_monitor_module();
                this.#trigger_reload(5);
            }
            this.enable_state = state;
            GM_Objects.set_value('bayes_enable_state', state);
        }
        get configs() { return this.#configs; }
        get test_result() { return this.#result_detail; }
        constructor() {
            this.#segmenter = new Intl.Segmenter('cn', { granularity: 'word' });
            this.#initial_module();
            this.#monitor_paramters_change();
        }
    }
    // bayes module ------------

    // ------------- 数据结构, 统一使用数组作为数据的载体
    class Dic_Array extends Array {
        #id_name = null;
        #func = null;
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
                const funcs = {
                    mid: (id) => {
                        Dynamic_Variants_Manager.accumulative_func();
                        Colorful_Console.print(`block ${this.#id_name}: ${id}`);
                        return true;
                    },
                    bvid: (_id) => true
                };
                this.#func = funcs[id_name];
            }
        }
        /**
         * 检查是否存在和记录
         * @param {string} id
         * @returns {boolean | object}
         */
        includes_r(id) {
            return id ? super.find(e => {
                if (e[this.#id_name] === id) {
                    const now = Date.now();
                    e.last_active_date = now;
                    e.visited_times += 1;
                    Dynamic_Variants_Manager.rate_up_status_sync(this.#id_name, id, now, e.visited_times);
                    return this.#func(id);
                }
                return false;
            }) : null;
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
         * 更新访问状态, 数据同步过来使用
         * @param {object} info
         */
        update_active_status(info) {
            const id = info.id;
            id && super.some(e => {
                if (e[this.#id_name] === id) {
                    e.last_active_date = info.date;
                    e.visited_times = info.visited_times;
                    return true;
                }
                return false;
            });
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
    function includes_r(mode, id_name = 'bvid') {
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
            return r ? (Colorful_Console.print(r), Dynamic_Variants_Manager.accumulative_func(), true) : false;
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
                '\u65b0\u534e\u7f51',
                '\u4eba\u6c11\u7f51',
                '\u9a6c\u7763\u5de5',
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
                '\u79c1\u804a',
                '\u6cf0\u8150',
                '\u996d\u5236',
                '\u7f51\u6e38',
                '\u5fb7\u4e91\u793e',
                '\u996d\u5708',
                '\u6210\u6bc5',
            ],
            // 隐藏视频
            b: [
                '\u5468\u6df1',
                '\u6597\u7f57',
                'tfboys',
                '\u8d1d\u52d2',
                '\u683c\u683c',
                '\u4e1c\u5bab',
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
                '\u5fe0\u544a',
                '\u6234\u5efa\u4e1a',
                '\u5f20\u4e1c\u5347',
                '\u6731\u671d\u9633',
                '\u91cd\u542f',
                '\u592e\u89c6',
                '\u7f8e\u5986',
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
                '\u9ec4\u6653\u660e'
            ],
            input_handle(content) {
                if (!content) return;
                const r = Statics_Variant_Manager.reserved_words;
                return (typeof content === 'string' ? content.trim().split(' ') : Array.isArray(content) ? content : Colorful_Console.print('the input data must be of array or string type', 'warning'))?.map(e => ('' + e).trim().toLocaleLowerCase()).filter(e => e && e.length > 1 && !r.some(c => e.includes(c)));
            },
            /**
             * 添加拦截关键词
             * @param {Array | string} data
             */
            add(content) {
                const data = this.input_handle(content);
                if (data?.length > 0) {
                    const a = this._get_data();
                    if (a) {
                        const t = [...new Set([...a, ...data])];
                        let i = t.length;
                        if (i !== a.length) {
                            while (i > 1000) t.pop(), --i;
                            this._write_data(t);
                        }
                    } else this._write_data([...new Set(data)]);
                    this.a = [...new Set([...this.a, ...data])];
                    // 重新赋值后, 需要重新添加函数
                    this.a.includes_r = includes_r.call(this.a, false);
                    this._show_info(data, true);
                    return true;
                }
                return false;
            },
            /**
             * 移除拦截关键词
             * @param {Array | string} data
             */
            remove(content) {
                const data = this.input_handle(content);
                if (data?.length > 0) {
                    const arr = this._get_data();
                    this.a = this.a.filter(e => !data.includes(e));
                    this.a.includes_r = includes_r.call(this.a, false);
                    if (arr) {
                        const t = arr.filter(e => !data.includes(e));
                        t.length !== arr.length && this._write_data(t);
                    }
                    this._show_info(data, false);
                    return true;
                }
                return false;
            },
            _show_info(data, mode) { console.log(`${mode ? 'add' : 'remove'} black keys:\n${[...new Set(data)].join('\n')}`); },
            _write_data(data) { GM_Objects.set_value('black_keys', data), GM_Objects.notification('update black keys', 'info'); },
            _get_data() { return GM_Objects.get_value('black_keys'); },
            _main() { this._get_data()?.forEach(e => this.a.push(e)); }
        },
        bayes_module: null,
        // 手动拉黑的up, 重要数据, 结构 [{}], 跨标签通信
        block_ups: null,
        // 缓存数据, 不保存, 结构[]
        cache_block_ups: null,
        // 手动拉黑的视频, 动态, 限制数量, 结构[], 跨标签通信
        block_videos: null,
        // 已经检查过的视频缓存, 结构[]
        has_checked_videos: null,
        // 临时拦截视频, 不保存数据, 结构[]
        cache_block_videos: null,
        // 手动, 视频的评分, 重要数据, 结构[{}], 跨标签通信
        rate_videos: null,
        // 自动, 历史访问视频, 动态, 限制数量[]
        visited_videos: null,
        // 当前页面已播放过列表
        session_visited_videos: null,
        // 自动, 累积拦截次数, 跨标签通信
        accumulative_total: GM_Objects.get_value('accumulative_total', 0),
        // 贝叶斯拦截的次数
        accumulative_bayes: GM_Objects.get_value('accumulative_bayes', 0),
        add_block_data_for_db: (data, type) => {
            const block_data_db = GM_Objects.get_value('block_data_db', []);
            if (Array.isArray(data) || !block_data_db.some(e => e.data === data)) {
                block_data_db.push({ data: data, type: type });
                GM_Objects.set_value('block_data_db', block_data_db);
            }
        },
        // 统计拦截的up的情况
        _block_up_statistics() {
            // 对拦截次数进行排序
            if (this.block_ups.length === 0) return [];
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
            Colorful_Console.print(s);
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
        },
        // 创建贝叶斯辅助函数
        _stop_bayes() { this.bayes_module = { bayes: (_content) => 0 }; },
        _connect_terminal(bayes_enable_stat) {
            [
                [
                    'black_key',
                    {
                        detail: () => {
                            const a = GM_Objects.get_value('black_keys', []);
                            a.length > 0 ? console.table(a) : Colorful_Console.print('no black keys');
                        },
                        add: (content) => this.black_keys.add(content),
                        remove: (content) => this.black_keys.remove(content),
                    },
                    {
                        get: (target, prop) => prop === 'detail' ? target[prop]() : target[prop]
                    }
                ], bayes_enable_stat ? [
                    'bayes',
                    {
                        /**
                         * 调整贝叶斯参数
                         * @param {object} configs {}
                         * @returns {object}
                         */
                        configs: (configs) => this.bayes_module.adjust_configs(configs),
                        enable: (state) => this.bayes_module.set_enable_state(state),
                        /**
                         * 测试文本分类
                         * @param {string} content
                         * @returns {null}
                         */
                        test: (content) => console.log(this.bayes_module.bayes(content) < 0 ? 'the length of content does not meet the requirements' : this.bayes_module.test_result),
                        detail: () => this.bayes_module.show_detail(),
                        /**
                         * 重置贝叶斯
                         * @param {number} mode
                         * @returns {null}
                         */
                        reset: (mode = 0) => this.bayes_module.reset(mode),
                        /**
                         * 添加白名单
                         * @param {string} content
                         * @returns {null}
                         */
                        add_white: (content) => this.bayes_module.add_new_content(content, true),
                        /**
                         * 添加黑名单
                         * @param {string} content
                         * @returns {null}
                         */
                        add_black: (content) => this.bayes_module.add_new_content(content, false),
                        help: () => {
                            const helps = [
                                ['configs', 'bayes.configs; show the configs; bayes.configs = {};, setup configs'],
                                ['reset', 'bayes.reset(0); reset the bayes, default 0, will clear all data; 1 reset configs; 2 clear words data and keep configs.'],
                                ['deatail', 'bayes.detail; show the detail of bayes model.'],
                                ['test', 'test("content"); will return the result of test content.'],
                                ['enable', 'bayes default 1 enable, bayes.enable = 0; disable bayes'],
                                ['add_white', 'bayes.add_white("content"); add the content to white list.'],
                                ['add_black', 'bayes.add_black("content"); add the content to black list.'],
                                ['help', 'show the info of help.']
                            ], i = helps.reduce((acc, e) => {
                                const a = e[0].length;
                                if (a > acc) acc = a;
                                return acc;
                            }, 0) + 2;
                            console.log(helps.map(e => e[0].padEnd(i, ' ') + e[1]).join('\n'));
                        }
                    },
                    {
                        get: (target, prop) => {
                            if (prop === 'detail' || prop === 'help') target[prop]();
                            else if (prop === 'configs') return this.bayes_module.configs;
                            else return target[prop];
                        },
                        set: (target, prop, value) => prop === 'configs' || prop === 'enable' && target[prop](value),
                    }
                ] : null
            ].forEach(e => e && (GM_Objects.window[e[0]] = new Proxy(e[1], e[2])));
            // 用于监听bayes状态的改变, 修改包括脚本发起或者是远端发起的修改
            if (bayes_enable_stat) {
                let tmp_state = bayes_enable_stat;
                Object.defineProperty(this.bayes_module, 'enable_state', {
                    get: () => tmp_state,
                    set: (state) => {
                        tmp_state = state;
                        !state && this._stop_bayes();
                    }
                });
            }
        },
        /**
         * 贝叶斯拦截记录
         * @param {string} title
         * @param {number} b_result
         */
        _bayes_accumulative(title, b_result) {
            this.accumulative_func(), GM_Objects.set_value('accumulative_bayes', ++this.accumulative_bayes);
            Colorful_Console.print(`bayes block(${b_result.toFixed(4)}): ${title}`, 'debug');
        },
        // up, 评分, 状态更新写入, 假如频繁写入, 相对影响性能的, 当数据累积到一定数量才写入, 或者定时写入, 而不是一变化就写入
        // 这部分数据作为粗略统计
        _rate_up_status_write_monitor() {
            let up_times = 0, rate_times = 0, tmp = null;
            const write_data = (mode = false) => {
                const i = mode ? 0 : 4;
                const x = up_times > i ? rate_times > i ? 3 : 1 : rate_times > i ? 2 : 0;
                switch (x) {
                    case 3:
                        GM_Objects.set_value('block_ups', this.block_ups, true);
                        GM_Objects.set_value('rate_videos', this.rate_videos, true);
                        up_times = 0, rate_times = 0;
                        break;
                    case 2:
                        GM_Objects.set_value('rate_videos', this.rate_videos, true);
                        rate_times = 0;
                        break;
                    case 1:
                        GM_Objects.set_value('block_ups', this.block_ups, true);
                        up_times = 0;
                        break;
                    default:
                        break;
                }
            };
            Object.defineProperty(this, '_status_info', {
                set: (val) => {
                    tmp = val;
                    val === 'mid' ? ++up_times : ++rate_times;
                    write_data();
                },
                get: () => tmp
            });
            // 每6秒检查数据的状态, 假如数据变化则写入
            setInterval(() => write_data(true), 6666);
        },
        up_video_data_sync_info: null,
        // 数据同步监听
        _data_sync_monitor(site_id) {
            const configs = {
                accumulative_total: {
                    run_in: Array.from({ length: 5 }, (_val, index) => index),
                    f: (...args) => (this.accumulative_total = args[2])
                },
                accumulative_bayes: {
                    run_in: Array.from({ length: 3 }, (_val, index) => index),
                    f: (...args) => (this.accumulative_bayes = args[2])
                },
                visited_video_sync: {
                    run_in: [0, 2],
                    f: (...args) => {
                        const id = args[2];
                        this.visited_videos.push(id);
                        this.session_visited_videos.push_and_settab(id);
                    }
                },
                rate_video_sync: {
                    run_in: [2],
                    f: (...args) => {
                        const data = args[2];
                        this.rate_videos[data.type](data.value);
                    }
                },
                up_video_sync: {
                    run_in: Array.from({ length: 3 }, (_val, index) => index),
                    f: (...args) => {
                        // {type: "block", value: {mid: 123}}
                        const data = args[2];
                        if (data.type === 'block') {
                            if (data.name === 'video') {
                                const bvid = data.value.bvid;
                                this.block_videos.push(bvid);
                                this.has_checked_videos.remove(bvid);
                            } else this.block_ups.push(data.value);
                            // 将数据同步到优化器模块, 执行遍历操作
                            this.up_video_data_sync_info = data;
                        } else data.name === 'video' ? this.block_videos.remove(data.value.bvid) : this.block_ups.remove(data.value.mid);
                    }
                },
                up_rate_status_sync: {
                    run_in: Array.from({ length: 3 }, (_val, index) => index),
                    f: (...args) => {
                        const data = args[2];
                        (data.type === 'up' ? this.block_ups : this.rate_videos).update_active_status(data.value);
                    }
                },

            };
            for (const k in configs) {
                const item = configs[k];
                item.run_in.includes(site_id) && GM_Objects.addvaluechangeistener(k, item.f.bind(this));
            }
        },
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
            const { title, mid, bvid, up_name } = info;
            if (this.has_checked_videos.includes(bvid)) return false;
            else if (this.block_ups.includes_r(mid) || this.cache_block_ups.includes_r(mid) || this.block_videos.includes_r(bvid) || this.cache_block_videos.includes_r(bvid)) return true;
            const r = this.key_check(title + "_" + up_name);
            if (r > 0) {
                r == 2 && this.cache_block_ups.push(mid);
                return true;
            }
            const b = this.bayes_module.bayes(title);
            return b > 0 ? (this._bayes_accumulative(title, b), true) : (this.has_checked_videos.push(bvid), false);
        },
        /**
         * 取消拦截视频
         * @param {string} bvid
         */
        unblock_video(bvid) { this.block_videos.remove(bvid) && (GM_Objects.set_value('block_videos', this.block_videos), this.up_video_sync('unblock', 'video', bvid)); },
        /**
         * 拦截视频
         * @param {string} bvid
         */
        block_video(bvid) {
            this.block_videos.push(bvid), GM_Objects.set_value('block_videos', this.block_videos);
            this.up_video_sync('block', 'video', bvid);
            if (this.rate_videos?.remove(bvid)) {
                GM_Objects.set_value('rate_videos', this.rate_videos);
                this.rate_visited_data_sync({ type: 'remove', value: bvid });
            }
            this.has_checked_videos.remove(bvid);
            this.add_block_data_for_db(bvid, 'bvid');
            Colorful_Console.print(`add video to block_video list: ${bvid}`);
        },
        // 累积拦截计数记录
        accumulative_func() { GM_Objects.set_value('accumulative_total', ++this.accumulative_total); },
        // 视频和up, 拦截或者取消时, 数据同步
        up_video_sync(s_type, s_name, s_value) { GM_Objects.set_value('up_video_sync', { type: s_type, name: s_name, value: s_value }); },
        // 评分, 拦截up的数据部分更新同步
        _status_info: null,
        rate_up_status_sync(s_type, id, date, times) { GM_Objects.set_value('up_rate_status_sync', { type: s_type, value: { id: id, date: date, times: times } }), this._status_info = s_type; },
        // 评分和访问数据同步
        // 初始化视频评分数据
        rate_visited_data_sync(data) { GM_Objects.set_value(typeof data === 'string' ? 'visited_video_sync' : 'rate_video_sync', data); },
        // 初始化视频评分数据
        initial_rate_videos() {
            const o = new Dic_Array(GM_Objects.get_value('rate_videos', []), 'bvid');
            // 检查评分函数
            o.check_rate = function (id) { return this.includes_r(id)?.rate || 0; };
            // 添加函数
            o.add = function (info, is_force) {
                const bvid = info.bvid, data = this.find(e => e.bvid === bvid);
                if (data && data.rate !== info.rate) {
                    if (is_force) {
                        data.rate = info.rate;
                        data.last_active_date = info.last_active_date;
                    } else return false;
                } else if (!data) this.push(info);
                else return false;
                return true;
            };
            return o;
        },
        // 初始化拦截up数据
        initial_block_ups: () => new Dic_Array(GM_Objects.get_value('block_ups', []), 'mid'),
        // 初始化历史访问数据
        initial_visited_videos: () => new Visited_Array(GM_Objects.get_value('visited_videos', []), 2000),
        // 当前浏览器会话播放的历史视频
        initial_session_visited_videos() { return new Promise((resolve, _reject) => GM_Objects.get_tabs((tabs) => resolve(Object.values(tabs).find(tab => tab.session_visited_videos)))); },
        check_visited_video(bvid) { return this.session_visited_videos?.includes(bvid) ? 1 : this.visited_videos.includes(bvid) ? 2 : 0; },
        // 展示数据状态
        show_status: () => null,
        /**
        * 数据初始化
        * @param {number} site_id
        */
        init(site_id) {
            // 全局启用, 关键词过滤
            this.black_keys._main();
            this.black_keys.a.includes_r = includes_r.call(this.black_keys.a, false), this.black_keys.b.includes_r = includes_r.call(this.black_keys.b, false);
            if (site_id > 2) {
                if (site_id !== 3) this.add_block_data_for_db = (..._args) => null;
                return;
            }
            this.cache_block_ups = [], this.cache_block_ups.includes_r = includes_r.call(this.cache_block_ups, true, 'mid');
            this.cache_block_videos = [], this.cache_block_videos.includes_r = includes_r.call(this.cache_block_videos, true);
            this.block_ups = this.initial_block_ups();
            this.block_videos = new Block_Video_Array(GM_Objects.get_value('block_videos', []), 0);
            this.has_checked_videos = [];
            this.has_checked_videos.remove = function (bvid) {
                const index = this.indexOf(bvid);
                index > -1 && this.splice(index, 1);
            };
            // 评分信息仅在搜索的页面启用, 播放页不需要, 播放页只需要执行一次, 放置于静态数据管理模块
            if (site_id === 2) this.rate_videos = this.initial_rate_videos();
            else this.add_block_data_for_db = (..._args) => null;
            if (site_id !== 1) this.visited_videos = this.initial_visited_videos();
            this.initial_session_visited_videos().then((tab) => {
                this.session_visited_videos = tab?.session_visited_videos || [];
                this.session_visited_videos.push_and_settab = function (bvid) {
                    if (this.includes(bvid)) return false;
                    this.push(bvid);
                    GM_Objects.set_tab('session_visited_videos', this);
                    return true;
                };
            });
            this._data_sync_monitor(site_id);
            this._rate_up_status_write_monitor();
            this.show_status = this._show_data_status;
            this.bayes_module = new Bayes_Module();
            this._connect_terminal(this.bayes_module.enable_state);
        },
    };

    // 动态数据管理 ---------

    // --------- 静态数据管理
    const Statics_Variant_Manager = {
        reserved_words: ['_'],
        // 管理up
        up_part: {
            _id_name: 'block_ups',
            /**
             * @returns {Array}
             */
            get _data() { return Dynamic_Variants_Manager.initial_block_ups(); },
            /**
             * 检查up是否被拦截
             * @param {string} mid
             * @returns {boolean}
             */
            check(mid) { return this._data.some(e => e.mid === mid); },
            _info_write(data, mid, mode = false) { GM_Objects.set_value(this._id_name, data), Colorful_Console.print(`${mode ? 'add up to ' : 'remove up from'} block_ups list: ${mid}`, 'info', mode); },
            /**
             * 取消up拦截
             * @param {string} mid
             * @returns {void}
             */
            unblock(mid) {
                const data = this._data;
                data.remove(mid) && (this._info_write(data, mid), Dynamic_Variants_Manager.up_video_sync('unblock', 'up', mid));
            },
            /**
             * 拦截up
             * @param {object} info
             * @returns {null}
             */
            block(info) {
                const data = this._data, mid = info.mid;
                if (data.some(e => e.mid === mid)) return;
                Dynamic_Variants_Manager.add_block_data_for_db(mid, 'mid');
                data.push(info), this._info_write(data, mid, true), Dynamic_Variants_Manager.up_video_sync('block', 'up', info);
            },
        },
        // 管理评分
        rate_video_part: {
            /**
             * @returns {Array}
             */
            get _data() { return Dynamic_Variants_Manager.initial_rate_videos(); },
            /**
             * 检查视频的评分
             * @param {string} bvid
             * @returns {number}
             */
            check_video_rate(bvid) {
                const arr = this._data, r = arr?.check_rate(bvid);
                r > 0 && this._info_write(arr, bvid, '', true);
                return r;
            },
            /**
             * 更新, 全新添加
             * @param {object} info
             */
            add(info, is_force = true) { this._handle(info, true, info.bvid, is_force); },
            remove(bvid) { this._handle(bvid, false, bvid); },
            _handle(data, mode, bvid, is_force) {
                const arr = this._data, s_type = mode ? 'add' : 'remove';
                (mode ? arr.add(data, is_force) : arr.remove(data)) && (this._info_write(arr, bvid, s_type), Dynamic_Variants_Manager.rate_visited_data_sync({ type: s_type, value: data }));
            },
            _info_write(data, bvid, s_type, no_write = false) { GM_Objects.set_value('rate_videos', data, true), !no_write && Colorful_Console.print(`${bvid}, successfully ${s_type} bvid to rate_videos`); }
        },
        // 管理标记的下载视频记录
        mark_download_video: {
            _id_name: 'mark_download_videos',
            get _data() { return GM_Objects.get_value(this._id_name, []); },
            _info_write(data, bvid) { GM_Objects.set_value(this._id_name, data), Colorful_Console.print(`${bvid}, successfully marked video as downloaded`); },
            add(info) {
                const data = this._data, bvid = info.bvid;
                if (this.check(bvid, data)) return;
                data.push(info), this._info_write(data, bvid);
            },
            check(bvid, data = null) { return (data || this._data).some(e => e.bvid === bvid); }
        },
        /**
         * 历史访问记录, 只有添加, 没有删除
         * @param {string} bvid
         */
        add_visited_video(bvid) {
            const arr = Dynamic_Variants_Manager.initial_visited_videos();
            arr.push(bvid);
            Dynamic_Variants_Manager.session_visited_videos.push_and_settab(bvid);
            GM_Objects.set_value('visited_videos', arr);
            Dynamic_Variants_Manager.rate_visited_data_sync(bvid);
            Colorful_Console.print(`${bvid}, play record has been writed`);
        },
        /**
         * 异常日志记录
         * @param {string} content
         */
        add_crash_log(content) {
            let data = GM_Objects.get_value('crash_log', []), i = data.unshift({ 'reason': content, 'time': new Date().toLocaleString() });
            while (i > 50) --i, data.pop();
            GM_Objects.set_value('crash_log', data);
        },
        watch_later: {
            _id_name: 'pocket',
            get data() { return GM_Objects.get_value(this._id_name, []); },
            set data(data) { GM_Objects.set_value(this._id_name, data); },
            add(video_info) {
                const data = this.data, bvid = video_info.bvid;
                if (!data.some(e => e.bvid === bvid)) {
                    data.push(video_info);
                    this.data = data;
                }
            },
            remove(id, id_name = 'bvid') {
                let data = this.data, w = false, i = data.length;
                if (id_name === 'bvid') {
                    const i = data.findIndex(e => e[id_name] === id);
                    if (i > -1) {
                        data.splice(i, 1);
                        w = true;
                    }
                } else if (id_name === 'mid') {
                    data = data.filter(e => e[id_name] !== id);
                    w = data.length !== i;
                } else {
                    data = data.filter(e => {
                        const title = e.title, name = e.author;
                        return id.some(k => title.includes(k) || name.includes(k));
                    });
                    w = data.length !== i;
                }
                if (w) this.data = data;
            }
        }
    };
    // 静态数据管理 ---------

    // 帮助/展示内部数据/设置参数 -------
    const Terminal_Module = {
        download_audio_path: null,
        download_video_path: null,
        video_duration_limit: 0,
        bayes_instance: null,
        _black_key: null,
        _get_key_func(id) {
            return id > 2 ? {} : {
                ...(id === 1 ? {
                    download_video_path: {
                        get: () => {
                            const p = this.download_video_path;
                            Colorful_Console.print(`download_video_path: '${p}'`);
                            return p;
                        },
                        set: (path) => {
                            Colorful_Console.print(`change download_video_path from '${this.download_video_path}' to '${path}'`);
                            this.download_video_path = path;
                        }
                    },
                    download_audio_path: {
                        get: () => {
                            const p = this.download_audio_path;
                            Colorful_Console.print(`download_audio_path: '${p}'`);
                            return p;
                        },
                        set: (path) => {
                            Colorful_Console.print(`change download_audio_path from '${this.download_audio_path}' to '${path}'`);
                            this.download_audio_path = path;
                        }
                    },
                } : {}),
                bayes: {
                    get: () => { return this.bayes_instance ? this.bayes_instance : Colorful_Console.print('bayes model is not running on current page'); },
                    set: (val) => { this.bayes_instance = val; }
                },
                video_duration_limit: {
                    get: () => {
                        const i = this.video_duration_limit;
                        Colorful_Console.print(`video_duration_limit: ${i}`);
                        return i;
                    },
                    set: (val) => {
                        try {
                            val = parseInt(val);
                            if (val > 0 && val < 300) {
                                Colorful_Console.print(`change video duration limit from ${this.video_duration_limit} to ${val}`);
                                this.video_duration_limit = val;
                                GM_Objects.set_value('video_duration_limit', val);
                            }
                            else Colorful_Console.print('video_duration_limit must be a number between 0 and 300');
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            };
        },
        init(id) {
            Object.defineProperties(GM_Objects.window, {
                ...this._get_key_func(id),
                show_shortcuts: {
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
                            ['f', 'refresh', '刷新页面', '主页'],
                            ['0-9', '', '打开顶端页面视频', '主页'],
                            ['h', 'history', '打开历史记录', '主页'],
                            ['1-3', 'rate', '快捷评分', '视频'],
                            ['o', '', '添加视频到稍后再看列表', '视频'],
                            ['ctrl', '鼠标右键(鼠标放置在需要操作元素上)', '临时隐藏视频(仅在执行页面生效, 关闭后该数据将不被保存), 同时添加视频的标题到贝叶斯分类器的黑名单中.', '视频, 主页, 搜索'],
                            ['shift', '鼠标右键(鼠标放置在需要操作元素上)', '拦截视频', '视频, 主页, 搜索'],
                            ['ctrl', '鼠标正常点击', '自动控制视频加速', '主页, 搜索']
                        ];
                        console.table(shortcuts);
                    }
                },
                show_rate: {
                    get() {
                        const data = GM_Objects.get_value('rate_videos', []);
                        data.sort((a, b) => a.add_date - b.add_date);
                        data.forEach(e => {
                            e.last_active_date = new Date(e.last_active_date).toDateString();
                            e.add_date = new Date(e.add_date).toDateString();
                        });
                        console.table(data);
                    }
                },
                black_key: {
                    get: () => this._black_key,
                    set: (val) => (this._black_key = val)
                },
                show_crash_log: {
                    get() {
                        const data = GM_Objects.get_value('crash_log', []);
                        data.length > 0 ? console.table(data) : Colorful_Console.print('no crash log');
                    }
                },
                feedback: { get() { GM_Objects.openintab(Constants_URLs.feedback, { insert: 1, active: true }); } },
                support: { get() { Support_Me.main(); } },
                manual: { get() { GM_Objects.openintab(Constants_URLs.manual, { insert: 1, active: true }); } },
                help: {
                    get() {
                        const cmds = [
                            ['show_shortcuts', 'show the shortcuts'],
                            ['show_rate', 'show all rated videos'],
                            ['black_key', 'setup custom black keys'],
                            ['bayes', 'setup and show the bayes model'],
                            ['support', 'show the popup of support me'],
                            ['feedback', 'open the webpage of issues'],
                            ['manual', 'open the webpage of manual'],
                            ['show_crash_log', 'show the log of crash'],
                            ['download_audio_path', 'show/set the path of download audio'],
                            ['download_video_path', 'show/set the path of download video'],
                            ['video_duration_limit', 'setup the duration to filter video'],
                            ['help', 'show the info of help']
                        ], i = cmds.reduce((acc, e) => {
                            const a = e[0].length;
                            if (a > acc) acc = a;
                            return acc;
                        }, 0) + 2;
                        // 找出最长的字符串, 其他的填充空格
                        console.log(cmds.map(e => e[0].padEnd(i, ' ') + e[1]).join('\n'));
                    }
                }
            });
        }
    };
    // -------- 帮助/展示内部数据/设置参数

    // 视频控制模块 ---------
    class Video_Module {
        // 初始化成功与否的标记
        #initial_flag = false;
        #user_is_login = false;
        // 贝叶斯添加标记
        #added_bayes_list = [];
        // 下载音频的路径
        #download_audio_path = GM_Objects.get_value('download_audio_path', 'E:\\Audio\\voice book');
        // 下载视频的路径
        #download_video_path = GM_Objects.get_value('download_video_path', 'E:\\videos');
        // 菜单控制速度, 是否点击
        #is_first = true;
        // 控制的初始速度
        #video_speed = 2;
        // 视频控制组件
        #video_player = null;
        // 历史访问settimeout id
        #record_id = null;
        // 自动速度控制标记
        #auto_speed_mode = false;
        // 视频基本信息
        #video_info = {};
        #home_video_info = null;
        #db_instance = null;
        // url切换
        url_has_changed = false;
        // 视频信息更新完成
        video_info_update_flag = false;
        // 添加侧边栏视频到数据库
        add_related_video_flag = 0;
        // 是否结束并添加侧边栏的视频到数据库, 第一次播放允许添加, 以及手动点击的播放
        end_and_add_flag = true;
        // 播放进度记录, 播放完成一半则将视频视作已经观看, 当完成80%则将视频视作已经完整观看
        #record_limits = [15, 32];
        // 播放是否需要停止, 用于非登陆环境, 等待视频清晰度切换完成
        #is_need_stop = false;
        /**
         * 视频基础信息
         * @returns {object}
         */
        get video_base_info() { return this.#video_info; }
        // 更新视频基础信息
        update_essential_info(user_data, video_data) {
            this.#home_video_info = Data_Switch.video_to_home([user_data, video_data]);
            return this.video_info_update_flag = Object.entries({
                bvid: ((arg) => (arg === undefined ? undefined : arg + '')).bind(null, video_data.bvid),
                title: ((arg) => (arg === undefined ? undefined : arg + '')).bind(null, video_data.title),
                mid: ((arg) => (arg === undefined ? undefined : arg + '')).bind(null, parseInt(user_data.mid)),
                duration: (_arg) => video_data.duration,
                videos: (_arg) => video_data.videos,
                is_collection: ((arg) => (arg === undefined ? undefined : arg > 1 ? true : false)).bind(null, video_data.videos)
            }).every(([k, v]) => (this.#video_info[k] = v()) === undefined ? (Colorful_Console.print(`failed to obtain basic video information: ${k}`, 'crash', true), false) : true);
        }
        // 初始化成功标记
        get initial_flag() { return this.#initial_flag; }
        /**
         * 设置下载音频路径
         * @param {string} path
         */
        set download_audio_path(path) { this.#download_audio_path = path, GM_Objects.set_value('download_audio_path', path); }
        get download_audio_path() { return this.#download_audio_path; }
        /**
         * 设置下载视频路径
         * @param {string} path
         */
        set download_video_path(path) { this.#download_video_path = path, GM_Objects.set_value('download_video_path', path); }
        get download_video_path() { return this.#download_video_path; }
        #create_video_event() {
            this.#video_player.mediaElement().oncanplay = (e) => {
                // 只有当手动更改之后, 才会自动变速
                if (this.#is_need_stop) {
                    this.#is_need_stop = false;
                    // 由于视频的canplay事件无法准时捕捉到,, 以及urlchang事件触发顺序的不确定, 可能已经成功切换到1080p, 这里就不需要暂停
                    if (this.#video_player.getQuality()?.newQ === 16) {
                        e.target.pause();
                        return;
                    }
                }
                if (this.#is_first) return;
                const target = e.target;
                this.#auto_speed_mode = false;
                target.playbackRate !== this.#video_speed && setTimeout(() => { target.playbackRate = this.#video_speed; }, 3000);
            };
            // 当观看完整, 删除收藏;
            this.#video_player.mediaElement().onended = () => this.#end_action();
            // 和速度同步变化监听
            const record_limits = [15, 32];
            this.#video_player.mediaElement().onratechange = (e) => {
                const pr = e.target.playbackRate;
                this.#record_limits = record_limits.map(e => parseInt(e / pr));
            };
        }
        #end_action() {
            const i = this.#video_info.videos, id = this.#video_info.bvid;
            if (this.end_and_add_flag && !this.#menus_funcs.rec_list.includes(id) && GM_Objects.window.__INITIAL_STATE__.p === i) {
                this.#db_instance.delete(Indexed_DB.tb_name_dic.pocket, id);
                this.#menus_funcs.rec_list.push(id);
                this.add_related_video_flag = 2;
                this.end_and_add_flag = false;
            }
        }
        // 在不登陆的状态下, 切换不同的视频导致原来的video标签失效
        #video_element_change_monitor() {
            const node = document.getElementsByClassName("bpx-player-video-wrap");
            node.length ? new MutationObserver((records) => {
                for (const r of records) {
                    if (r.removedNodes.length) {
                        this.#create_video_event();
                        break;
                    }
                }
            }).observe(node[0], { childList: true, subtree: true }) : Colorful_Console.print('failed to find video parent element', 'crash', true);
        }
        /**
         * 播放速度控制
         * @param {boolean} mode
         */
        #speed_control(mode) {
            this.#is_first = false;
            // 假如手动设置速度, 则取消自动变速
            this.#auto_speed_mode = false;
            this.#video_speed += (mode ? 0.5 : -0.5);
            0 < this.#video_speed && this.#video_speed < 5 && this.#video_player.setPlaybackRate(this.#video_speed);
            // 当速度调节小于2时, 重新恢复第一次的标记
            this.#is_first = this.#video_speed < 2;
        }
        // 自动速度控制, 用于快速观看视频
        #auto_speed_up() {
            this.#auto_speed_mode = true;
            const ids = [[15000, 1.25], [75000, 1.5], [125000, 2], [155000, 2.5], [185000, 3]].map((e, i) => setTimeout(() => {
                // 当自动调速停止, 则清除所有settimeout
                if (!this.#auto_speed_mode) {
                    ids.forEach(id => id && clearTimeout(id));
                    return;
                }
                this.#video_player.setPlaybackRate(e[1]);
                ids[i] = null;
            }, e[0]));
            GM_Objects.set_value('speed_up_video', false);
        }
        // 速度控制, 菜单函数
        #regist_menus_command() { [['speed +', true], ['speed -', false]].forEach(e => GM_Objects.registermenucommand(e[0], this.#speed_control.bind(this, e[1]))); }
        // 历史访问记录
        #visited_record() {
            if (this.#record_id) {
                clearInterval(this.#record_id);
                this.#record_id = null;
            }
            const lm = 60 * 60 * 1000,
                vs = this.#video_info.videos,
                duration = this.#video_info.duration * (vs > 1 ? (1000 / vs) : 1000);
            let ic = 0, f = true;
            this.#record_id = setInterval(() => {
                if (this.#video_player.isPaused()) return;
                if (f && ic > this.#record_limits[0]) {
                    const id = this.#video_info.bvid;
                    Statics_Variant_Manager.add_visited_video(id);
                    this.#db_instance.delete(Indexed_DB.tb_name_dic.recommend, id);
                    f = false;
                } else if (ic > this.#record_limits[1]) {
                    clearInterval(this.#record_id);
                    this.#record_id = null;
                    this.#end_action();
                }
                ic++;
            }, parseInt((duration > lm ? lm : duration) / 40));
        }
        // 侧边状态栏html
        #get_sider_status_html(status_dic) {
            // 下载, 评分, 贝叶斯, 拦截
            return `<div id="status_sider_bar" style="z-index: 999;margin-left: -90px;position: absolute;">
                    <div class="s_list" style="display: grid;">
                    ${Object.entries(status_dic).map(([k, v]) => `<span><label>${k}: ${v}</label><hr></span>`).join('')}
                    </div>
                </div>`;
        }
        // 添加侧边状态栏
        async #add_status_siderbar(mode = false) {
            // 检查视频是否下载, 是否拦截, 评分
            // 假如拦截, 就不需要检查评分, 下载还是需要检查
            mode && (this.#select_element.value = '0');
            const target = document.getElementById('viewbox_report');
            if (!target) {
                Colorful_Console.print('fail to insert element of status', 'crash', true);
                return;
            } else if (target.nextElementSibling.id === 'status_sider_bar') target.nextElementSibling.remove();
            const vid = this.#video_info.bvid,
                status_dic = {
                    Rate: Statics_Variant_Manager.rate_video_part.check_video_rate(vid),
                    Blocked: 0,
                    Bayesed: this.#added_bayes_list.includes(vid) ? 1 : 0,
                    Pocketed: await this.#db_instance.check(Indexed_DB.tb_name_dic.pocket, vid) ? 1 : 0,
                    Downloaded: Statics_Variant_Manager.mark_download_video.check(vid) ? 1 : 0
                };
            status_dic.Blocked = status_dic.Rate === 0 ? Dynamic_Variants_Manager.block_videos.includes_r(vid) ? 1 : 0 : 0;
            setTimeout(() => target.insertAdjacentHTML('afterend', this.#get_sider_status_html(status_dic)), 1500);
        }
        // 菜单执行函数
        #menus_funcs = {
            // 菜单
            _watch_list: [],
            rec_list: [],
            _control_db: (mode) => {
                const id = this.#video_info.bvid;
                if (mode === 0) this.#home_video_info && this.#db_instance.add(Indexed_DB.tb_name_dic.pocket, this.#home_video_info).then(() => Colorful_Console.print(`add pocket success: ${id}`));
                else {
                    this.#db_instance.delete(Indexed_DB.tb_name_dic.pocket, id);
                    this.#db_instance.delete(Indexed_DB.tb_name_dic.recommend, id);
                }
            },
            _change_lable: (change_dic) => {
                const lables = document.getElementById('status_sider_bar').getElementsByTagName('label');
                for (const label of lables) {
                    const text = label.innerText.split(':')[0];
                    if (text in change_dic) label.innerText = `${text}: ${change_dic[text]}`;
                }
            },
            0(_) { },
            // remove, 从评分中将数据移除掉
            4(video_info) {
                Statics_Variant_Manager.rate_video_part.remove(video_info.bvid);
                this._change_lable({ Rate: 0 });
                this._control_db(1);
            },
            // block, 拦截视频
            5(video_info) {
                // 拦截
                Dynamic_Variants_Manager.block_video(video_info.bvid);
                // 移除评分
                Statics_Variant_Manager.rate_video_part.remove(video_info.bvid);
                this._control_db(1);
                this._change_lable({ Blocked: 1, Rate: 0, Pocketed: 0 });
            },
            // unblock, 不拦截视频
            6(video_info) {
                Dynamic_Variants_Manager.unblock_video(video_info.bvid);
                this._change_lable({ Blocked: 0 });
            },
            // 标记已经下载
            8(video_info) {
                Statics_Variant_Manager.mark_download_video.add({ bvid: video_info.bvid, title: video_info.title });
                this._change_lable({ Downloaded: 1 });
            },
            // 稍后观看
            9(video_info) {
                const bvid = video_info.bvid;
                if (Dynamic_Variants_Manager.block_videos.includes(bvid)) {
                    if (confirm('current video has been blocked, unblock？')) this[6](video_info);
                    else return;
                }
                if (!this._watch_list.includes(bvid)) {
                    this._watch_list.push(bvid);
                    this._change_lable({ Pocketed: 1, Blocked: 0 });
                    this._control_db(0);
                }
            },
            // 生成bbdown下载命令
            _bbdown: (id, params, audio_mode, val) => {
                const cm = `BBDown -mt --work-dir "${audio_mode ? this.#download_audio_path : this.#download_video_path}" "${id}"${params.length > 0 ? ' ' + params.join(' ') : ''}`;
                GM_Objects.copy_to_clipboard(cm, "text", () => Colorful_Console.print("bbdown commandline: " + cm));
                this.add_related_video_flag = val;
            },
            // 添加评分
            _add_rate: (val, video_info, is_key_send, is_force) => {
                const id = video_info.bvid;
                if (!id) {
                    Colorful_Console.print('fail to get bvid', 'warning', true);
                    return 0;
                }
                const now = Date.now();
                // 这里存在问题, 访问次数和活跃时间
                const info = {
                    bvid: id,
                    title: video_info.title,
                    mid: video_info.mid,
                    last_active_date: now,
                    visited_times: 1,
                    add_date: now,
                    rate: val
                };
                Statics_Variant_Manager.rate_video_part.add(info, is_force);
                // 假如评分的视频是拦截的视频, 则取消拦截
                Dynamic_Variants_Manager.unblock_video(id);
                if (!is_key_send && !this.#added_bayes_list.includes(id) && (val === 5 || confirm("add to whitelist of bayes model?"))) {
                    Dynamic_Variants_Manager.bayes_module.add_new_content(video_info.title, true);
                    this.#added_bayes_list.push(id);
                    return 2;
                }
                return 1;
            },
            // 1 3分
            // 2 4分
            // 3 5分
            // 7 bbdown, 下载视频
            _other(val, video_info, is_key_send, is_force) {
                const dic = {};
                if (val === 7) {
                    if (confirm('mark video as downloaded?')) {
                        this[8](video_info);
                        dic.Downloaded = 1;
                    }
                    val = 3;
                } else {
                    val += 2;
                    const i = this._add_rate(val, video_info, is_key_send, is_force);
                    if (i > 0) {
                        dic.Rate = val;
                        dic.Blocked = 0;
                        i === 2 && (dic.Bayesed = 1);
                    }
                }
                const params = [];
                // 只有当页面的视频为合集的状态才会生成相应的参数
                video_info.is_collection && params.push('-p ALL');
                const is_audio = this._check_is_audio();
                is_audio && params.push('--audio-only');
                const id = video_info.bvid;
                let v = 0;
                if (!this.rec_list.includes(id)) {
                    this.rec_list.push(id);
                    v = val;
                }
                this._change_lable(dic);
                this._bbdown(id, params, is_audio, v);
            },
            // 判断是否是音频类视频
            _voice_keys: ['有声', '小说剧', '广播剧', '播讲', '听书'],
            _check_is_audio() {
                const nodes = document.getElementsByClassName('title');
                let ic = 0;
                for (const title of nodes) {
                    const t = title.innerHTML.replaceAll(' ', '');
                    if ((ic += (this._voice_keys.some(e => t.includes(e)) ? 1 : 0)) > 4) return true;
                }
                return false;
            },
            main(val, video_info, is_key_send = false, is_force = true) {
                const f = this[val];
                // 注意this的丢失, 函数在赋值之后
                return f ? f.call(this, video_info) : this._other(val, video_info, is_key_send, is_force);
            }
        };
        // 键盘控制评分
        key_rate_video(val, is_force = true) { this.#menus_funcs.main(val, this.#video_info, true, is_force); }
        // 添加评分菜单
        get #select_element() { return document.getElementById('selectWrap').getElementsByTagName('select')[0]; }
        #add_menus_element() {
            const html = `
                <div class="select_wrap" id="selectWrap">
                    <style>
                        div#selectWrap {
                            width: 82px;
                            margin-left: -18px;
                            border: 1px solid #00b5e5;
                            border-radius: 6px;
                        }
                        .select_wrap dd {
                            margin-left: 5px;
                            line-height: 30px;
                        }
                        select#selectElem {
                            font-size: 14px;
                            width: 72px;
                            text-align: center;
                        }
                    </style>
                    <dd>
                        <select id="selectElem">
                            <option value="0">Menus</option>
                            <option value="1">Rate: 3</option>
                            <option value="2">Rate: 4</option>
                            <option value="3" style="color: blue;">Rate: 5</option>
                            <option value="4" title="remove video rate">Remove</option>
                            <option value="5" title="block video" style="color:red;">Block</option>
                            <option value="6" title="unblock video">unBlock</option>
                            <option value="7" title="generate download video command of bbdown">BBdown</option>
                            <option value="8" title="mark video as downloaded" style="color: #FFA500;">Marked</option>
                            <option value="9" title="watch video later">Pocket</option>
                        </select>
                    </dd>
                </div>`,
                toolbar = document.getElementsByClassName('video-toolbar-left');
            if (toolbar.length > 0) {
                this.#add_status_siderbar();
                // insertAdjacentHTML, 这个函数不会返回插入生成的节点, 返回空值
                toolbar[0].insertAdjacentHTML('beforeend', html);
                setTimeout(() => this.#select_element.onchange = (e) => this.#menus_funcs.main(parseInt(e.target.value), this.#video_info), 300);
            } else Colorful_Console.print('fail to insert rate element', 'crash', true);
        }
        // 点击执行
        #click_target(classname) { document.getElementsByClassName(classname)[0]?.click(); }
        // 全屏
        wide_screen() { this.#click_target('bpx-player-ctrl-btn bpx-player-ctrl-web'); }
        // 影院宽屏模式
        theatre_mode() { this.#click_target('bpx-player-ctrl-btn bpx-player-ctrl-wide'); }
        /**
         * 声音控制
         * @param {boolean} mode
         */
        voice_control(mode) {
            const vx = this.#video_player.getVolume() + (mode ? 0.1 : -0.1);
            this.#video_player.setVolume(vx > 1 ? 1 : vx < 0 ? 0 : vx);
        }
        // 播放控制
        play_control() { this.#video_player.isPaused() ? this.#video_player.play() : this.#video_player.pause(); }
        /**
         * 自动关灯控制控制
         * @param {*} mode 0, 默认状态; 1, 根据时间自动调节 2. 取消自动关灯灯光
         */
        light_control(mode = 0) {
            const is_lightoff = this.#video_player.getLightOff();
            !((mode === 1 && is_lightoff) || (mode === 2 && !is_lightoff)) && this.#video_player.setLightOff(!is_lightoff);
        }
        //自动关灯
        #auto_light = {
            _light_off: false,
            _mode: GM_Objects.get_value('auto_light', 0),
            _names: ['auto', 'always', 'disable'],
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
                    const date = new Date(), m = date.getMonth() + 1, h = date.getHours();
                    flag = h > (m > 8 || m < 4 ? 16 : 17) || h < 7;
                } else if (this._mode === 1) flag = true;
                this._monitor();
                this._create_menus();
                return flag;
            }
        };
        // 判断浏览器是否支持urlchange事件
        get #is_support_urlchange() { return GM_Objects.supportonurlchange === null || (Colorful_Console.print('browser does not support url_change event, please update browser', 'warning', true), false); }
        // 监听页面播放发生变化
        #url_change_monitor() {
            window.addEventListener('urlchange', (info) => {
                const bvid = Base_Info_Match.get_bvid(info.url);
                if (bvid) {
                    this.#is_need_stop = !this.#user_is_login;
                    if (bvid === this.#video_info.bvid) return;
                    this.url_has_changed = true;
                } else Colorful_Console.print('url_change event error', 'crash', true);
            });
        }
        main(db_instance) {
            this.#db_instance = db_instance;
            // urlchange监听
            this.#url_change_monitor();
            // 创建下拉菜单
            this.#add_menus_element();
            // 历史访问记录
            this.#visited_record();
            // 创建菜单事件
            this.#regist_menus_command();
            // 自动速度控制
            GM_Objects.get_value('speed_up_video', false) && this.#auto_speed_up();
            // 设置为不自动播放会出现一个问题, 就是play()这个操作会被浏览器拦截, 假如没有和页面产生交互的情况下
            // 这个问题主要出现在edge浏览器中
            // play()操作大概率因为页面没有和浏览器产生交互, 浏览器会拦截这个操作, 导致无法播放
            // 但是在chrome上这种情况并不明显
            setTimeout(() => this.#video_player.setAutoplay(this.#user_is_login), 5500);
        }
        // 初始化模块
        init() {
            return new Promise((resolve, reject) => {
                Object.defineProperty(unsafeWindow, 'player', {
                    get: () => this.#video_player,
                    set: (val) => {
                        this.#video_player = val;
                        Object.defineProperty(val, 'player', {

                        });
                        // 必须回调, 等待对象内容赋值后才能捕获具体
                        setTimeout(() => {
                            if (this.#is_support_urlchange) {
                                // 尽快执行关灯的动作
                                this.#auto_light.main() && this.light_control(1);
                                // 创建视频播放事件或者是监听视频元素变化
                                this.#user_is_login ? this.#create_video_event() : this.#video_element_change_monitor();
                                resolve(true);
                            } else reject('url_change_event_not_support');
                        });
                    },
                    configurable: true,
                    enumerable: true
                });
            });
        }
        // 监听视频信息更新, 需要等待信息更新完成才执行下一步
        #create_video_info_update_monitor() {
            let timeout_id = null;
            Object.defineProperty(this, 'video_info_update_flag', {
                set: (val) => {
                    if (val) {
                        timeout_id && clearTimeout(timeout_id);
                        timeout_id = setTimeout(() => {
                            timeout_id = null;
                            this.#visited_record();
                            this.#add_status_siderbar(true);
                        }, 1000);
                    }
                },
                get() { }
            });
        }
        /**
         * @param {Object} data
         * @param {boolean} user_is_login
         */
        constructor(data, user_is_login) {
            this.#user_is_login = user_is_login;
            this.#initial_flag = this.update_essential_info(data.upData, data.videoData);
            if (this.#initial_flag) this.#create_video_info_update_monitor();
        }
    }
    // ---------- 视频控制模块

    // ----------- 优化器主体
    class Bili_Optimizer {
        // 是否登录账号
        #user_is_login = false;
        // 执行配置
        #configs = null;
        #card_data = null;
        // 请求数据缓存
        #request_data_cache = null;
        // 初始化页面缓存
        #initial_cache = null;
        // 视频模块
        #video_instance = null;
        // web api请求实例
        #web_request_instance = null;
        // indexed数据库
        #indexeddb_instance = null;
        // 游标指针位置
        #indexeddb_cursor_index = 0;
        // 用于填充被过滤掉的视频
        #fill_home_videos = null;
        // 已经添加过的视频列表
        #video_has_added_list = [];
        // 视频模块成功加载标志
        #video_module_initial_flag = false;
        // 需要等待页面加载完成后加载的函数
        #end_load_funcs = [];
        // 启动时需要启动的函数
        #start_load_funcs = [];
        // 追踪标记
        static track_tags = ['spm_id_from', '?vid', 'vd_source', 'from_spmid'];
        // 清除url中的追踪标记
        static clear_track_tag(url) {
            // static, 相互之间访问的时候, this的指向是class自身而不是实例对象
            const t = this.track_tags.reduce((acc, e) => (acc = acc.split(e)[0], acc), url),
                p = url.split('&').find(e => e.startsWith('p='));
            return (t.endsWith('&') || t.endsWith('?') ? t.slice(0, -1) : t) + (p ? `?${p}` : '');
        }
        // 不同站点的基础配置信息
        #site_configs = {
            home: {
                // 站点所在id
                id: 0,
                // 目标元素的class_name
                target_class: 'bili-video-card is-rcmd',
                // api url 后缀
                interpose_api_suffix: ['web-interface/index/top/feed/rcmd', 'web-interface/wbi/index/top/feed/rcmd'],
                // 初始化数据的键名
                initial_data_name: '__pinia',
                /**
                 * html第一次载入时携带的数据的处理
                 * @param {object} val
                 * @returns {Array}
                 */
                initial_data_handler: (val) => {
                    // 初始化的数据中包含了用户是否登录的数据
                    // this.#user_is_login = val.feed?.data?.recommend.mid ? true: false;
                    const data = val.feed?.data?.recommend?.item, new_data = data ? data.map(e => {
                        if (this.#configs.pre_data_check(e)) {
                            this.#utilities_module.clear_data(e);
                            return true;
                        } else if (e.track_id) e.track_id = '';
                        const v = Dynamic_Variants_Manager.check_visited_video(e.bvid);
                        return v > 0 ? v : null;
                    }) : Colorful_Console.print('initial_data object api has changed in home page.', 'crash', true);
                    this.#initial_cache = data;
                    return new_data;
                },
                /**
                 * 处理api返回的数据
                 * @param {Array} data
                 */
                request_data_handler: (data) => {
                    const pre_data_check = this.#configs.pre_data_check,
                        clear_data = this.#utilities_module.clear_data.bind(this.#utilities_module);
                    this.#card_data.length = 0;
                    data.forEach(e => {
                        let id = e.bvid;
                        if (!id || this.#video_has_added_list.includes(id) || e.business_info || pre_data_check(e)) {
                            const item = this.#fill_home_videos?.my_pop(), id = item?.bvid;
                            if (id && !this.#video_has_added_list.includes(id)) {
                                for (const k in e) e[k] = item[k];
                                e.add_time = item.add_time;
                                this.#video_has_added_list.push(id);
                                this.#card_data.push([id, item.source, Dynamic_Variants_Manager.check_visited_video(id)]);
                            } else clear_data(e);
                        } else {
                            this.#video_has_added_list.push(id);
                            this.#card_data.push([id, 0, Dynamic_Variants_Manager.check_visited_video(id)]);
                        }
                    });
                    this.#request_data_cache = data;
                },
                get_mybili_data: async () => {
                    // 首先获取数据库的数据
                    const { pocket, recommend } = Indexed_DB.tb_name_dic, results = await this.#indexeddb_instance.batch_get(pocket, 10, this.#indexeddb_cursor_index);
                    if (results) {
                        results.forEach(e => (e.source = 1));
                        this.#indexeddb_cursor_index += results?.length;
                        this.#fill_home_videos.push(...results);
                    }
                    if (!results || results.length < 10) {
                        const rec = await this.#indexeddb_instance.batch_get_by_condition(recommend, (..._args) => Math.ceil(Math.random() * 10000) % 11 === 0, []);
                        if (rec) {
                            rec.forEach(e => (e.source = 2));
                            this.#fill_home_videos.push(...rec);
                        }
                    }
                },
                /**
                 * 判断发起请求数据api url是否需要进行拦截操作, 返回一个函数用于提取响应数据
                 * @param {string} url
                 * @returns {Function}
                 */
                handle_fetch_url: (url) => this.#configs.interpose_api_suffix.some(e => url.includes(this.#configs.interpose_api_prefix + e)) ? (data) => data.data?.item : null,
                /**
                 * 添加数据到节点标题, 注意不是title
                 * @param {HTMLElement} node
                 * @param {string} val
                 */
                add_info_to_node_title(node, val) {
                    const h = node.getElementsByTagName('h3')[0];
                    if (h) {
                        h.title = val + h.innerText;
                        h.firstChild.style.color = ['', '#32CD32', '#006400'][val];
                    } else Colorful_Console.print('title element miss', 'crash');
                },
                /**
                 * 读取目标节点元素的视频标题和up名称, 由于上面的添加信息到节点的操作, 不能直接读取标题的内容而是悬浮时显示的title
                 * @param {HTMLElement} node
                 * @returns {object} { up_name: '', title: '' }
                 */
                get_title_up_name: (node) => ({ up_name: node.getElementsByClassName('bili-video-card__info--author')[0]?.innerHTML.trim() || '', title: node.getElementsByTagName('h3')[0]?.innerText.trim() || '' }),
                /**
                 * 用于处理节点名称的匹配方式
                 * @param {string} classname
                 * @param {string} target_name
                 * @returns {boolean}
                 */
                contextmenu_handle: (classname, target_name) => classname.startsWith(target_name),
                click_action: (event_path) => {
                    let iw = false, nw = null, i = 0;
                    for (const p of event_path) {
                        if (!iw && p.className?.includes?.('bili-watch-later')) {
                            iw = true;
                            nw = p;
                        } else if (p.localName === 'a') {
                            let href = p.href || '';
                            if (href) {
                                if (iw) {
                                    this.#configs.watch_later(href, p);
                                    nw.parentNode.style.display = 'none';
                                    href = '';
                                }
                            }
                            return [href, p.target];
                        } else if (++i > 5) return false;
                    }
                },
                watch_later: (url, node) => {
                    const id = Base_Info_Match.get_bvid(url), data = (this.#request_data_cache || this.#initial_cache)?.find(e => e && e.bvid == id && !e.add_time);
                    // 首页滚动下拉, 假如一直保存缓存占用很大, 改用请求数据的方式返回数据
                    data ? this.#indexeddb_instance.add(Indexed_DB.tb_name_dic.pocket, data).then(() => this.#configs.control_tips(id, node)) :
                        this.#web_request_instance.get_video_base_info(id).then(data => {
                            const t = Data_Switch.base_video_info_to_home(data);
                            t ? this.#indexeddb_instance.add(Indexed_DB.tb_name_dic.pocket, t).then(() => this.#configs.control_tips(id, node)) : Colorful_Console.print('fail to switch data to home module', 'crash', true);
                        }).catch(() => Colorful_Console.print('watch_later: get_video_base_info error', 'crash', true));
                },
                keydown_action: {
                    get _button() { return document.getElementsByClassName('primary-btn roll-btn')[0]; },
                    _element_is_inview(el) {
                        const rect = el.getBoundingClientRect();
                        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
                    },
                    f() {
                        const btn = this._button;
                        btn && this._element_is_inview(btn) && btn.click();
                        return true;
                    },
                    _search_video: (index) => {
                        const node = document.getElementsByClassName(this.#configs.target_class)[index];
                        if (node && !node.dataset.is_hidden) {
                            const href = node.getElementsByTagName('a')[0].href;
                            href && GM_Objects.openintab(href, { active: true, insert: 1 });
                        }
                        return true;
                    },
                    _open_video(index) { return this._element_is_inview(this._button) ? this._search_video(index) : false; },
                    main(key) { return !isNaN(parseInt(key)) ? this._open_video(parseInt(key)) : this[key]?.();; }
                }
            },
            video: {
                id: 1,
                target_class: 'card-box',
                initial_data_name: '__INITIAL_STATE__',
                interpose_api_suffix: ['web-interface/archive/related', 'web-interface/wbi/view/detail?aid=', 'web-interface/wbi/view/detail?platform='],
                initial_data_handler: (val) => {
                    const data = val.related;
                    const m = {
                        "aid": 461236586,
                        "cid": 357129641,
                        "bvid": "BV1P5411T71D",
                        "duration": 749,
                        "pic": "http:\u002F\u002Fi1.hdslb.com\u002Fbfs\u002Farchive\u002Fc826072903444fd12e62de3b4cfec319399c547f.jpg",
                        "title": "【漫漫说】推理小说中最震撼的杀人诡计！恐怖诡异宛如恶魔降临！",
                        "owner": {
                            "name": "汉森白JW",
                            "mid": 98666360
                        },
                        "stat": {
                            "danmaku": 2683,
                            "view": 843076,
                            "vt": 0
                        },
                        "season_id": 0,
                        "season_type": 0,
                        "redirect_url": "",
                        "enable_vt": 0,
                        "aiParameters": {
                            "goto": "av",
                            "trackid": "web_related_0.router-related-1502038-68784448d8-rbmml.1716122623906.277",
                            "uniq_id": "",
                            "r_id": 461236586
                        }
                    };
                    if (data) {
                        // 数据的长度最好是和原数据一致, 并不是所有的视频都有40组视频
                        // 少了或者多了均可能导致页面崩溃, 数据少于20的, 多了导致页面崩溃; 数据多于20, 少了会导致页面崩溃
                        const tmp = data.map(e => this.#configs.pre_data_check(e) ? (this.#utilities_module.clear_data(e), true) : null),
                            n = data.filter((_v, i) => !tmp[i]), limit = data.length,
                            new_arr = n.length < limit ? [...n, ...new Array(limit).fill(m)].slice(0, limit) : n;
                        val.related = new_arr;
                        this.#request_data_cache = new_arr;
                        return tmp;
                    } else Colorful_Console.print('initial_data object api has changed in video page.', 'crash', true);
                },
                // 视频播放页的初始化状态中, 追踪id就已经被添加到href中, 所以必须通过遍历节点的方式清除掉
                clear_a_link: (node) => {
                    const links = node.getElementsByTagName('a');
                    for (const a of links) {
                        const href = a.href;
                        if (href) a.href = href.split('?spm_id_from')[0];
                    }
                },
                add_date_to_node_title(node, val) {
                    const t = node.getElementsByClassName('title')[0];
                    t ? t.innerText = val + t.innerText : Colorful_Console.print('title element miss', 'crash');
                },
                // 侧边栏不知何故, 分别向连个不同的api请求两次数据, 返回的数据结构也不一样
                // 视频播放页的相关视频数据请求了多次, 能够获得数据的api有3个
                // 应该是和连续播放以及侧边栏插入内容分开造成的
                // 不能采用清空数据的策略, 在视频播放页面该操作会导致侧边栏添加html元素时出现错误
                // 筛选掉被过滤的内容, 重新生成新的数组
                request_data_handler: (data, pre_data_check) => data.filter(e => !pre_data_check(e)),
                get_title_up_name: (node) => [['title', 'title', 'title'], ['up_name', 'name', 'innerText']].reduce((t, c) => (t[c[0]] = node.getElementsByClassName(c[1])[0]?.[c[2]]?.trim() || '', t), {}),
                /**
                 * 视频页面的数据请求会发生两种情况: 1. 第一次载入, 请求一次, 因为html上的数据
                 * B站在视频播放页这里的操作很迷, 最多可能产生3次数据请求, 一般为2次, 首次可能为1次
                 * 请求的数据分别存放在不同的位置
                 * @param {string} url
                 * @returns {Function}
                 */
                handle_fetch_url: (url) => this.#configs.interpose_api_suffix.some(e => url.includes(this.#configs.interpose_api_prefix + e)) ? (response_content) => {
                    const data = response_content.data;
                    if (!data) {
                        Colorful_Console.print("the api of video data has change", 'crash', true);
                        return;
                    }
                    let results = null;
                    // 缓存的数据
                    const cache_results = this.#request_data_cache;
                    // 已经取得目标数组
                    if (Array.isArray(data)) {
                        if (cache_results) {
                            response_content.data = cache_results;
                            return;
                        }
                        results = this.#configs.request_data_handler(response_content.data, this.#configs.pre_data_check);
                        response_content.data = results;
                    } else {
                        if (cache_results) {
                            response_content.data.Related = cache_results;
                            return;
                        }
                        this.#video_instance?.update_essential_info(data.View.owner, data.View);
                        results = this.#configs.request_data_handler(data.Related, this.#configs.pre_data_check);
                        response_content.data.Related = results;
                    }
                    this.#request_data_cache = results;
                } : null,
                contextmenu_handle: (classname, target_name) => classname === target_name,
                click_action: (event_path) => {
                    let i = 0;
                    for (const p of event_path) {
                        if (p.localName === 'a') {
                            const href = p.href || '';
                            if (!href || href.includes('/video/')) {
                                // 当主动点击播放视频时, 重置标记
                                this.#video_instance.end_and_add_flag = true;
                                return false;
                            }
                            return [href, p.target];
                        } else if (i++ > 5) return false;
                    }
                },
                keydown_action: {
                    _exe: (action, arg = undefined) => this.#video_module_initial_flag && (arg === undefined ? this.#video_instance[action]() : this.#video_instance[action](arg)),
                    p() { this._exe('play_control'); },
                    l() { this._exe('light_control'); },
                    t() { this._exe('theatre_mode'); },
                    u() { this._exe('wide_screen'); },
                    '='() { this._exe('voice_control', true); },
                    '-'() { this._exe('voice_control', false); },
                    _rate(val) { this._exe('key_rate_video', val); },
                    1() { this._rate(1); },
                    2() { this._rate(2); },
                    3() { this._rate(3); },
                    o() { this._rate(9); },
                    main(key) {
                        const f = this[key];
                        return f ? (f.apply(this), true) : false;
                    }
                }
            },
            search: {
                id: 2,
                parent_class: 'video-list row',
                target_class: 'bili-video-card',
                interpose_api_suffix: 'web-interface/wbi/search/',
                initial_data_name: '__pinia',
                initial_data_handler: (val) => {
                    // 需要注意访问的首页不是第一页的时候, 存在cookie, B站也可以直接以html返回数据, 而不是访问api
                    // 这个是否两组数组都存在, 优先读取后者searchTypeResponse
                    const { searchTypeResponse, searchResponse, searchAllResponse } = val.index ? val.index : val,
                        data = searchTypeResponse?.searchTypeResponse?.result || (searchResponse || searchAllResponse)?.searchAllResponse?.result?.[11]?.data,
                        new_data = data ? data.map(e => {
                            if (this.#configs.pre_data_check(e)) {
                                this.#utilities_module.clear_data(e);
                                return true;
                            }
                            const v_r = { v: 0, r: 0 }, vid = e.bvid;
                            v_r.v = Dynamic_Variants_Manager.check_visited_video(vid);
                            v_r.r = Dynamic_Variants_Manager.rate_videos.check_rate(vid);
                            return ((v_r.r !== 0 || v_r.v !== 0) ? v_r : null);
                        }) : Colorful_Console.print('initial_data object api has changed in search page.', 'crash', true);
                    this.#initial_cache = data;
                    return new_data;
                },
                add_state_to_node(node, v_r) {
                    const html = `
                        <span class="bili-video-card__stats--item" data-v-62f526a6="">
                            <span data-v-62f526a6="">r: ${v_r.r} | v: ${v_r.v}</span>
                        </span>`;
                    const ele = node.getElementsByClassName('bili-video-card__stats--left');
                    ele.length > 0 ? ele[0].insertAdjacentHTML('beforeend', html) : Colorful_Console.print('fail to insert element to video card', 'crash');
                },
                fetch_flag: false,
                /**
                 *
                 * @param {Array} data
                 * @param {Function} clear_data
                 */
                request_data_handler: (data) => {
                    const clear_data = this.#utilities_module.clear_data.bind(this.#utilities_module), { lost_pic, pre_data_check } = this.#configs;
                    this.#card_data = data.map(e => {
                        if (pre_data_check(e)) {
                            clear_data(e);
                            e.pic = lost_pic;
                            return false;
                        }
                        const v_r = { v: 0, r: 0 }, vid = e.bvid;
                        v_r.v = Dynamic_Variants_Manager.check_visited_video(vid);
                        v_r.r = Dynamic_Variants_Manager.rate_videos.check_rate(vid);
                        return ((v_r.r !== 0 || v_r.v !== 0) ? v_r : null);
                    });
                    this.#request_data_cache = data;
                },
                get_title_up_name: (node) => this.#site_configs.home.get_title_up_name(node),
                handle_fetch_url: (url) => {
                    // 第一页的处理
                    const a = (response_content) => {
                        if (response_content.data?.page === 1) {
                            const r = response_content.data.result;
                            this.#configs.fetch_flag = true;
                            return r[r.length - 1].data;
                        }
                        return response_content.data?.result;
                    },
                        b = (response_content) => (response_content.data?.result),
                        pref = this.#configs.interpose_api_prefix + this.#configs.interpose_api_suffix,
                        index = [
                            ['all/v2?__refresh__=true'],
                            ['type?category_id=&search_type=video'],
                            ['type?__refresh__=true', 'search_type=video']
                        ].findIndex(e => e.length > 1 ? url.includes(pref + e[0]) && url.includes(e[1]) : url.includes(pref + e[0]));
                    return index < 0 ? null : index === 0 ? a : b;
                },
                contextmenu_handle: (classname, target_name) => classname === target_name,
                // 检查搜索链接是否包含黑名单关键词
                check_search: (href) => {
                    const c = decodeURIComponent(href.slice(32)), { a, b } = Dynamic_Variants_Manager.black_keys, r = a.find(e => c.includes(e)) || b.find(e => c.includes(e));
                    return r ? (Colorful_Console.print(`hey, bro, search rubbish: "${r}"`), true) : false;
                },
                click_action: (event_path) => {
                    let iw = false, nw = null, i = 0;;
                    for (const p of event_path) {
                        // 有些classname并不是字符串或者空, 而是object
                        if (!iw && p.className?.includes?.('bili-watch-later')) {
                            iw = true;
                            nw = p;
                        } else if (p.localName === 'a') {
                            let href = p.href || '';
                            if (href.startsWith('javascript')) href = '';
                            else if (href.endsWith('video//')) {
                                p.href = 'javascript:void(0)';
                                href = '';
                            } if (iw) {
                                this.#configs.watch_later(href, p);
                                nw.parentNode.style.display = 'none';
                                href = '';
                            }
                            return [href, p.target];
                        } else if (i++ > 5) return false;
                    }
                },
                watch_later: (url, node) => {
                    const id = Base_Info_Match.get_bvid(url), data = (this.#request_data_cache || this.#initial_cache)?.find(e => e && e.bvid == id);
                    const module = data ? Data_Switch.search_to_home(data) : null;
                    if (module) {
                        Statics_Variant_Manager.watch_later.add(module);
                        this.#configs.control_tips(id, node);
                    } else Colorful_Console.print('can not find data for watch later in search', 'warning');
                }
            },
            space: { id: 3 },
            other: { id: 4 },
            play: {
                id: 5,
                click_action: (event_path) => {
                    let i = 0;
                    for (const e of event_path) {
                        if (e.localName === 'a') {
                            const href = e.href || '';
                            if (!href || href.includes('play/')) return false;
                            return [href, p.target];
                        } else if (i++ > 5) return false;
                    }
                }
            },
            read: {
                id: 6,
                // 阻止复制内容添加来源声明
                end_load_func: () => setTimeout(document.getElementById('article-content')?.addEventListener('copy', (e) => e.stopPropagation(), true), 1000)
            },
            history: { id: 7 }
        };
        // 通用工具函数模块
        #utilities_module = {
            /**
             * 获取节点的up, video的信息
             * @param {HTMLElement} node
             * @returns {object | number}
             */
            get_up_video_info: (node) => {
                const links = node.getElementsByTagName('a'), info = {
                    'mid': 0,
                    'up_name': '',
                    'bvid': '',
                    'title': '',
                };
                for (const a of links) {
                    const href = a.href || '';
                    // 广告, 小课堂的内容清除掉
                    if (href) {
                        if (href.includes('cm.bilibili.com') || href.includes('/cheese')) {
                            Colorful_Console.print(`advertisement clear: ${href}`);
                            return null;
                        } else if (!info.bvid) info.bvid = Base_Info_Match.get_bvid(href);
                        else if (!info.mid) info.mid = Base_Info_Match.get_mid(href);
                        else break;
                    }
                }
                const data = this.#configs.get_title_up_name(node);
                ['title', 'up_name'].forEach(e => (info[e] = data[e].toLowerCase()));
                // 检查是否存在空的数据, 假如为空, 则表明内容可能不是视频
                return Object.entries(info).every(([k, v]) => v ? true : Colorful_Console.print(`less data: ${k}`, 'debug')) ? info : null;
            },
            /**
             * 将拦截对象的数据设置为空
             * @param {object} data
             */
            clear_data(data) {
                // 递归调用, 遍历清空各层级的内容, 不涉及数组
                if (Array.isArray(data)) for (const e of data) this.clear_data(e);
                else if (data && data.constructor === Object) {
                    for (const key in data) {
                        const tmp = data[key];
                        const vtype = typeof tmp;
                        if (vtype === 'string') data[key] = '';
                        else if (vtype === 'number') data[key] = 0;
                        else if (data) this.clear_data(tmp);
                    }
                }
            }
        };
        // 代理, 各类拦截函数模块
        #proxy_module = {
            /**
             * 代理设置
             * @param {object} target
             * @param {string} name
             * @param {object} handler
             */
            __proxy(target, name, handler) { target[name] = new Proxy(target[name], handler); },
            // 在视频播放页面, 当视频被加载完成, 会载入url追踪参数
            _history_replacestate() {
                this.__proxy(GM_Objects.window.history, 'replaceState', {
                    apply(...args) {
                        const a = args[2]?.[2];
                        !(a && Bili_Optimizer.track_tags.some(e => a.includes(e))) && Reflect.apply(...args);
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
                                    if (b) a[i] = Bili_Optimizer.clear_track_tag(b);
                                }
                            }
                        }
                        Reflect.apply(...args);
                    }
                });
            },
            // 页面中的handleDocumentInitActive, 这个点击函数会导致url被添加追踪参数
            _addeventlistener() { this.__proxy(document, 'addEventListener', { apply(...args) { !(args[2]?.[0] === 'click' && args[2]?.[1]?.name === 'handleDocumentInitActive') && Reflect.apply(...args); } }); },
            // 干预页面进行的href添加追踪参数的操作
            // 由于当前页面的元素已经添加了追踪参数, 所以拦截的操作可以在这里启动, 而不是在页面刚加载的时候启动
            _setattribute() { this.__proxy(HTMLAnchorElement.prototype, 'setAttribute', { apply(...args) { args[2]?.[0] === 'href' && (args[2][1] = args[2][1].split('?spm_id_from')[0]), Reflect.apply(...args); } }); },
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
                                Colorful_Console.print('search content contain black key', 'warning', true);
                                return;
                            }
                            args[2][0] = url;
                        }
                        Reflect.apply(...args);
                    }
                });
            },
            // 拦截fetch的返回结果
            // B站的数据请求会在fetch, xhr之间反复切换
            // fetch, 有直接调用和bind之后调用两种, xhr则没有
            _fetch: () => {
                // B站的fetch进行了bind(window)的操作, 拦截这个操作, 不能直接拦截fetch
                const fetch = GM_Objects.window.fetch,
                    handle_fetch = async (...args) => {
                        // 拦截fetch返回的结果, 并且进行数据清理
                        const [url, config] = args;
                        if (this.#configs.check_other_requets(url)) return;
                        // 根据配置的函数, 决定是否需要干预, 返回一个处理后续数据的函数
                        const response = await fetch(url, config);
                        // response, 只允许访问一次, clone一份, 在复制上进行操作
                        if (this.#configs.check_login_request(url)) response.json = () => response.clone().json().then(_ => this.#configs.fake_login_info);
                        else if (this.#configs.check_other_requets(url)) return;
                        else {
                            const hfu = this.#configs.handle_fetch_url(url);
                            if (hfu) response.json = () => response.clone().json().then((response_content) => (this.#configs.clear_request_data(response_content, url, hfu), response_content));
                        }
                        return response;
                    };
                GM_Objects.window.fetch = handle_fetch;
                Function.prototype.bind = new Proxy(Function.prototype.bind, {
                    apply: (...args) => {
                        // 返回自定义的fetch函数替换掉fetch.bind(window)生成的函数
                        if (args[1]?.name === 'fetch') args[1] = handle_fetch;
                        return Reflect.apply(...args);
                    }
                });
            },
            _xmlrequest: () => {
                // B站视频播放页相关视频的数据请求, 从fetch改回xmlrequest
                // 首次载入, 加载一次数据, 在登录账户时
                // 第二次加载相关视频推荐时, 会请求两次数据
                const {
                    handle_fetch_url,
                    fake_login_info,
                    check_login_request,
                    check_other_requets,
                    clear_request_data
                } = this.#configs, new_fn = (fn, ...args) => fn.apply(this, args); // 用于调用外部的this
                // 不登陆的状态下, 会发起可能多达3次的请求, 也可能不请求数据, 非常诡异...
                GM_Objects.window.XMLHttpRequest = class extends GM_Objects.window.XMLHttpRequest {
                    #exe_action = null;
                    constructor() {
                        super();
                        // 事件监听必须在这里创建才能准确拦截到responseText返回值
                        this.#create_event();
                    }
                    /**
                     * @param {string} json
                     */
                    #modified_result(json) { Object.defineProperty(this, 'responseText', { get() { return json; }, set(_val) { } }); }
                    #intercept_login_status(_arg) { this.#modified_result(JSON.stringify(fake_login_info)); }
                    /**
                     * 干预请求数据
                     * @param {Function} func
                     */
                    #intercept_requests_data(func) {
                        const data = clear_request_data(this.responseText, this.responseURL, func);
                        data && this.#modified_result(data);
                    }
                    #create_event() { this.addEventListener('readystatechange', () => this.readyState === 4 && this.status === 200 && this.#exe_action?.()); }
                    open(...args) {
                        const url = args[1];
                        if (check_login_request(url)) this.#exe_action = this.#intercept_login_status.bind(this);
                        else if (new_fn(check_other_requets, url)) return;
                        else {
                            const func = handle_fetch_url(url);
                            if (func) this.#exe_action = this.#intercept_requests_data.bind(this, func);
                        }
                        return super.open(...args);
                    }
                };
            },
            _localstorage() {
                this.__proxy(localStorage, 'setItem', {
                    apply(target, thisArg, args) {
                        // B站的首页会私自更改弹幕开关
                        if (args[0] === 'bpx_player_profile') {
                            const json = JSON.parse(args[1]);
                            if (json?.dmSetting?.dmSwitch) {
                                json.dmSetting.dmSwitch = GM_Objects.get_value('danmu_switch', false);
                                args[1] = JSON.stringify(json);
                            }
                        }
                        return Reflect.apply(target, thisArg, args);
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
                    _xmlrequest: { run_at: 0, run_in: [0, 1], type: 0 },
                    _search_box_clear: { run_at: 0, run_in: [0, 1, 3, 4, 5, 6, 7], type: 1 },
                    _addeventlistener: { run_at: 0, run_in: [2], type: 1 },
                    _setattribute: { run_at: 1, run_in: [1], type: 1 },
                    _history_replacestate: { run_at: 0, run_in: [1, 5], type: 1 },
                    _history_pushstate: { run_at: 1, run_in: [1, 5], type: 1 },
                    _localstorage: { run_at: 0, run_in: [0], type: 1 }
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
                run_in: Array.from({ length: Object.entries(this.#site_configs).length }, (_val, index) => index),
                css: (_user_is_login) => `
                .bili-header .left-entry .default-entry,
                a.download-entry.download-client-trigger,
                .bili-header .loc-mc-box,
                .bili-header .bili-header__banner .banner-img,
                .bili-header .bili-header__banner .header-banner__inner,
                .animated-banner,
                li.v-popover-wrap.left-loc-entry{
                    visibility: hidden !important;
                }
                .login-tip,
                .van-message.van-message-error,
                .trending{
                    display: none !important;
                }
                input::-webkit-input-placeholder {
                        /* placeholder字体大小  */
                        font-size: 0px;
                        /* placeholder位置  */
                        text-align: right;
                }
                .show_tips {
                    position: absolute;
                    width: 100%;
                    height: 30px;
                    line-height: 30px;
                    padding: 0 30px;
                    background: #fff0e3;
                    font-size: 12px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .bili-header__banner{
                    height: 100px !important;
                }`
            },
            _home: {
                run_in: [0],
                css: (_user_is_login) => `
                .floor-single-card,
                .bili-live-card.is-rcmd{
                    visibility: hidden !important;
                }
                .btn-ad,
                .adcard,
                .carousel,
                a.banner-link,
                .adblock-tips,
                .vip-login-tip,
                .recommended-swipe,
                .channel-items__left,
                .login-panel-popover,
                .desktop-download-tip,
                .channel-items__right,
                .header-channel-fixed,
                .bili-header .animated-banner,
                picture#bili-header-banner-img,
                a.channel-icons__item:nth-of-type(2),
                .floor-single-card,
                section.channel-floor.bili-grid.no-margin{
                    display: none !important;
                }`
            },
            _video: {
                run_in: [1],
                // .bpx-player-toast-item这部分用于隐藏显示的高清试用相关的信息, 但是不影响click操作
                css: (user_is_login) =>
                    (user_is_login ? '' : '.bpx-player-subtitle-panel-text,') + `.video-page-special-card-small,
                    .video-page-operator-card-small,
                    .slide-ad-exp,
                    .video-card-ad-small,
                    .video-page-game-card-small,
                    a.ad-report.ad-floor-exp.right-bottom-banner,
                    a.ad-report.video-card-ad-small,
                    a#right-bottom-banner,
                    .watch-later-video.van-watchlater.black,
                    .pop-live-small-mode.part-1{
                        display: none !important;
                    }
                    .bpx-player-toast-item{opacity: 0.01 !important;}`
            },
            _search: {
                run_in: [2],
                css: (_user_is_login) => '.activity-game-list.i_wrapper.search-all-list {display: none !important;}'
            },
            inject_css(id, user_is_login) {
                const arr = [];
                for (const k in this) {
                    const c = this[k];
                    c.run_in?.includes(id) && arr.push(c.css(user_is_login));
                }
                arr.length > 0 && GM_Objects.addstyle(arr.join(''));
            }
        };
        // 事件函数模块
        #event_module = {
            // 右键菜单事件
            _contextmenu: () => {
                // 隐藏视频的可见, 和是否拉黑视频
                const check_assist_key = (event) => ['shiftKey', 'ctrlKey', 'altKey'].findIndex(e => event[e]);
                document.addEventListener('contextmenu', (event) => {
                    const ikey = check_assist_key(event);
                    if (ikey < 0) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const target_name = this.#configs.target_class, cfunc = this.#configs.contextmenu_handle;
                    let i = 0;
                    for (const p of event.composedPath()) {
                        const clname = p.className;
                        if (cfunc(clname, target_name)) {
                            if (p.dataset.is_hidden) return;
                            const info = this.#utilities_module.get_up_video_info(p), vid = info?.bvid;
                            if (vid) {
                                this.#configs.hide_node(p);
                                this.#configs.add_data_to_node_dataset(p, 'is_hidden', 1);
                                if (ikey === 0) Dynamic_Variants_Manager.block_video(vid);
                                else if (ikey === 1) {
                                    Dynamic_Variants_Manager.cache_block_videos.push(vid);
                                    Dynamic_Variants_Manager.bayes_module.add_new_content(info.title, false);
                                }
                                this.#configs.delete_data_by_bvid(vid);
                            }
                            break;
                        }
                        if (++i > 6) break;
                    }
                }, true);
            },
            // 点击链接事件
            _click: () => {
                const click_action = this.#configs.click_action || ((event_path) => {
                    let i = 0;
                    for (const p of event_path) {
                        if (p.localName === 'a') return [p.href, p.target];
                        else if (++i > 5) return false;
                    }
                }), cure_href_reg = /[&\?](live|spm|from)[\w]+=\d+/,
                    get_cure_href = (href) => href.startsWith('http') ? href.split(cure_href_reg)?.[0] || href : href;
                document.addEventListener('click', (event) => {
                    const r = click_action(event.composedPath());
                    if (!r) return;
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    const [url, target] = r;
                    if (url) {
                        const href = get_cure_href(url);
                        event.ctrlKey && GM_Objects.set_value('speed_up_video', true);
                        this.#indexeddb_instance?.delete(Indexed_DB.tb_name_dic.recommend, Base_Info_Match.get_bvid(href));
                        if (target === '_blank') GM_Objects.openintab(href, { insert: 1, active: true });
                        else window.location.href = href;
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
                    run_in: Array.from({ length: Object.entries(this.#site_configs).length }, (_val, index) => index),
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
                            s && (Dynamic_Variants_Manager.key_check(s) === 0 ? GM_Objects.openintab(this._protocols + url + encodeURIComponent(s), { insert: 1, active: true }) : Colorful_Console.print('search content contain black key', 'warning', true));
                            return true;
                        }
                        return false;
                    }
                },
                    // 管理贝叶斯
                    manage_bayes = {
                        _add_white() {
                            const s = prompt('add content to bayes white list').trim();
                            return s ? (Dynamic_Variants_Manager.bayes_module.add_new_content(s, true), true) : false;
                        },
                        main(key) { return key === 'w' && this._add_white(); }
                    },
                    // 关键词黑名单管理
                    manage_black_key = {
                        run_in: [0, 2],
                        _func: (data) => {
                            const nodes = document.getElementsByClassName(this.#configs.target_class),
                                a = this.#utilities_module.get_up_video_info,
                                b = this.#configs.hide_node,
                                c = this.#configs.add_data_to_node_datase;
                            for (const node of nodes) {
                                if (node.dataset.is_hidden) continue;
                                const info = a(node);
                                if (info) {
                                    const { title, up_name } = info;
                                    if (data.some(e => title.includes(e) || up_name.includes(e))) {
                                        b(node), c(node, 'is_hidden', 1);
                                    }
                                }
                            }
                            this.#configs.delete_data_by_keyword(data);
                        },
                        a: { title: 'add', mode: true },
                        r: { title: 'remove', mode: false },
                        main(key) {
                            const c = this[key];
                            if (c) {
                                const title = c.title + ' black key; use space to separate mult words; e.g.: "abc"; or "abc" "bcd".',
                                    a = Dynamic_Variants_Manager.black_keys.input_handle((prompt(title) || '').trim());
                                if (a && a.length > 0) {
                                    if (c.mode) {
                                        Dynamic_Variants_Manager.black_keys.add(a);
                                        this._func(a);
                                    }
                                    else Dynamic_Variants_Manager.black_keys.remove(a);
                                }
                                return true;
                            }
                            return manage_bayes.main(key);
                        }
                    },
                    other_funs = {
                        run_in: Array.from({ length: Object.entries(this.#site_configs).length }, (_val, index) => index),
                        h() {
                            GM_Objects.openintab('https://www.bilibili.com/account/history', { insert: 1, active: true });
                            return true;
                        },
                        main(key) { return this[key]?.(); }
                    },
                    // 文本标签, 需要排除输入
                    local_tags = ["textarea", "input"], class_tags = ['input', 'text', 'editor'],
                    check_is_input = (target) => {
                        const localname = (target.localName || '').toLowerCase();
                        if (localname && local_tags.includes(localname)) return true;
                        const classname = (target.className || '').toLowerCase();
                        if (classname && class_tags.some(e => classname.includes(e))) return true;
                        return false;
                    },
                    check_cas = (event) => ['shiftKey', 'ctrlKey', 'altKey'].some(e => event[e]),
                    id = this.#configs.id, funcs = [search, manage_black_key, other_funs].filter(e => e.run_in.includes(id)).map(e => e.main.bind(e)),
                    ka = this.#configs.keydown_action;
                if (ka) funcs.push(ka.main.bind(this.#configs.keydown_action));
                document.addEventListener('keydown', (event) => {
                    if (check_cas(event) || check_is_input(event.target)) return;
                    const key = event.key.toLowerCase();
                    if (funcs.some(f => f(key))) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }, true);
            },
            /**
             * 配置执行函数
             * @param {number} id
             * @returns {Array}
             */
            get_funcs(id) { return (id < 3 ? Object.getOwnPropertyNames(this).filter(e => e !== 'get_funcs').map(e => this[e]) : [this._click, this._key_down]).map(e => (e.start = 1, e)); }
        };
        // 特定页面执行函数模块, 由于内容比较多, 不放在 #configs
        #page_modules = {
            /**
             * 遍历视频卡片
             * @param {HTMLElement} target
             * @param {Array} datalist
             * @returns {null}
             */
            _traversal_video_card: (target, datalist) => datalist && setTimeout(() => {
                if (datalist.length === 0) return;
                const parent_class = this.#configs.parent_class;
                if (parent_class) {
                    const parent_nodes = document.getElementsByClassName(parent_class), i = parent_nodes.length;
                    if (i > 0) target = parent_nodes[i - 1];
                    else {
                        Colorful_Console.print('without traversable nodes.', 'debug');
                        return;
                    }
                }
                const nodes = target.getElementsByClassName(this.#configs.target_class);
                if (nodes.length === 0) {
                    Colorful_Console.print('no initial elements', 'debug');
                    return;
                }
                const {
                    hide_node,
                    add_info_to_node_title,
                    add_data_to_node_dataset,
                    add_state_to_node,
                    clear_a_link
                } = this.#configs;
                // 首页, api请求的数据被清空, 则在html上是不会创建节点的, 搜索页和播放页上, 假如清空还是会创建节点, 当还创建节点就添加dataset
                let i = 0;
                for (const node of nodes) {
                    const info = datalist[i];
                    let f = true;
                    if (info) {
                        const type = typeof info;
                        if (type === 'boolean') {
                            add_data_to_node_dataset(node, 'is_hidden', 1);
                            // 这里的false存在是为了适应search中返回的数据
                            info && hide_node(node);
                            f = false;
                        } else if (type === 'number') add_info_to_node_title(node, info);
                        else if (type === 'object') add_state_to_node(node, info);
                    }
                    f && clear_a_link?.(node);
                    i++;
                }
                datalist.length = 0;
            }, 100),
            // 监听拦截up或者视频的变化, 对整个页面遍历, 检查是否需要拦截
            _block_video_up_data_sync_monitor: () => {
                // 监听同步数据的改变
                // 搜索页, 播放页, 首页
                // add or Remove
                const clear_all_card = (data) => {
                    // 同步数据, 执行清除的操作
                    // 拦截up, 要全部执行, 拦截视频, 则挑出
                    const val = data.value,
                        [name, id] = typeof val === 'string' ? ['bvid', val] : ['mid', val.mid],
                        hide_node = this.#configs.hide_node,
                        add_data_to_node_dataset = this.#configs.add_data_to_node_dataset,
                        get_up_video_info = this.#utilities_module.get_up_video_info;
                    (name === 'mid' ? (nodes) => {
                        for (const node of nodes) {
                            if (node.dataset.is_hidden) continue;
                            const info = get_up_video_info(node);
                            if (info) {
                                if (info.mid === id) {
                                    hide_node(node);
                                    add_data_to_node_dataset(node, 'is_hidden', 1);
                                }
                            }
                        }
                        // 在b的数据中, mid的数据类型为数字
                        this.#configs.delete_data_by_mid(parseInt(id));
                    } : (nodes) => {
                        for (const node of nodes) {
                            if (node.dataset.is_hidden) continue;
                            const info = get_up_video_info(node);
                            if (info) {
                                if (info.bvid === id) {
                                    hide_node(node);
                                    add_data_to_node_dataset(node, 'is_hidden', 1);
                                    break;
                                }
                            }
                        }
                        this.#configs.delete_data_by_bvid(id);
                    })(document.getElementsByClassName(this.#configs.target_class));
                };
                let tmp = null;
                Object.defineProperty(Dynamic_Variants_Manager, 'up_video_data_sync_info', { set: (v) => { clear_all_card(v), tmp = v; }, get: () => tmp });
            },
            // 初始化页面数据的清理
            _initial_data_intercept: (id, href) => {
                if (id === 2 && !['com/video', 'com/all'].some(e => href.includes(e))) return;
                let initial_data = null;
                const initial_data_handler = this.#configs.initial_data_handler.bind(this), clear_data = this.#utilities_module.clear_data.bind(this.#utilities_module);
                Object.defineProperty(GM_Objects.window, this.#configs.initial_data_name, {
                    set: (val) => {
                        if (val) {
                            this.#card_data = initial_data_handler(val);
                            //  val.adData; 假如清空这个广告内容会导致页面崩溃
                            if (val.spec) clear_data(val.spec);
                            initial_data = val;
                            if (id === 1) {
                                const v = new Video_Module(val, this.#user_is_login);
                                if (v.initial_flag) {
                                    this.#video_instance = v;
                                    this.#video_instance.init().then(() => (this.#video_module_initial_flag = true));
                                }
                            }
                        }
                    },
                    get: () => initial_data
                });
            },
            _initial_main: () => {
                const id = this.#configs.id;
                // 播放页的内容展示, B站已经对无数据的内容进行了隐藏, 因此这里不需要再做处理
                id !== 1 && this.#page_modules._traversal_video_card(document, this.#card_data);
                Object.defineProperties(Terminal_Module, {
                    ...(id === 1 ? {
                        download_audio_path: { get: () => this.#video_instance.download_audio_path, set: (val) => (this.#video_instance.download_audio_path = val) },
                        download_video_path: { get: () => his.#video_instance.download_video_path, set: (val) => (this.#video_instance.download_video_path = val) },
                    } : {}),
                    video_duration_limit: { get: () => this.#configs.video_duration_limit, set: (val) => (this.#configs.video_duration_limit = val) }
                });
            },
            // 数据库初始化
            _indexeddb_main: () => {
                const tables = [
                    { table_name: Indexed_DB.tb_name_dic.recommend, key_path: 'bvid' },
                    { table_name: Indexed_DB.tb_name_dic.history, key_path: 'bvid' },
                    { table_name: Indexed_DB.tb_name_dic.pocket, key_path: 'bvid' }
                ], db = new Indexed_DB('mybili', tables);
                db.initialize().then(() => ((this.#indexeddb_instance = db), Colorful_Console.print('indexeddb, init successfully!')));
            },
            // space页面
            _space_module: {
                _maintain() {
                    const data = GM_Objects.get_value('block_ups', []);
                    if (data.length > 1000) {
                        const now = Date.now(), c = 1000 * 60 * 60 * 24, item = data.find(e => {
                            const gap = (now - e.last_active_date) / c;
                            if (gap > 120) {
                                const vtimes = e.visited_times;
                                return vtimes < 2 || (vtimes < 3 && gap > 180);
                            }
                        });
                        if (item) Statics_Variant_Manager.up_part.unblock(item.mid);
                    }
                },
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
                _create_event(button, mode, mid, up_name) {
                    button.onclick = (event) => {
                        const target = event.target;
                        let text = "Block";
                        if (mode) Statics_Variant_Manager.up_part.unblock(mid);
                        else {
                            // 拦截up
                            const now = Date.now();
                            const info = {
                                mid: mid,
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
                    this._maintain();
                    setTimeout(() => {
                        const title = document.title;
                        const up_name = title.split('的个人空间')[0];
                        if (up_name === 'undefined' || up_name.length === title.length) return;
                        const mid = Base_Info_Match.get_mid(location.href);
                        if (mid) {
                            if (mid === '441644010') {
                                Colorful_Console.print("author's page, whitelist", 'debug');
                                return;
                            }
                            const mode = Statics_Variant_Manager.up_part.check(mid);
                            this._create_event(this._create_button(mode), mode, mid, up_name);
                        }
                    }, 3000);
                }
            },
            // 搜索页面
            _search_module: {
                main: () => setTimeout(() => {
                    // 节点变化监, 用于精确执行操作html元素操作
                    const wrapper = document.getElementsByClassName('search-page-wrapper');
                    wrapper.length > 0 ? new MutationObserver((records) => {
                        for (const r of records) {
                            for (const node of r.addedNodes) {
                                if ((node.className || '').startsWith?.('search-page')) {
                                    setTimeout(() => this.#page_modules._traversal_video_card(node, this.#card_data), 300);
                                    return;
                                }
                            }
                        }
                    }).observe(wrapper[0], { childList: true }) : Colorful_Console.print('search page monitor no target node', 'crash', true);
                    // 第一页的插入节点和请求数据的先后和其他的页面不一样, 所以这里额外处理
                    // 由于首页插入的节点的操作在请求数据之前, 需要额外监听等待数据请求后才执行操作.
                    // 这种页面很多页面都有类似逻辑
                    const configs = this.#configs;
                    // 私有属性无法直接拦截
                    let tmp = null;
                    Object.defineProperty(configs, 'fetch_flag', {
                        set: (v) => (tmp = v) && setTimeout(() => this.#page_modules._traversal_video_card(document, this.#card_data), 300),
                        get: () => tmp
                    });
                }, 300)
            },
            // 视频播放页面
            // 稍微等待一下视频的加载, 这里的这种方式不是很靠谱, 但是懒得监听元素来实现加载, 因为这里的操作对时间不是很敏感.
            _video_module: {
                // b站的用户登录检测统一向: https://api.bilibili.com/x/web-interface/nav 发起请求, 得到最终的数据用于验证登录状态, 每个页面都会发起这个请求
                anti_login: {
                    _is_click: false,
                    _timeout_id: null,
                    // 第一次载入页面
                    _is_first_time: true,
                    // 自定义弹幕是否开启
                    _danmu_switch: GM_Objects.get_value('danmu_switch', false),
                    // 监听试看按钮的点击事件所导致的节点内容变化, 用于判断执行的进度
                    _monitor_trial(node) {
                        new MutationObserver((records) => {
                            let f = false;
                            for (const r of records) {
                                for (const node of r.addedNodes) {
                                    if (!this._is_click && this._trial_btn_click(node)) {
                                        f = true;
                                        break;
                                    } else if (this._is_click && this._check_switch_finished(node)) {
                                        this._is_click = false;
                                        f = true;
                                        this._timeout_id && clearTimeout(this._timeout_id);
                                        this._replay_video();
                                        break;
                                    }
                                }
                                if (f) break;
                            }
                        }).observe(node, { childList: true, subtree: true });
                        // 页面已经基本载入完成
                        setTimeout(() => (this._is_first_time = false), 1000);
                    },
                    // 超时不触发上面的事件监听则主动播放
                    _wait_switch() {
                        this._timeout_id = setTimeout(() => {
                            unsafeWindow.player.getQuality()?.newQ > 16 && this._replay_video();
                            this._timeout_id = null;
                        }, 5500);
                    },
                    // 判断视频是否已经切换到高清
                    _check_switch_finished(node) { return node.innerText?.includes('试用中'); },
                    _trial_btn_click(node) {
                        // 获得视频支持的清晰度
                        if (!unsafeWindow.player.getSupportedQualityList()?.some(e => e > 16)) {
                            this._replay_video();
                            return true;
                        }
                        this._wait_switch();
                        const b = node.getElementsByClassName('bpx-player-toast-confirm-login');
                        return this._is_click = b.length > 0 && b[0].innerHTML.includes('试看') ? (setTimeout(() => b[0]?.click(), 100), true) : false;
                    },
                    _replay_video() { setTimeout(() => unsafeWindow.player.play()); },
                    init() {
                        // 拦截弹窗和暂停视频播放的情况:
                        // 1. 没有任何操作
                        // 2. 点击了试用按钮 3. 点击了试用按钮, 同时全屏或者是进行其他扩屏的操作 4. 不点击试用按钮, 但是全屏了
                        // 需要多个层级拦截操作而不是单个点
                        const proxy = (target, target_name, handler) => (target[target_name] = new Proxy(target[target_name], handler)),
                            proxy_revocable = (target, target_name, handler) => Proxy.revocable(target[target_name], handler),
                            get_proxy = (target, target_name, proxy_obj) => (target[target_name] = proxy_obj.proxy),
                            restore_target = (target, target_name, origin_obj) => (target[target_name] = origin_obj);
                        [
                            // 干预settimeout, 试用高清是通过固定时间的计时器来实现超时,4000ms用于暂停和退出视频; 30000用于终止试用=== 4000 || time === 30000 || time  === 1500
                            [
                                unsafeWindow,
                                'setTimeout',
                                {
                                    apply(target, thisArg, argArray) {
                                        const [fn, time] = argArray;
                                        return target.apply(thisArg, [fn, [4000, 30000].includes(time) ? 1e8 : time]);
                                    }
                                }
                            ],
                            // 干预试用次数, 一天播放到一定次数就会不显示试用
                            [
                                Object,
                                'defineProperty',
                                {
                                    apply(target, thisArg, args) {
                                        let [obj, prop, descriptor] = args;
                                        if (prop === 'isViewToday' || prop === 'isVideoAble') {
                                            descriptor = {
                                                get: () => true,
                                                enumerable: false,
                                                configurable: true
                                            };
                                        }
                                        return Reflect.apply(target, thisArg, [obj, prop, descriptor]);
                                    }
                                }
                            ],
                            // 干预定时登录弹窗和暂停视频, 由于弹窗的计时不是通过固定的数值settimeout或者setinterval来实现的, 这里间接通过拦截相关html元素的创建来实现操作
                            // 这里不采用干预上述的api的登录状态请求来干预弹窗, 因为干预api的方式会导致页面出现非登录的小弹窗提醒
                            [
                                Node.prototype,
                                'appendChild',
                                {
                                    apply(target, thisArg, args) {
                                        const node = args[0];
                                        // 避免错误, 错误可能引发页面的崩溃, 执行这个添加的节点
                                        if (node.tagName?.toLowerCase() === 'script' && node.src.toLowerCase().includes('minilogin')) {
                                            node.src = '';
                                            setTimeout(() => unsafeWindow.player.play(), 100);
                                        }
                                        return target.apply(thisArg, args);
                                    }
                                }
                            ],
                            // 通过这种方式获得弹幕的开启关闭是由用户主动点击产生的
                            // 这种方式不需要通过监听点击事件来完成
                            [
                                localStorage,
                                'setItem',
                                {
                                    apply: (target, thisArg, args) => {
                                        // 这里才执行拦截操作, 是因为初始化页面时, B站会有初始化的数据写入, 这部分内容先不干预
                                        // 这里的拦截操作主要是后面用户主动打开或者关闭弹幕
                                        // 这样就是先了弹幕开关的持久化存储而不是每次都是关闭或者开启
                                        if (!this._is_first_time && args[0] === 'bpx_player_profile') {
                                            this._danmu_switch = JSON.parse(args[1])?.dmSetting?.dmSwitch || false;
                                            GM_Objects.set_value('danmu_switch', this._danmu_switch);
                                        }
                                        return Reflect.apply(target, thisArg, args);
                                    }
                                }
                            ]
                        ].forEach(e => proxy(...e));
                        // 可撤销代理创建, 以下函数只在首次载入页面时使用
                        [
                            // 每次重启浏览器后, 弹幕都默认开启, localstorage中的bpx_player_profile都会被修改, dmSwitch都会被设置为true
                            // B站重写了这个特性, 改成反复写入
                            [
                                localStorage,
                                'getItem',
                                (...args) => {
                                    if (args[3][0] === 'bpx_player_profile') {
                                        if (this._is_first_time) {
                                            // 先将数据读取, 然后再修改
                                            const json = JSON.parse(Reflect.apply(...args.slice(1)));
                                            // 注意数据为空的情况
                                            if (json?.dmSetting?.dmSwitch !== undefined) json.dmSetting.dmSwitch = this._danmu_switch;
                                            return JSON.stringify(json);
                                        } else {
                                            // 初始化页面完成之后, 撤销掉这里的代理
                                            args[0][2].revoke();
                                            restore_target(...args[0][1], args[0][0]);
                                        }
                                    }
                                    return Reflect.apply(...args.slice(1));
                                }
                            ],
                            // 由于需要精确监听节点的生成, 所以这里采用代理的方式来拦截某个插入节点的操作, 从而精确获得该节点生成的时间
                            [
                                HTMLElement.prototype,
                                'insertAdjacentElement',
                                (...args) => {
                                    let node = args[3][1];
                                    if (args[3][0] === 'afterbegin' && node.tagName === 'SPAN' && node.className === 'bpx-player-toast-confirm') {
                                        // 页面初始化完成, 撤销掉代理即可
                                        args[0][2].revoke();
                                        restore_target(...args[0][1], args[0][0]);
                                        // 必须采用回调的方式实现, 因为这个时候插入节点函数尚未执行, 所以当前插入的节点的父节点关系尚未创建
                                        setTimeout(() => {
                                            while (true) {
                                                let pnode = node.parentNode;
                                                if (!pnode) {
                                                    Colorful_Console.print('trial button monitor no target node', 'warning');
                                                    break;
                                                }
                                                if (pnode.className === 'bpx-player-toast-auto') {
                                                    // 先创建节点变化的监听
                                                    this._monitor_trial(pnode);
                                                    // 直接模拟点击, 而不是等待上面的节点监听触发, 因为创建监听时, 相对应的节点已经创建好了, 无法监听到
                                                    !this._is_click && this._trial_btn_click(pnode);
                                                    break;
                                                }
                                                node = pnode;
                                            }
                                        });
                                    }
                                    return Reflect.apply(...args.slice(1));
                                }
                            ]
                        ].forEach(e => {
                            const [target, target_name, handler] = e, args = [];
                            // 原对象方法
                            args.push(target[target_name]);
                            // 原对象和对象方法名称
                            args.push([target, target_name]);
                            // 可撤销代理对象
                            // 这里巧妙利用数组的引用是基于地址引用, 修改数组的内容, 引用的函数也同样发生变化
                            // 即实现, 函数需要引用一个函数创建的对象作为参数(先后问题, 即引用一个尚未初始化的变量作为参数, 数组的按地址引用实现了这个矛盾的问题)
                            args.push(proxy_revocable(target, target_name, { apply: handler.bind(this, args) }));
                            get_proxy(target, target_name, args[2]);
                        });
                    }
                },
                // 这里的时间不敏感
                main: () => setTimeout(() => {
                    if (this.#video_module_initial_flag) {
                        this.#video_instance.main(this.#indexeddb_instance);
                        Object.defineProperties(this.#video_instance, {
                            // 当监听到url发生改变, 清空缓存
                            // 因为存在多次重复请求数据, 所以需要保持这个缓存
                            url_has_changed: {
                                set: (_val) => (this.#request_data_cache = null),
                                get: () => null
                            },
                            add_related_video_flag: {
                                set: (val) => {
                                    if (val === 0) return;
                                    const cache = this.#request_data_cache;
                                    if (cache) {
                                        // 将视频的顺序打乱, 洗牌算法
                                        const shuffle_with_sort = (arr) => arr.sort(() => Math.random() - 0.5), sl = [2, 3, 5, 6][val - 2],
                                            tmp = shuffle_with_sort(cache.filter(e => e.bvid !== 'BV1P5411T71D')),
                                            data = tmp.length > sl ? tmp.slice(0, sl).map(e => Data_Switch.video_to_home(e)).filter(e => e) : null;
                                        data && this.#indexeddb_instance.add('rec_video_tb', data).then(() => Colorful_Console.print('add rec_video_tb successfully'));
                                    }
                                }, get: () => null
                            }
                        });
                    } else {
                        const bvid = Base_Info_Match.get_bvid(location.href);
                        this.#indexeddb_instance ? this.#configs.delete_data_by_bvid(bvid, false) : Dynamic_Variants_Manager.add_block_data_for_db(bvid, 'bvid');
                    }
                }, 2500)
            },
            // 首页
            _home_module: {
                _add_data_to_pocket: (data) => {
                    data && data.length > 0 && this.#indexeddb_instance.add(Indexed_DB.tb_name_dic.pocket, data).then(() => {
                        Colorful_Console.print('add pocket successfully');
                        Statics_Variant_Manager.watch_later.data = [];
                    });
                },
                _search_data_monitor() { GM_Objects.addvaluechangeistener('pocket', ((...args) => this._add_data_to_pocket(args[2])).bind(this)); },
                _load_database: () => {
                    // 每三天检查清除掉超过7天的旧数据
                    const { recommend, pocket } = Indexed_DB.tb_name_dic, t = GM_Objects.get_value('clear_database_time', 0),
                        n = Date.now(), d = 1000 * 24 * 60 * 60;
                    ((n - t) > 3 * d) && [recommend, pocket].forEach(e => this.#indexeddb_instance.batch_del_by_condition(e, (value, now, limit) => (now - value.add_time) > limit, [n, 7 * d]).then(() => {
                        Colorful_Console.print(`clear ${e} successfully`);
                        GM_Objects.set_value('clear_database_time', n);
                    }));
                    const block_data_db = GM_Objects.get_value('block_data_db', []);
                    if (block_data_db.length > 0) {
                        const { bvid, mid, key } = block_data_db.reduce((acc, cur) => {
                            if (acc[cur.type]) acc[cur.type].push(cur.data);
                            else acc[cur.type] = [cur.data];
                            return acc;
                        }, {});
                        key && this.#configs.delete_data_by_keyword([...new Set(key.reduce((acc, cur) => acc.concat(cur), []))], false);
                        bvid && this.#configs.delete_data_by_bvid(bvid, false);
                        mid && this.#configs.delete_data_by_mid(mid, false);
                        setTimeout(() => GM_Objects.set_value('block_data_db', []), 1500);
                    }
                    // 当登陆的时候获取up的动态更新
                    if (this.#user_is_login) {
                        // 每三个小时更新一次
                        const t = GM_Objects.get_value('dynamic_update_time', 0), n = Date.now();
                        ((n - t) > (3 * 60 * 60 * 1000)) && this.#web_request_instance.get_dynamic_data().then(results => {
                            const tmp = results?.data?.items?.filter(e => e.type === 'DYNAMIC_TYPE_AV')?.map(e => Data_Switch.dynamic_to_home(e))?.filter(e => e && !Dynamic_Variants_Manager.check_visited_video(e.bvid));
                            tmp && tmp.length > 0 && this.#indexeddb_instance.add(Indexed_DB.tb_name_dic.recommend, tmp).then(() => Colorful_Console.print('add up dynamic to rec_video_tb successfully'));
                            GM_Objects.set_value('dynamic_update_time', n);
                        });
                    }
                    this.#configs.get_mybili_data();
                },
                _time_module: {
                    /*
                    1. adapted from https://zyjacya-in-love.github.io/flipclock-webpage/#
                    2. html and css is adopted, and some codes have been reedited or cutted;
                    3. html和css代码采用上面的, 重写了js部分的代码, 原来的js太过于庞杂;
                    */
                    get formated_time() {
                        const time = this.date_format, info = {};
                        info.hour = time.h;
                        this.time_arr = [...time.string];
                        info.before = this.time_arr.map((e) => e === "0" ? "9" : (parseInt(e) - 1).toString());
                        return info;
                    },
                    time_arr: null,
                    create_module(className, value) {
                        return `
                            <li class=${className}>
                                <a href="#"
                                    ><div class="up">
                                        <div class="shadow"></div>
                                        <div class="inn">${value}</div>
                                    </div>
                                    <div class="down">
                                        <div class="shadow"></div>
                                        <div class="inn">${value}</div>
                                    </div></a
                                >
                            </li>`;
                    },
                    remove_classname(node) { node.className = ""; },
                    add_new_classname(node, newName) { node.className = newName; },
                    exe(clname, node, e, index) {
                        const ul = node.getElementsByClassName(clname)[0];
                        this.remove_classname(ul.firstElementChild);
                        this.add_new_classname(ul.lastElementChild, "flip-clock-before");
                        ul.insertAdjacentHTML("beforeend", this.create_module("flip-clock-active", e));
                        ul.firstElementChild.remove();
                        this.time_arr[index] = e;
                    },
                    f0(node, e, index) { this.exe("flip ahour", node, e, index); },
                    f1(node, e, index) { this.exe("flip bhour", node, e, index); },
                    f2(node, e, index) { this.exe("flip play aminute", node, e, index); },
                    firstRun: false,
                    f3(node, e, index) {
                        this.exe("flip play bminute", node, e, index);
                        this.firstRun = true;
                    },
                    change_time_status(node, value) {
                        node.getElementsByClassName("flip-clock-meridium")[0].getElementsByTagName("a")[0].innerText = value;
                        this.current_hour = value;
                    },
                    clock() {
                        const css = `
                            <style>
                                .clock {
                                    width: auto;
                                    zoom: 0.6;
                                }
                                .flip-clock-dot {
                                    background: #ccc;
                                }
                                .flip-clock-meridium a { color: #ccc; }
                                #box { display: table; }
                                #content {
                                    text-align: center;
                                    display: table-cell;
                                    vertical-align: middle;
                                }
                            </style>
                            <style>
                                .flip-clock-wrapper * {
                                    -webkit-box-sizing: border-box;
                                    -moz-box-sizing: border-box;
                                    -ms-box-sizing: border-box;
                                    -o-box-sizing: border-box;
                                    box-sizing: border-box;
                                    -webkit-backface-visibility: hidden;
                                    -moz-backface-visibility: hidden;
                                    -ms-backface-visibility: hidden;
                                    -o-backface-visibility: hidden;
                                    backface-visibility: hidden;
                                }
                                .flip-clock-wrapper a {
                                    cursor: pointer;
                                    text-decoration: none;
                                    color: #ccc;
                                }
                                .flip-clock-wrapper a:hover {
                                    color: #fff;
                                }
                                .flip-clock-wrapper ul {
                                    list-style: none;
                                }
                                .flip-clock-wrapper.clearfix:before,
                                .flip-clock-wrapper.clearfix:after {
                                    content: " ";
                                    display: table;
                                }
                                .flip-clock-wrapper.clearfix:after {
                                    clear: both;
                                }
                                .flip-clock-wrapper.clearfix {
                                    *zoom: 1;
                                } /* Main */
                                .flip-clock-wrapper {
                                    font: normal 11px "Helvetica Neue", Helvetica, sans-serif;
                                    -webkit-user-select: none;
                                }
                                .flip-clock-meridium {
                                    background: none !important;
                                    box-shadow: 0 0 0 !important;
                                    font-size: 36px !important;
                                }
                                .flip-clock-meridium a {
                                    color: #313333;
                                }
                                .flip-clock-wrapper {
                                    text-align: center;
                                    position: relative;
                                    width: 100%;
                                    margin: 1em;
                                }
                                .flip-clock-wrapper:before,
                                .flip-clock-wrapper:after {
                                    content: " "; /* 1 */
                                    display: table; /* 2 */
                                }
                                .flip-clock-wrapper:after {
                                    clear: both;
                                } /* Skeleton */
                                .flip-clock-wrapper ul {
                                    position: relative;
                                    float: left;
                                    margin: 5px;
                                    width: 60px;
                                    height: 90px;
                                    font-size: 80px;
                                    font-weight: bold;
                                    line-height: 87px;
                                    border-radius: 6px;
                                    background: #000;
                                }
                                .flip-clock-wrapper ul li {
                                    z-index: 1;
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    width: 100%;
                                    height: 100%;
                                    line-height: 87px;
                                    text-decoration: none !important;
                                }
                                .flip-clock-wrapper ul li:first-child {
                                    z-index: 2;
                                }
                                .flip-clock-wrapper ul li a {
                                    display: block;
                                    height: 100%;
                                    -webkit-perspective: 200px;
                                    -moz-perspective: 200px;
                                    perspective: 200px;
                                    margin: 0 !important;
                                    overflow: visible !important;
                                    cursor: default !important;
                                }
                                .flip-clock-wrapper ul li a div {
                                    z-index: 1;
                                    position: absolute;
                                    left: 0;
                                    width: 100%;
                                    height: 50%;
                                    font-size: 80px;
                                    overflow: hidden;
                                    outline: 1px solid transparent;
                                }
                                .flip-clock-wrapper ul li a div .shadow {
                                    position: absolute;
                                    width: 100%;
                                    height: 100%;
                                    z-index: 2;
                                }
                                .flip-clock-wrapper ul li a div.up {
                                    -webkit-transform-origin: 50% 100%;
                                    -moz-transform-origin: 50% 100%;
                                    -ms-transform-origin: 50% 100%;
                                    -o-transform-origin: 50% 100%;
                                    transform-origin: 50% 100%;
                                    top: -0.1px;
                                }
                                .flip-clock-wrapper ul li a div.up:after {
                                    content: "";
                                    position: absolute;
                                    top: 44px;
                                    left: 0;
                                    z-index: 5;
                                    width: 100%;
                                    height: 3px;
                                    background-color: #000;
                                    background-color: rgba(0, 0, 0, 0.4);
                                }
                                .flip-clock-wrapper ul li a div.down {
                                    -webkit-transform-origin: 50% 0;
                                    -moz-transform-origin: 50% 0;
                                    -ms-transform-origin: 50% 0;
                                    -o-transform-origin: 50% 0;
                                    transform-origin: 50% 0;
                                    bottom: 0;
                                    border-bottom-left-radius: 6px;
                                    border-bottom-right-radius: 6px;
                                }
                                .flip-clock-wrapper ul li a div div.inn {
                                    position: absolute;
                                    left: 0;
                                    z-index: 1;
                                    width: 100%;
                                    height: 200%;
                                    color: #ccc;
                                    text-shadow: 0 1px 2px #000;
                                    text-align: center;
                                    background-color: #333;
                                    border-radius: 6px;
                                    font-size: 70px;
                                }
                                .flip-clock-wrapper ul li a div.up div.inn {
                                    top: 0;
                                }
                                .flip-clock-wrapper ul li a div.down div.inn {
                                    bottom: 0;
                                } /* PLAY */
                                .flip-clock-wrapper ul.play li.flip-clock-before {
                                    z-index: 3;
                                }
                                .flip-clock-wrapper .flip {
                                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.7);
                                }
                                .flip-clock-wrapper ul.play li.flip-clock-active {
                                    -webkit-animation: asd 0.01s 0.49s linear both;
                                    -moz-animation: asd 0.01s 0.49s linear both;
                                    animation: asd 0.01s 0.49s linear both;
                                    z-index: 5;
                                }
                                .flip-clock-divider {
                                    float: left;
                                    display: inline-block;
                                    position: relative;
                                    width: 20px;
                                    height: 100px;
                                }
                                .flip-clock-divider:first-child {
                                    width: 0;
                                }
                                .flip-clock-dot {
                                    display: block;
                                    background: #323434;
                                    width: 10px;
                                    height: 10px;
                                    position: absolute;
                                    border-radius: 50%;
                                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
                                    left: 5px;
                                }
                                .flip-clock-divider .flip-clock-label {
                                    position: absolute;
                                    top: -1.5em;
                                    right: -86px;
                                    color: black;
                                    text-shadow: none;
                                }
                                .flip-clock-divider.minutes .flip-clock-label {
                                    right: -88px;
                                }
                                .flip-clock-divider.seconds .flip-clock-label {
                                    right: -91px;
                                }
                                .flip-clock-dot.top {
                                    top: 30px;
                                }
                                .flip-clock-dot.bottom {
                                    bottom: 30px;
                                }
                                @-webkit-keyframes asd {
                                    0% {
                                        z-index: 2;
                                    }
                                    100% {
                                        z-index: 4;
                                    }
                                }
                                @-moz-keyframes asd {
                                    0% {
                                        z-index: 2;
                                    }
                                    100% {
                                        z-index: 4;
                                    }
                                }
                                @-o-keyframes asd {
                                    0% {
                                        z-index: 2;
                                    }
                                    100% {
                                        z-index: 4;
                                    }
                                }
                                @keyframes asd {
                                    0% {
                                        z-index: 2;
                                    }
                                    100% {
                                        z-index: 4;
                                    }
                                }
                                .flip-clock-wrapper ul.play li.flip-clock-active .down {
                                    z-index: 2;
                                    -webkit-animation: turn 0.5s 0.5s linear both;
                                    -moz-animation: turn 0.5s 0.5s linear both;
                                    animation: turn 0.5s 0.5s linear both;
                                }
                                @-webkit-keyframes turn {
                                    0% {
                                        -webkit-transform: rotateX(90deg);
                                    }
                                    100% {
                                        -webkit-transform: rotateX(0deg);
                                    }
                                }
                                @-moz-keyframes turn {
                                    0% {
                                        -moz-transform: rotateX(90deg);
                                    }
                                    100% {
                                        -moz-transform: rotateX(0deg);
                                    }
                                }
                                @-o-keyframes turn {
                                    0% {
                                        -o-transform: rotateX(90deg);
                                    }
                                    100% {
                                        -o-transform: rotateX(0deg);
                                    }
                                }
                                @keyframes turn {
                                    0% {
                                        transform: rotateX(90deg);
                                    }
                                    100% {
                                        transform: rotateX(0deg);
                                    }
                                }
                                .flip-clock-wrapper ul.play li.flip-clock-before .up {
                                    z-index: 2;
                                    -webkit-animation: turn2 0.5s linear both;
                                    -moz-animation: turn2 0.5s linear both;
                                    animation: turn2 0.5s linear both;
                                }
                                @-webkit-keyframes turn2 {
                                    0% {
                                        -webkit-transform: rotateX(0deg);
                                    }
                                    100% {
                                        -webkit-transform: rotateX(-90deg);
                                    }
                                }
                                @-moz-keyframes turn2 {
                                    0% {
                                        -moz-transform: rotateX(0deg);
                                    }
                                    100% {
                                        -moz-transform: rotateX(-90deg);
                                    }
                                }
                                @-o-keyframes turn2 {
                                    0% {
                                        -o-transform: rotateX(0deg);
                                    }
                                    100% {
                                        -o-transform: rotateX(-90deg);
                                    }
                                }
                                @keyframes turn2 {
                                    0% {
                                        transform: rotateX(0deg);
                                    }
                                    100% {
                                        transform: rotateX(-90deg);
                                    }
                                }
                                .flip-clock-wrapper ul li.flip-clock-active {
                                    z-index: 3;
                                } /* SHADOW */
                                .flip-clock-wrapper ul.play li.flip-clock-before .up .shadow {
                                    background: -moz-linear-gradient(
                                        top,
                                        rgba(0, 0, 0, 0.1) 0%,
                                        black 100%
                                    );
                                    background: -webkit-gradient(
                                        linear,
                                        left top,
                                        left bottom,
                                        color-stop(0%, rgba(0, 0, 0, 0.1)),
                                        color-stop(100%, black)
                                    );
                                    background: linear, top, rgba(0, 0, 0, 0.1) 0%, black 100%;
                                    background: -o-linear-gradient(
                                        top,
                                        rgba(0, 0, 0, 0.1) 0%,
                                        black 100%
                                    );
                                    background: -ms-linear-gradient(
                                        top,
                                        rgba(0, 0, 0, 0.1) 0%,
                                        black 100%
                                    );
                                    background: linear, to bottom, rgba(0, 0, 0, 0.1) 0%, black 100%;
                                    -webkit-animation: show 0.5s linear both;
                                    -moz-animation: show 0.5s linear both;
                                    animation: show 0.5s linear both;
                                }
                                .flip-clock-wrapper ul.play li.flip-clock-active .up .shadow {
                                    background: -moz-linear-gradient(
                                        top,
                                        rgba(0, 0, 0, 0.1) 0%,
                                        black 100%
                                    );
                                    background: -webkit-gradient(
                                        linear,
                                        left top,
                                        left bottom,
                                        color-stop(0%, rgba(0, 0, 0, 0.1)),
                                        color-stop(100%, black)
                                    );
                                    background: linear, top, rgba(0, 0, 0, 0.1) 0%, black 100%;
                                    background: -o-linear-gradient(
                                        top,
                                        rgba(0, 0, 0, 0.1) 0%,
                                        black 100%
                                    );
                                    background: -ms-linear-gradient(
                                        top,
                                        rgba(0, 0, 0, 0.1) 0%,
                                        black 100%
                                    );
                                    background: linear, to bottom, rgba(0, 0, 0, 0.1) 0%, black 100%;
                                    -webkit-animation: hide 0.5s 0.3s linear both;
                                    -moz-animation: hide 0.5s 0.3s linear both;
                                    animation: hide 0.5s 0.3s linear both;
                                } /*DOWN*/
                                .flip-clock-wrapper ul.play li.flip-clock-before .down .shadow {
                                    background: -moz-linear-gradient(
                                        top,
                                        black 0%,
                                        rgba(0, 0, 0, 0.1) 100%
                                    );
                                    background: -webkit-gradient(
                                        linear,
                                        left top,
                                        left bottom,
                                        color-stop(0%, black),
                                        color-stop(100%, rgba(0, 0, 0, 0.1))
                                    );
                                    background: linear, top, black 0%, rgba(0, 0, 0, 0.1) 100%;
                                    background: -o-linear-gradient(
                                        top,
                                        black 0%,
                                        rgba(0, 0, 0, 0.1) 100%
                                    );
                                    background: -ms-linear-gradient(
                                        top,
                                        black 0%,
                                        rgba(0, 0, 0, 0.1) 100%
                                    );
                                    background: linear, to bottom, black 0%, rgba(0, 0, 0, 0.1) 100%;
                                    -webkit-animation: show 0.5s linear both;
                                    -moz-animation: show 0.5s linear both;
                                    animation: show 0.5s linear both;
                                }
                                .flip-clock-wrapper ul.play li.flip-clock-active .down .shadow {
                                    background: -moz-linear-gradient(
                                        top,
                                        black 0%,
                                        rgba(0, 0, 0, 0.1) 100%
                                    );
                                    background: -webkit-gradient(
                                        linear,
                                        left top,
                                        left bottom,
                                        color-stop(0%, black),
                                        color-stop(100%, rgba(0, 0, 0, 0.1))
                                    );
                                    background: linear, top, black 0%, rgba(0, 0, 0, 0.1) 100%;
                                    background: -o-linear-gradient(
                                        top,
                                        black 0%,
                                        rgba(0, 0, 0, 0.1) 100%
                                    );
                                    background: -ms-linear-gradient(
                                        top,
                                        black 0%,
                                        rgba(0, 0, 0, 0.1) 100%
                                    );
                                    background: linear, to bottom, black 0%, rgba(0, 0, 0, 0.1) 100%;
                                    -webkit-animation: hide 0.5s 0.3s linear both;
                                    -moz-animation: hide 0.5s 0.3s linear both;
                                    animation: hide 0.5s 0.2s linear both;
                                }
                                @-webkit-keyframes show {
                                    0% {
                                        opacity: 0;
                                    }
                                    100% {
                                        opacity: 1;
                                    }
                                }
                                @-moz-keyframes show {
                                    0% {
                                        opacity: 0;
                                    }
                                    100% {
                                        opacity: 1;
                                    }
                                }
                                @-o-keyframes show {
                                    0% {
                                        opacity: 0;
                                    }
                                    100% {
                                        opacity: 1;
                                    }
                                }
                                @keyframes show {
                                    0% {
                                        opacity: 0;
                                    }
                                    100% {
                                        opacity: 1;
                                    }
                                }
                                @-webkit-keyframes hide {
                                    0% {
                                        opacity: 1;
                                    }
                                    100% {
                                        opacity: 0;
                                    }
                                }
                                @-moz-keyframes hide {
                                    0% {
                                        opacity: 1;
                                    }
                                    100% {
                                        opacity: 0;
                                    }
                                }
                                @-o-keyframes hide {
                                    0% {
                                        opacity: 1;
                                    }
                                    100% {
                                        opacity: 0;
                                    }
                                }
                                @keyframes hide {
                                    0% {
                                        opacity: 1;
                                    }
                                    100% {
                                        opacity: 0;
                                    }
                                }
                            </style>`,
                            info = this.formated_time,
                            pref = "flip-clock-",
                            html = `
                        <div
                            id="clock_box"
                            style="
                                top: 3%;
                                width: 28%;
                                float: left;
                                left: 212px;
                                z-index: 1000;
                                position: fixed;
                            "
                        >
                            ${css}
                            <div id="content">
                                <div class="clock flip-clock-wrapper" id="flipclock">
                                    <span class="flip-clock-divider"
                                        ><span class="flip-clock-label"></span
                                        ><span class="flip-clock-dot top"></span
                                        ><span class="flip-clock-dot bottom"></span
                                    ></span>
                                    <ul class="flip ahour">${this.create_module(pref + "before", info.before[0])}${this.create_module(pref + "active", this.time_arr[0])}</ul>
                                    <ul class="flip bhour">${this.create_module(pref + "before", info.before[1])}${this.create_module(pref + "active", this.time_arr[1])}</ul>
                                    <span class="flip-clock-divider"
                                        ><span class="flip-clock-label"></span
                                        ><span class="flip-clock-dot top"></span
                                        ><span class="flip-clock-dot bottom"></span
                                    ></span>
                                    <ul class="flip play aminute">${this.create_module(pref + "before", info.before[2])}${this.create_module(pref + "active", this.time_arr[2])}</ul>
                                    <ul class="flip play bminute">${this.create_module(pref + "before", info.before[3])}${this.create_module(pref + "active", this.time_arr[3])}</ul>
                                    <ul class="flip-clock-meridium">
                                        <li><a href="#">${(this.current_hour = this.get_current_hour_status(info.hour))}</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>`;
                        document.getElementsByClassName('left-entry')[0]?.insertAdjacentHTML("beforeend", html);
                        this.create_event();
                    },
                    get_current_hour_status(hour) { return hour > 11 ? "PM" : "AM"; },
                    current_hour: "",
                    get date_format() {
                        const date = new Date(), h = date.getHours(), hs = "".slice.call(`0${h.toString()}`, -2), ms = "".slice.call(`0${date.getMinutes().toString()}`, -2);
                        return { h: h, string: hs + ms };
                    },
                    change(node) {
                        const time = this.date_format, ts = this.get_current_hour_status(time.h);
                        [...time.string].forEach((s, index) => s !== this.time_arr[index] && this["f" + index](node, s, index));
                        ts !== this.current_hour && this.change_time_status(node, ts);
                    },
                    get clock_box() { return document.getElementById("clock_box"); },
                    create_event() {
                        setTimeout(() => {
                            const clock = this.clock_box;
                            let id = setInterval(() => {
                                !this.paused && this.change(clock);
                                if (this.firstRun) {
                                    clearInterval(id);
                                    setInterval(() => !this.paused && this.change(clock), 60 * 1000);
                                }
                            }, 1000);
                        }, 0);
                    },
                    /**
                     * @param {boolean} e
                     */
                    set clock_paused(e) {
                        const box = this.clock_box;
                        box.style.display = e ? "none" : "block";
                        !e && this.change(box);
                        this.paused = e;
                    },
                    paused: false,
                    main() { this.clock(); },
                },
                _web_init: () => (this.#web_request_instance = new Web_Request(Web_Request.api_prefix)),
                _arr_init: () => {
                    this.#fill_home_videos = [];
                    this.#fill_home_videos.my_pop = () => {
                        this.#fill_home_videos.length === 0 && this.#configs.get_mybili_data();
                        return this.#fill_home_videos.pop();
                    };
                },
                _node_monitor: () => {
                    const node = document.getElementsByClassName("container is-version8"),
                        cnames = ['feed-card', 'bili-video-card'],
                        colors = [
                            ['', '#32CD32', '#006400'],
                            ['#F08080', '#FF0000', '#B22222'],
                            ['#1E90FF', '#4169E1', '#0000FF']
                        ];
                    node.length ? new MutationObserver((records) => {
                        for (const r of records) {
                            for (const n of r.addedNodes) {
                                if (n.nodeName === "DIV") {
                                    const cname = n.className || '';
                                    if (cnames.some(e => cname.startsWith(e))) {
                                        const h = n.getElementsByTagName("h3")[0];
                                        if (h) {
                                            const title = h.innerText;
                                            if (title) {
                                                // 需要注意节点的创建, 在开头的部分为, 从后到前开始, 其他的则从前到后, 所以不能直接使用数据
                                                const href = h.firstChild.href || '', item = this.#card_data.find((e) => href.includes(e[0]));
                                                if (item) {
                                                    const [_, r, v] = item, t = v > 0 ? `[H-${v}]` : r === 1 ? `[P]` : r === 2 ? '[R]' : null, c = colors[r][v];
                                                    if (t) h.title = t + title;
                                                    if (c) h.firstChild.style.color = c;
                                                }
                                            }
                                        };
                                        break;
                                        // 非开头部分会预先创建节点, 假如没有h则表示为空的节点
                                    }
                                }
                            }
                        }
                    }).observe(node[0], { childList: true }) : Colorful_Console.print("no container is-version8", "crash", true);
                },
                main() {
                    this._arr_init();
                    this._web_init();
                    this._node_monitor();
                    this._time_module.main();
                    setTimeout(() => {
                        this._add_data_to_pocket(Statics_Variant_Manager.watch_later.data);
                        this._load_database();
                        this._search_data_monitor();
                    }, 5000);
                }
            },
            /**
             * 配置执行函数
             * @param {number} id
             * @param {string} href
             * @returns {Array}
             */
            get_funcs(id, href, is_login = true) {
                const run_configs = {
                    _initial_data_intercept: { run_at: 0, run_in: Array.from({ length: 3 }, (_val, index) => index), type: 0, is_args: true },
                    _block_video_up_data_sync_monitor: { run_at: 1, run_in: Array.from({ length: 3 }, (_val, index) => index), type: 0 },
                    _initial_main: { run_at: 1, run_in: Array.from({ length: 3 }, (_val, index) => index), type: 0 },
                    _home_module: { run_at: 1, run_in: [0], type: 1 },
                    _search_module: { run_at: 1, run_in: [2], type: 0 },
                    _video_module: { run_at: 1, run_in: [1], type: 1 },
                    _space_module: { run_at: 1, run_in: [3], type: 1 },
                    _indexeddb_main: { run_at: 1, run_in: [0, 1], type: 0 }
                }, data = [];
                for (const k in run_configs) {
                    const { run_at, run_in, type, is_args } = run_configs[k];
                    if (run_in.includes(id)) {
                        const m = this[k];
                        let f = null;
                        if (k.endsWith('_module')) {
                            if (id === 1 && !is_login) {
                                const anti_login = m.anti_login,
                                    b = anti_login.init.bind(anti_login);
                                b.start = 0, b.type = 1;
                                data.push(b);
                            }
                            f = type ? m.main.bind(m) : m.main;
                            f.start = run_at, f.type = type;
                        } else {
                            f = is_args ? m.bind(type ? this : null, id, href) : type ? m.bind(this) : m;
                            f.start = run_at, f.type = type;
                        }
                        data.push(f);
                    }
                }
                return data;
            }
        };
        // 添加html元素模块
        #html_modules = {
            // 遮罩
            _shade: {
                run_in: Array.from({ length: Object.entries(this.#site_configs).length }, (_val, index) => index).filter(e => e !== 1),
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
                    const date = new Date(), h = date.getHours(), m = date.getMonth();
                    return h > 20
                        ? 0.55
                        : h < 7
                            ? 0.65
                            : h > 15
                                ? m > 9 && h > 16 ? 0.35 : h === 18
                                    ? 0.35
                                    : h === 19
                                        ? 0.45
                                        : h === 20
                                            ? 0.5
                                            : 0.3 : 0.15;
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
                    setTimeout(() => document.documentElement?.insertAdjacentHTML("afterbegin", html));
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
                const f = () => GM_Objects.registermenucommand('Support || Donation', Support_Me.main.bind(Support_Me));
                f.start = 1, f.type = 1;
                if (this._shade.run_in.includes(id)) {
                    this._shade.init();
                    const a = this._shade.main.bind(this._shade);
                    a.start = 1, a.type = 1;
                    return [a, f];
                }
                return [f];
            }
        };
        // 获取过滤配置
        #load_filter_configs(id) {
            // 预先检查数据是否满足要+求+
            if (id > 2) return;
            // 搜索页中的请求数据返回时已经带有标签, 需要清除掉
            const search_tag_clear = id == 2 ? Data_Switch.search_title_clear.bind(Data_Switch) : (title) => title,
                check_data = (val) => val ? val + '' : false;
            // 预检查数据是否满足要求
            this.#configs = {
                ...this.#configs,
                video_duration_limit: GM_Objects.get_value('video_duration_limit', 120),
                pre_data_check: (e) => {
                    const duration = e.duration;
                    // 过滤掉2分钟以下的视频
                    if (duration) {
                        const d = Data_Switch.duration_convertor(duration);
                        if (d < this.#configs.video_duration_limit) {
                            Colorful_Console.print(`${e.bvid}, less than ${this.#configs.video_duration_limit}s: ${d}s`);
                            return true;
                        }
                    }
                    // 读取基本的四个元素信息
                    const info = {
                        mid: parseInt(e.mid || e.owner?.mid || 0),
                        up_name: check_data(e.author || e.owner?.name),
                        title: check_data(e.title),
                        bvid: check_data(e.bvid)
                    };
                    for (const k in info) if (!info[k]) return true;
                    // 搜索页的title需要去掉多余的标签
                    info.title = search_tag_clear(info.title);
                    return Dynamic_Variants_Manager.completed_check(info);
                },
                // 填充没有数据的封面
                lost_pic: '//i2.hdslb.com/bfs/archive/1e198160b7c9552d3be37f825fbeef377c888450.jpg',
                // 有时并没有https开头
                interpose_api_prefix: Web_Request.api_prefix,
                // B站中每个页面都会发起的请求, 用于获取用户信息, 双重验证, 本地cookie & 服务器信息校检
                check_user_login_api: 'web-interface/nav',
                // 如何隐藏节点的方式
                hide_node: id == 1 ? (node) => (node.style.display = 'none') : (node) => (node.style.visibility = 'hidden'),
                add_data_to_node_dataset: (node, key, val) => (node.dataset[key] = val),
                get_target_node: (node) => {
                    let i = 0;
                    const target_name = this.#configs.target_class,
                        cfunc = this.#configs.contextmenu_handle;
                    while (i++ < 4) {
                        const clname = node.className;
                        if (clname && cfunc(clname, target_name)) return node;
                        node = node.parentNode;
                        if (!node) return null;
                    }
                    return null;
                },
                control_tips: (id, node) => {
                    Colorful_Console.print(`add ${id} to pocket`);
                    const p = this.#configs.get_target_node(node);
                    if (p) {
                        p.insertAdjacentHTML('afterbegin', this.#configs.tips_html);
                        setTimeout(() => {
                            const t = p.querySelector('.show_tips');
                            t && t.remove();
                        }, 3000);
                    } else Colorful_Console.print('can not find target node');
                },
                tips_html: '<div class="show_tips"><p> add to pocket successfully </p></div>',
                // 插入拦截信息, 此函数备用, 用于拦截了视频之后的处理, 假如不隐藏卡片, 就创建遮罩覆盖在上面
                insert_blocked_element: id == 1 ? (_node) => null : (node) => {
                    // css可以独立出来放置的css注入模块
                    const html = `
                    <div class="bili-video-cards blocked"
                        style="position: absolute;background-color: rgba(60, 60, 60, 0.85);display: flex;justify-content: center;align-items: center;z-index: 10;backdrop-filter: blur(6px);border-radius: 6px;height: 100%;width: 100%;">
                        <div style="color: rgb(250, 250, 250);">Blocked</div>
                    </div>`;
                    node.insertAdjacentHTML('afterbegin', html);
                },
                /**
                 * 删除缓存数据
                 * @param {string | Array} args
                 * @param {Function} func
                 */
                _dele_cache: (args, func, is_bvid = false) => {
                    const data = this.#request_data_cache || this.#initial_cache;
                    if (data) {
                        let f = false;
                        if (is_bvid) {
                            const i = data.findIndex((e) => func(e, args));
                            if (i >= 0) {
                                f = true;
                                data.splice(i, 1);
                            }
                        } else {
                            const remove_multi_elements = (arr, condition_fn, args) => {
                                let w = 0, l = arr.length;
                                for (let r = 0; r < l; r++) {
                                    if (!condition_fn(arr[r], args)) {
                                        arr[w] = arr[r];
                                        w++;
                                    } else Colorful_Console.print(r);
                                }
                                if (w !== l) {
                                    arr.length = w;
                                    f = true;
                                }
                            };
                            remove_multi_elements(data, func, args);
                        }
                        f && Colorful_Console.print(`delete data ${Array.isArray(args) ? args.join(';') : args} from cache`);
                    }
                },
                /**
                 * @param {string | Array} bvid
                 * @param {boolean} is_dele_cache
                 */
                delete_data_by_bvid: (bvid, is_dele_cache = true) => {
                    const is_array = Array.isArray(bvid);
                    if (this.#indexeddb_instance) {
                        const { recommend, pocket } = Indexed_DB.tb_name_dic;
                        [recommend, pocket].forEach(tb => this.#indexeddb_instance.delete(tb, bvid).then(() => Colorful_Console.print(`delete ${is_array ? bvid.join(';') : bvid} from ${tb}`)));
                    } else Statics_Variant_Manager.watch_later.remove(bvid);
                    is_dele_cache && this.#configs._dele_cache(bvid, is_array ? (e, data) => data.includes(e.bvid) : (e, bvid) => e.bvid === bvid, true);
                },
                /**
                 * @param {number | Array} mid
                 * @param {boolean} is_dele_cache
                 */
                delete_data_by_mid: (mid, is_dele_cache = true) => {
                    const is_array = Array.isArray(mid);
                    if (this.#indexeddb_instance) {
                        const { recommend, pocket } = Indexed_DB.tb_name_dic;
                        [recommend, pocket].forEach(tb => this.#indexeddb_instance.batch_del_by_condition(tb, is_array ? (value, data) => data.includes(value.owner.mid) : (value, mid) => value.owner.mid === mid, [mid])
                            .then((r) => r && Colorful_Console.print(`delete ${is_array ? mid.join(';') : mid} from ${tb}`)));
                    } else Statics_Variant_Manager.watch_later.remove(mid, 'mid');
                    is_dele_cache && this.#configs._dele_cache(mid, (e, mid) => (e.mid || e.owner?.mid) === mid);
                },
                /**
                 * @param {Array} keys
                 * @param {boolean} is_dele_cache
                 */
                delete_data_by_keyword: (keys, is_dele_cache = true) => {
                    if (this.#indexeddb_instance) {
                        const { recommend, pocket } = Indexed_DB.tb_name_dic;
                        [recommend, pocket].forEach(tb => this.#indexeddb_instance.batch_del_by_condition(tb, (value, keys) => {
                            const title = value.title, name = value.owner.name;
                            return keys.some(e => title.includes(e) || name.includes(e));
                        }, [keys]).then((r) => r && Colorful_Console.print(`delete blackkey from ${tb}`)));
                    } else {
                        Dynamic_Variants_Manager.add_block_data_for_db(keys, 'key');
                        Statics_Variant_Manager.watch_later.remove(keys, 'key');
                    }
                    is_dele_cache && this.#configs._dele_cache(keys, (e, keys) => {
                        const title = e.title, name = e.author || e.owner?.name || '';
                        return keys.some(e => title.includes(e) || name.includes(e));
                    });
                },
                /**
                 * 清理请求返回的数据
                 * @param {string|object} response_content
                 * @param {string} url
                 * @param {Function} func
                 * @returns {string|object}
                 */
                clear_request_data: (response_content, url, func) => {
                    // 需要注意搜索页和首页, 视频页之间的处理方式不一样
                    const is_string = typeof response_content === 'string';
                    if (is_string) response_content = JSON.parse(response_content);
                    if (response_content.code !== 0) {
                        Colorful_Console.print(`fail to request url: ${url}, code: ${response_content.code}`, 'debug', true);
                        if (is_string) response_content = null;
                    } else {
                        const spec = response_content.Spec;;
                        if (spec) clear_data(spec);
                        if (this.#configs.id === 1) func(response_content);
                        else {
                            const results = func(response_content);
                            results ? this.#configs.request_data_handler(results) : Colorful_Console.print('url no match rule: ' + url, 'debug');
                        }
                        if (is_string) response_content = JSON.stringify(response_content);
                    }
                    return response_content;
                },
                check_login_request: this.#user_is_login ? (_url) => false : (url) => url.endsWith(this.#configs.check_user_login_api),
                check_other_requets: this.#user_is_login ? (url) => {
                    const api_prefix = this.#configs.interpose_api_prefix, i = ['web-interface/archive/like', 'web-interface/coin/add', 'web-interface/archive/like/tripl'].findIndex(e => url.endsWith(api_prefix + e));
                    if (i < 0) return url.includes(api_prefix + 'web-show/res/locs?');
                    else this.#video_instance.key_rate_video(i + 1, false);
                } : (url) => url.includes(this.#configs.interpose_api_prefix + 'web-show/res/locs?'),
                fake_login_info: {
                    "code": 0,
                    "message": "0",
                    "ttl": 1,
                    "data": {
                        "isLogin": true,
                        "mid": 441644010,
                        "uname": "打着手电筒看书",
                        "face": "https://i0.hdslb.com/bfs/face/67ceb14021cfbc0b2a9e40b4b254b0a3be428b46.jpg",
                        "face_nft": 0,
                        "face_nft_type": 0,
                        "wbi_img": {
                            "img_url": "https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png",
                            "sub_url": "https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png"
                        }
                    }
                }
            };
        }
        /**
         * @param {string} href
         */
        constructor(href) {
            // 判断当前链接所处的站点
            const site = [
                'space',
                'search',
                'video',
                'play',
                'read',
                'history'
            ].find(e => href.includes(e)) || (href.endsWith('.com/') && href.includes('www.') ? 'home' : 'other');
            // 确定配置参数, 载入配置
            this.#configs = this.#site_configs[site];
            // 检查搜索链接是否包含垃圾
            if (this.#configs.check_search?.(href)) {
                confirm("hey, bro, don't waste your time on rubbish, close current page?") && GM_Objects.window_close();
                // 无法关闭浏览器的最后一个标签, 所以这里还需要拦截后续的操作
                Colorful_Console.print('you are accessing a rubbish page and the script will not run properly.', 'warning');
                return;
            }
            this.#user_is_login = document?.cookie?.split?.(';')?.find?.(item => item.includes('DedeUserID'))?.split?.('=')?.[1] ?? '' ? true : false;
            // 根据id生成配置
            const id = this.#configs.id;
            // 载入过滤模块的配置
            this.#load_filter_configs(id);
            // 检查用户是否登录
            // 注入css, 尽快执行
            this.#css_module.inject_css(id, this.#user_is_login);
            // 需要拦截动态数据管理模块的配置
            Terminal_Module.init(id);
            // 初始化动态数据管理模块
            Dynamic_Variants_Manager.init(id);
            // 配置启动函数
            // init, 表示该函数需要在html载入前执行
            // main, 表示该函数需要在html载入后执行
            // 本脚本中的所有上述两种函数均遵循此规则
            [
                [this.#proxy_module],
                [this.#page_modules, [href, this.#user_is_login]],
                [this.#event_module],
                [this.#html_modules]
            ].forEach(e => (e.length === 1 ? e[0].get_funcs(id) : e[0].get_funcs(id, ...e[1])).forEach(e => (e.start ? this.#end_load_funcs : this.#start_load_funcs).push(e)));
            // 复杂的部分放到pages_module中, 简单的函数放在配置中
            const ef = this.#configs.end_load_func, sf = this.#configs.start_load_func, c = Constants_URLs.main.bind(Constants_URLs), d = () => !Dynamic_Variants_Manager.show_status() && Colorful_Console.print('bili_optimizer has started');
            ef && this.#end_load_funcs.push(ef);
            sf && this.#start_load_funcs.push(sf);
            c.type = 1, d.type = 1;
            this.#end_load_funcs.push(c, d);
        }
        // 启动整个程序, 执行函数, type: 0, 使用当前optimizer整个对象的this; 1, 其他的自定义this
        async start() { ((exe) => (exe(this.#start_load_funcs), GM_Objects.window.onload = () => exe(this.#end_load_funcs)))((funcs) => funcs.forEach(e => e.type ? e() : e.call(this))); }
    }
    // 优化器主体 -----------

    // ----------------- 启动
    {
        const href = location.href, new_url = Bili_Optimizer.clear_track_tag(href);
        // 清除直接访问链接带有的追踪参数
        new_url.length < href.length ? (window.location.href = new_url) : (new Bili_Optimizer(new_url)).start();
    }
    // 启动 -----------------
})();
