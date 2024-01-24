// ==UserScript==
// @name         bili_bili_optimizer
// @namespace    https://github.com/Kyouichirou
// @version      1.1.6
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
// @grant        unsafeWindow
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
    // --------------- 通用函数
    const Notification = (content = "", title = "info", duration = 3500, cfunc, ofunc) => GM_notification({ text: content, title: title, timeout: duration, onclick: cfunc, ondone: ofunc, });

    const Colorful_Console = {
        _colors: {
            warning: "#F73E3E",
            debug: "#327662",
            info: "#1475b2",
        },
        main(content, type = 'info', mode = false) {
            let bc = this._colors[type];
            const title = bc ? type : (bc = this._colors.info, 'info');
            const params = [
                `%c ${title} %c ${content} `,
                "padding: 1px; border-radius: 3px 0 0 3px; color: #fff; font-size: 12px; background: #606060;",
                `padding: 1px; border-radius: 0 3px 3px 0; color: #fff; font-size: 12px; background: ${bc};`
            ];
            console.log(...params), mode && Notification(content, type);
        }
    };

    const Base_Info_Match = {
        // video id
        _video_id_reg: /[a-z\d]{10,}/i,
        // up uid, up的长度范围很广从1位数到16位数
        _up_id_reg: /(?<=com\/)\d+/,
        /**
         *
         * @param {RegExp} reg
         * @param {string} href
         * @returns {string}
         */
        _match(reg, href) {
            const ms = href.match(reg);
            return ms ? ms[0] : '';
        },
        /**
         *
         * @param {string} href
         * @returns {string}
         */
        get_video_id(href) { return this._match(this._video_id_reg, href); },
        /**
         *
         * @param {string} href
         * @returns {string}
         */
        get_up_id(href) { return this._match(this._up_id_reg, href); }
    };
    // 通用函数 -------------

    // ------------- 数据结构
    // 统一使用数组作为数据的载体
    class Dic_Array extends Array {
        #id_name;
        /**
         *
         * @param {Array} data
         * @param {string} id_name
         */
        constructor(data, id_name) {
            // 继承, 必须先调用父类, 才能使用this
            if (typeof data !== 'object') {
                super();
                return;
            }
            super(...data);
            this.#id_name = id_name;
        }
        /**
         *
         * @param {string} id
         * @returns {boolean}
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
         *
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
         *
         * @param {object} info
         */
        update_active_status(info) {
            const id = info.id;
            if (!id) return;
            const target = super.find(e => e[this.#id_name] === id);
            if (target) target.last_active_date = info.date, target.visited_times = info.visited_times;
        }
    }

    class Visited_Array extends Array {
        #limit = 999;
        /**
         * 限制存储的数据的上限, 假如不指定就默认999
         * @param {Array} data
         * @param {number} limit
         */
        constructor(data, limit) {
            if (typeof data !== 'object') {
                super();
                return;
            }
            super(...data);
            limit > 999 ? this.#limit = limit : null;
        }
        /**
         *
         * @param {string} id
         */
        push(id) {
            // 只允许存储限制范围内的数据长度, 默认长度1000
            // 超出范围, 则弹出数据
            // 假如存在数据, 则移动到第一位
            if (!id) return;
            const index = super.indexOf(id);
            // unshift, 返回拼接后的数组长度, 注意
            (index < 0 ? super.unshift(id) : index > 0 ? super.unshift(super.splice(index, 1)[0]) : super.length) > this.#limit && super.pop();
        }
    }
    // 由于基本结构基本类似, 直接继承上述的数组结构
    class Block_Video_Array extends Visited_Array {
        includes_r(id) { return (id && super.includes(id)) ? (Dynamic_Variants_Manager.accumulative_func(), true) : false; }
        remove(id) {
            const index = super.indexOf(id);
            return index > -1 && (super.splice(index, 1), true);
        }
    }

    function includes_r(mode, id_name = 'video_id') {
        // 额外增加的数组函数, 用于在执行数据是否存在的时候, 同时记录下这次的操作
        // 不能使用箭头函数这里, 在为对象增加一个新的函数, 而需要this指向这个对象自身
        const f = mode ? (val) => this.includes(val) && `block ${id_name}: ${val}` : (val) => {
            const r = this.find(e => val.includes(e));
            return r ? `block ${val}, target: ${r}` : false;
        };
        return (val) => {
            const r = val && f(val.replaceAll(' ', '').toLowerCase());
            return r ? (Colorful_Console.main(r), Dynamic_Variants_Manager.accumulative_func(), true) : false;
        };
    }
    // 数据结构 ------------

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
                '\u817e\u8baf',
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
                '\u4e2d\u56fd\u4eba',
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
                '\u7409\u7483',
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
                '\u7ed3\u5a5a',
                '\u6027\u4fb5',
                '\u5bcc\u5a46',
                '\u975e\u4f60\u83ab\u5c5e',
                '\u6700\u6e29\u67d4',
                '\u6000\u5b55',
                '\u7eff\u8336',
                '\u8428\u9876\u9876',
                '\u6d4e\u516c',
                '\u534e\u6668\u5b87',
                '\u4e0a\u6d77\u5821\u5792',
                '\u90ed\u656c\u660e',
                '\u6bd5\u4e1a\u5b63',
                '\u9ec4\u6653\u660e'
            ],
            /**
             *
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
                // 注意这里, 需要重新添加函数
                this.a.includes_r = includes_r.call(this.a, false);
            },
            /**
             *
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
            _write_data(data) { GM_setValue('black_keys', data), Colorful_Console.main('update black keys'); },
            _get_data() { return GM_getValue('black_keys'); },
            _main() {
                const c = this._get_data();
                c && c.forEach(e => this.a.push(e));
            }
        },
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
        accumulative_total: GM_getValue('accumulative_total') || 0,
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
                this.cache_block_ups.push(up_id);
                return true;
            }
            return false;
        },
        unblock_video(video_id) { this.block_videos.remove(video_id) && (GM_setValue('block_videos', this.block_videos), this.up_video_sync('unblock', 'video', video_id)); },
        block_video(video_id) { this.block_videos.push(video_id), GM_setValue('block_videos', this.block_videos), this.up_video_sync('block', 'video', video_id), Colorful_Console.main('update block video info'); },
        // 视频和up, 拦截或者取消数据同步
        up_video_sync(s_type, s_name, s_value) { GM_setValue('up_video_sync', { type: s_type, name: s_name, value: s_value }); },
        // 评分, 拦截up的数据部分更新同步
        _status_info: null,
        rate_up_status_sync(s_type, id, date, times) { GM_setValue('up_rate_status_sync', { type: s_type, value: { id: id, date: date, times: times } }), this._status_info = s_type; },
        // 评分和访问数据同步
        rate_visited_data_sync(data) { GM_setValue(typeof data === 'string' ? 'visited_video_sync' : 'rate_video_sync', data); },
        accumulative_func() { GM_setValue('accumulative_total', ++this.accumulative_total); },
        // 初始化视频评分数据
        init_rate_videos() {
            const o = new Dic_Array(GM_getValue('rate_videos') || [], 'video_id');
            o.check_rate = function (id) { return this.includes_r(id, true)?.rate || 0; };
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
        init_block_ups: () => new Dic_Array(GM_getValue('block_ups') || [], 'up_id'),
        // 初始化历史访问数据
        init_visited_videos: () => new Visited_Array(GM_getValue('visited_videos') || [], 2000),
        // up, 评分, 状态更新写入, 这部分是相对影响性能的, 当数据累积到一定数量才写入, 或者定时写入
        _rate_up_status_write_monitor() {
            let up_times = 0, rate_times = 0, tmp = null;
            const write_data = (mode = false) => {
                const i = mode ? 1 : 5;
                const x = up_times > i ? rate_times > i ? 3 : 1 : rate_times > i ? 2 : 0;
                switch (x) {
                    case 3:
                        GM_setValue('block_ups', this.block_ups);
                        GM_setValue('rate_videos', this.rate_videos);
                        up_times = 0, rate_times = 0;
                        break;
                    case 2:
                        GM_setValue('rate_videos', this.rate_videos);
                        rate_times = 0;
                        break;
                    case 1:
                        GM_setValue('block_ups', this.block_ups);
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
            setInterval(() => write_data(true), 5000);
        },
        up_video_data_sync_info: null,
        // 数据同步监听
        _data_sync_monitor(site_id) {
            const configs = {
                ccumulative_total: {
                    run_in: Array.from({ length: 5 }, (_val, index) => index),
                    f: (...args) => args[3] && this.accumulative_total++
                },
                visited_video_sync: {
                    run_in: [2],
                    f: (...args) => args[3] && this.visited_videos.push(args[2])
                },
                rate_video_sync: {
                    run_in: [2],
                    f: (...args) => {
                        if (args[3]) {
                            const data = args[2];
                            data.type === 'remove' ? this.rate_videos.remove(data.value.video_id) : this.rate_videos.add(data.value);
                        }
                    }
                },
                up_video_sync: {
                    run_in: Array.from({ length: 3 }, (_val, index) => index),
                    f: (...args) => {
                        if (args[3]) {
                            // {type: "block", value: {up_id: 123}}
                            const data = args[2];
                            if (data.type === 'block') {
                                data.name === 'video' ? this.block_videos.push(data.value.video_id) : this.block_ups.push(data.value);
                                this.up_video_data_sync_info = data;
                            } else data.name === 'video' ? this.block_videos.remove(data.value.video_id) : this.block_ups.remove(data.value.up_id);
                        }
                    }
                },
                up_rate_status_sync: {
                    run_in: Array.from({ length: 3 }, (_val, index) => index),
                    f: (...args) => {
                        if (args[3]) {
                            const data = args[2];
                            (data.type === 'up' ? this.block_ups : this.rate_videos).update_active_status(data.value);
                        }
                    }
                }
            };
            for (const k in configs) {
                const item = configs[k];
                item.run_in.includes(site_id) && GM_addValueChangeListener(k, item.f.bind(this));
            }
        },
        // 数据初始化
        show_status: () => null,
        data_init(site_id) {
            // 全局启用, 关键词过滤
            this.black_keys._main();
            this.black_keys.a.includes_r = includes_r.call(this.black_keys.a, false), this.black_keys.b.includes_r = includes_r.call(this.black_keys.b, false);
            if (site_id > 2) return;
            this.cache_block_ups = [], this.cache_block_ups.includes_r = includes_r.call(this.cache_block_ups, true, 'up_id');
            this.cache_block_videos = [], this.cache_block_videos.includes_r = includes_r.call(this.cache_block_videos, true);
            this.block_ups = this.init_block_ups();
            this.block_videos = new Block_Video_Array(GM_getValue('block_videos') || [], 0);
            // 仅在搜索的页面启用, 播放页不需要
            if (site_id === 2) this.rate_videos = this.init_rate_videos(), this.visited_videos = this.init_visited_videos();
            this._data_sync_monitor(site_id);
            this._rate_up_status_write_monitor();
            this.show_status = this._show_data_status;
        },
        _show_data_status() {
            const s = 'bilibili_optimizer_detail:';
            Colorful_Console.main(s);
            const details = [];
            details.push('-'.repeat((s.length + 4) * 2));
            details.push('blocked: ' + this.accumulative_total + ';');
            [
                [this.block_ups, 'block_ups'],
                [this.block_videos, 'block_videos'],
                [this.black_keys.a, 'a_black_keys'],
                [this.black_keys.b, 'b_black_keys']
            ].forEach(e => details.push(e[1] + ': ' + e[0].length + ";"));
            const i = GM_getValue('install_date') || 0;
            i === 0 ? GM_setValue('install_date', Date.now()) : details.push('install_date: ' + new Date(i).toDateString() + ';');
            const script = GM_info.script;
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
            _info_write(data, mode = false) { GM_setValue('block_ups', data), Colorful_Console.main('update_up_info', 'info', mode); },
            /**
             *
             * @param {string} up_id
             * @returns {void}
             */
            unblock(up_id) {
                const data = this._data;
                data.remove(up_id) && (this._info_write(data), Dynamic_Variants_Manager.up_video_sync('unblock', 'up', up_id));
            },
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
             *
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
            _info_write(data) { GM_setValue('rate_videos', data), Colorful_Console.main('update_rate_video_info'); }
        },
        /**
         * 历史访问, 只有添加, 没有删除
         * @param {string} video_id
         */
        add_visited_video(video_id) {
            const arr = Dynamic_Variants_Manager.init_visited_videos();
            arr.push(video_id);
            GM_setValue('visited_videos', arr);
            Dynamic_Variants_Manager.rate_visited_data_sync(video_id);
            Colorful_Console.main('play record has been writed');
        },
    };
    // 静态数据管理 ---------

    // --------- 视频控制模块
    class Video_Module {
        // 菜单控制速度
        #is_first = true;
        #video_speed = 2;
        // 视频元素
        #video = null;
        // 历史访问settimeout id
        #record_id = null;
        // 视频基本信息
        #video_info = {
            video_id: '',
            video_title: '',
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
            this.#video_info.video_title = document.getElementsByTagName('h1')[0].title.trim();
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
            if (0 < this.#video_speed < 5) this.#video.playbackRate = this.#video_speed, this.#is_first = this.#video_speed < 2;
        }
        #auto_light = {
            _light_off: false,
            _mode: GM_getValue('auto_light') || 0,
            _names: ['auto_light_off', 'always_light_off', 'disable_light_off'],
            _mid: null,
            _create_menus() { this._mid = GM_registerMenuCommand(this._names[this._mode === 2 ? 0 : this._mode + 1], this._func.bind(this)); },
            _func() {
                this._mid && GM_unregisterMenuCommand(this._mid);
                this._mode === 2 ? (this._mode = 0) : ++this._mode;
                if (this._mode !== 0) this._light_off = this._mode === 1;
                GM_setValue('auto_light', this._mode);
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
        #regist_menus_command() { [['speedup', true], ['slow', false]].forEach(e => GM_registerMenuCommand(e[0], this.#speed_control.bind(this, e[1]))); }
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
            // 数据发生变化
            // 0 菜单
            // 1 3分
            // 2 4分
            // 3 5分
            // 4 remove, 从评分中将数据移除掉
            // 5 block, 拦截视频
            // 6 unblock, 不拦截视频
            setTimeout(() => {
                const add_rate = (val) => {
                    const video_info = this.#video_info;
                    const id = video_info.video_id;
                    if (!id) {
                        Colorful_Console.main('fail to get up_id', 'warning', true);
                        return false;
                    }
                    const now = Date.now();
                    const info = {
                        // 视频评分
                        video_id: id,
                        video_title: video_info.video_title,
                        up_id: video_info.up_id,
                        last_active_date: now,
                        visited_times: 1,
                        add_date: now,
                        rate: val
                    };
                    Statics_Variant_Manager.rate_video_part.add(info);
                    return true;
                };
                const node = document.getElementById('selectWrap');
                const h = node.getElementsByTagName('h2')[0];
                const select = node.getElementsByTagName('select')[0];
                select.onchange = (e) => {
                    let i = parseInt(e.target.value), title = '';
                    if (i > 0 && i < 4) {
                        // 添加评分信息后, 从拦截的视频将数据移除掉
                        i = + 2;
                        if (add_rate(i)) title = 'Rate: ' + i;
                        Dynamic_Variants_Manager.unblock_video(this.#video_info.video_id);
                    } else if (i === 4) Statics_Variant_Manager.rate_video_part.remove(this.#video_info.video_id);
                    else if (i === 5) {
                        title = 'Blocked';
                        // 执行拦截后, 删除掉评分的信息
                        Dynamic_Variants_Manager.block_video(this.#video_info.video_id), Statics_Variant_Manager.rate_video_part.remove(this.#video_info.video_id);
                    } else if (i === 6) Dynamic_Variants_Manager.unblock_video(this.#video_info.video_id);
                    h.innerText = title;
                };
                this.#monitor_video_change(select, h);
            }, 300);
        }
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
                        line-height: 36px;
                        text-align: right;
                        font-size: 14px;
                    }
                    .select_wrap dd {
                        margin-left: 56px;
                        line-height: 36px;
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
                <h2 style="margin-left: 8%;">${status}</h2>
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
            // 注意Object.defineProperty无法拦截私有属性的操作
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
            // 判断浏览器是否支持这个feature
            if (window.onurlchange === null) {
                window.addEventListener('urlchange', (info) => {
                    setTimeout(() => {
                        const video_id = Base_Info_Match.get_video_id(info.url);
                        if (video_id === this.#video_info.video_id) return;
                        this.video_change_id = video_id;
                        this.#load_video_info();
                        this.#visited_record();
                    }, 500);
                });
                return true;
            } else Colorful_Console.main('browser does not support url_change event, please update browser', 'warning', true);
        }
        #click_target(classname) { document.getElementsByClassName(classname)[0]?.click(); }
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
            }
        }
    }
    // 视频控制模块 ---------

    // ----------- 优化器主体
    class Bili_Optimizer {
        // 配置
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
                    if (!info.video_id && data.arcurl?.includes('/cheese')) return true;
                    return Dynamic_Variants_Manager.completed_check(info);
                },
                // 读取目标元素的视频标题和up的名称
                get_title_up_name(node, info) {
                    info.video_title = node.getElementsByTagName('h3')[0]?.title.trim() || '';
                    info.up_name = node.getElementsByClassName('bili-video-card__info--author')[0]?.innerText.trim() || '';
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
                    if (!info.video_id && data.arcurl?.includes('/cheese')) return true;
                    return Dynamic_Variants_Manager.completed_check(info);
                },
                get_title_up_name(node, info) { [['video_title', 'title'], ['up_name', 'name']].forEach(e => (info[e[0]] = node.getElementsByClassName(e[1])[0]?.innerText.trim() || '')); },
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
                    if (!info.video_id && data.arcurl?.includes('/cheese')) return true;
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
                    'video_title': '',
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
                return i > 1 ? null : (['up_name', 'video_title'].forEach(e => (info[e] = info[e].toLowerCase())), info);
            },
            /**
             * 将拦截对象的数据设置为空
             * @param {object} data
             */
            clear_data(data) {
                // 递归调用, 遍历各层级的内容
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
            _run_configs: {
                _disable_body_contextmenu_event: { run_at: 0, run_in: Array.from({ length: 5 }, (_val, index) => index), type: 1 },
                _fetch: { run_at: 0, run_in: Array.from({ length: 3 }, (_val, index) => index), type: 0 },
                _search_box_clear: { run_at: 0, run_in: [0, 1, 3, 4, 5], type: 1 },
                _addeventlistener: { run_at: 0, run_in: [2], type: 1 },
                _setattribute: { run_at: 1, run_in: [1], type: 1 },
                _history_replacestate: { run_at: 0, run_in: [1, 5], type: 1 },
                _history_pushstate: { run_at: 1, run_in: [1, 5], type: 1 }
            },
            // 代理
            __proxy(target, name, handle) { target[name] = new Proxy(target[name], handle); },
            // 在视频播放页面, 当视频被加载完成, 会载入url追踪参数
            _history_replacestate() {
                this.__proxy(unsafeWindow.history, 'replaceState', {
                    apply(...args) {
                        const a = args[2]?.[2];
                        !(a && ['vd_source=', 'spm_id_from'].some(e => a.includes(e))) && Reflect.apply(...args);
                    }
                });
            },
            // 当点击右侧的视频, 更新历史url会添加追踪参数, from_spmid
            _history_pushstate() {
                this.__proxy(unsafeWindow.history, 'pushState', {
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
            // handleDocumentInitActive, 这个点击函数会导致url被添加追踪参数
            _addeventlistener() { this.__proxy(document, 'addEventListener', { apply(...args) { !(args.length === 3 && args[2][0] === 'click' && args[2][1]?.name === 'handleDocumentInitActive') && Reflect.apply(...args); } }); },
            // 干预页面进行的href添加追踪参数的操作
            // 由于当前页面的元素已经添加了追踪参数, 所以拦截的操作可以在这里启动, 而不是在页面刚加载的时候启动
            _setattribute() { this.__proxy(HTMLAnchorElement.prototype, 'setAttribute', { apply(...args) { args.length === 3 && args[2]?.length === 2 && args[2][0] === 'href' && (args[2][1] = args[2][1].split('?spm_id_from')[0]), Reflect.apply(...args); } }); },
            // 拦截document.body的菜单事件
            // 由于事件是由于document.body所创建, 通过window/document无法直接拦截到
            // 但是document.body要等待body元素的载入, 需要监听body载入的事件颇为麻烦(无法准确及时进行)
            // 通过原型链就可以精确执行拦截的操作
            _disable_body_contextmenu_event() { this.__proxy(HTMLBodyElement.prototype, 'addEventListener', { apply(...args) { (args.length !== 3 || args[2]?.[0] !== 'contextmenu') && Reflect.apply(...args); } }); },
            // 顶部检索框点击, 回车, 操作方式均为window.open(url), 只需要拦截这个函数就可以拦截所有的这些操作
            _search_box_clear() {
                this.__proxy(unsafeWindow, 'open', {
                    apply(...args) {
                        const url = args[2]?.[0]?.split('&')[0] || '';
                        if (url) {
                            if (Dynamic_Variants_Manager.key_check(decodeURIComponent(url))) {
                                Colorful_Console.main('search content contain black key', 'warning', true);
                                return;
                            } else args[2][0] = url;
                        }
                        Reflect.apply(...args);
                    }
                });
            },
            // 拦截fetch的返回结果
            _fetch: () => {
                // 填充拦截之后的空白图片
                const lost_pic = '//i2.hdslb.com/bfs/archive/1e198160b7c9552d3be37f825fbeef377c888450.jpg';
                const trap = (func) => {
                    func = async (...args) => {
                        const [url, config] = args;
                        const response = await fetch(url, config);
                        // 根据配置的函数, 决定是否需要干预返回的结果
                        const hfu = this.#configs.handle_fetch_url(url);
                        // response, 只允许访问一次, clone一份, 在复制上进行操作
                        // 然后拦截json函数的返回内容, 从而实现对返回结果的拦截
                        if (hfu) response.json = () => response.clone().json().then((data) => {
                            const results = hfu(data), hdf = this.#configs.handle_data_func;
                            results ? results.forEach(e => hdf(e) && (this.#utilities_module.clear_data(e), (e.pic = lost_pic))) : Colorful_Console.main('url no match rule: ' + url, 'debug');
                            return data;
                        });
                        return response;
                    };
                    return func;
                };
                // B站的fetch进行了bind(window)的操作, 需要设置陷阱函数拦截这个操作
                Function.prototype.bind = new Proxy(Function.prototype.bind, {
                    apply: (...args) => {
                        if (args.length > 1) {
                            const fn = args[1];
                            if (fn.name === 'fetch') args[1] = trap(fn);
                        }
                        return Reflect.apply(...args);
                    }
                });
            },
            /**
             *
             * @param {number} id
             * @returns {Array}
             */
            get_funcs(id) {
                const arr = [];
                for (const k in this._run_configs) {
                    const c = this._run_configs[k];
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
            shade: {
                run_in: Array.from({ length: 6 }, (_val, index) => index).filter(e => e !== 1),
                colors: {
                    yellow: "rgb(247, 232, 176)",
                    green: "rgb(202 ,232, 207)",
                    grey: "rgb(182, 182, 182)",
                    olive: "rgb(207, 230, 161)",
                },
                current_color: '',
                current_opacity: 0,
                shade_id: 'screen_shade_cover',
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
                get shade_node() { return document.getElementById(this.shade_id); },
                /**
                 * 创建遮罩
                 * @param {string} color
                 * @param {number} opacity
                 */
                create_cover(color, opacity = 0.5) {
                    const html = `
                        <div
                            id="${this.shade_id}"
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
                    document.documentElement.insertAdjacentHTML("afterbegin", html);
                },
                set_color(color, mode = true) {
                    if (this.current_color === color) return;
                    this.change_color(color);
                    this.current_color = color;
                    mode && GM_setValue('shade_color', color);
                },
                change_color(color) { this.shade_node.style.background = color; },
                change_opacity(opacity) {
                    if (this.current_opacity !== opacity) return;
                    this.current_opacity = opacity;
                    this.shade_node.style.opacity = opacity;
                },
                main() {
                    this.current_color = GM_getValue('shade_color') || this.colors.yellow;
                    this.current_opacity = this.opacity;
                    GM_setValue('shade_opacity', this.current_opacity);
                    this.create_cover(this.current_color, this.current_opacity);
                    const uppercase = (e) => e.slice(0, 1).toUpperCase() + e.slice(1);
                    Object.keys(this.colors).forEach((e, index) =>
                        GM_registerMenuCommand(
                            uppercase(e),
                            this.set_color.bind(this, e),
                            e.slice(0, 1) + index
                        )
                    );
                    GM_addValueChangeListener('shade_color', (...args) => args[3] && this.set_color(args[2], false));
                    GM_addValueChangeListener('shade_opacity', (...args) => args[3] && this.change_opacity(args[2]));
                }
            },
            inject_css(id) {
                const arr = [];
                for (const k in this) {
                    const c = this[k];
                    c.run_in?.includes(id) ? k.startsWith('_') ? arr.push(c.css) : c.main() : null;
                }
                arr.length > 0 && GM_addStyle(arr.join(''));
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
                                    info.video_id && (shift ? Dynamic_Variants_Manager.block_video(info.video_id) : Dynamic_Variants_Manager.cache_block_videos.push(info.video_id));
                                }
                                break;
                            }
                            if (++i > 6) break;
                        }
                    } catch (error) {
                        console.log(error);
                        Notification('some error cause on menus event', 'warning');
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
                                    if (p.target === '_blank') GM_openInTab(href, { insert: 1, active: true });
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
                const search = {
                    /**
                     *
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
                            s && (Dynamic_Variants_Manager.key_check(s) === 0 ? GM_openInTab(this._protocols + url + encodeURIComponent(s), { insert: true, activate: true }) : Colorful_Console.main('search content contain black key', 'warning', true));
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
                                const { video_title, up_name } = info;
                                (!info.is_video || data.some(e => video_title.includes(e) || up_name.includes(e))) && this.#configs.hide_node(node);
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
                // 文本标签, 需要排除输入
                const text_tags = ["textarea", "input"];
                document.addEventListener('keydown', (event) => {
                    if (event.shiftKey || event.ctrlKey) return;
                    const target = event.target;
                    const localName = target.localName || '';
                    if (text_tags.includes(localName)) return;
                    const className = target.className || '';
                    if (className && className.includes("editor")) return;
                    const key = event.key;
                    const id = this.#configs.id;
                    search.main(key) ? null : this.#video_module_init_flag ? video_control.main(key) : (id === 0 || id === 2) && manage_black_key.main(key);
                });
            },
            /**
             * 配置执行函数
             * @param {number} id
             * @returns Array
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
                            const now = Date.now();
                            const info = {
                                // 拦截up
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
                    const title = document.title;
                    const up_name = title.split('的个人空间')[0];
                    if (up_name === 'undefined' || up_name.length === title.length) return;
                    const up_id = Base_Info_Match.get_up_id(location.href);
                    if (up_id) {
                        const mode = Statics_Variant_Manager.up_part.check(up_id);
                        this._create_event(this._create_button(mode), mode, up_id, up_name);
                    }
                }
            },
            // 搜索页面
            _search_module: {
                init: (href) => {
                    // B站页面改变, 非all首次访问的数据也被整合到html
                    if (!['com/video', 'com/all'].some(e => href.includes(e))) return;
                    let init_data = null;
                    Object.defineProperty(unsafeWindow, '__pinia', {
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
                    Colorful_Console.main('data maintenance has started', 'info', true), GM_setValue('maintain', true);
                    const data = GM_getValue('block_ups') || [];
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
                        tmp.length < data.length && GM_setValue('block_ups', tmp);
                    }
                    GM_setValue('maintain', false), Colorful_Console.main('data maintenance has been completed', 'info', true);
                },
                main() { GM_registerMenuCommand('maintain', this._maintain.bind(this)); }
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
        /**
         *
         * @param {string} href
         */
        constructor(href) {
            // 确定配置参数
            const site = ['search', 'space', 'video', 'play'].find(e => href.includes(e)) || (href.endsWith('.com/') && href.includes('www.') ? 'home' : 'other');
            this.#configs = this.#site_configs[site];
            this.#configs['api_suffix'] && (this.#configs['api_prefix'] = 'https://api.bilibili.com/x/web-interface/' + this.#configs['api_suffix']);
            // 载入配置
            const id = this.#configs.id;
            // 注入css, 尽快执行
            this.#css_module.inject_css(id);
            // 初始化动态数据管理模块
            Dynamic_Variants_Manager.data_init(id);
            // 配置启动函数
            [[this.#proxy_module], [this.#page_modules, href], [this.#event_module]].forEach(e => (e.length === 1 ? e[0].get_funcs(id) : e[0].get_funcs(id, e[1])).forEach(e => (e.start ? this.#end_load_funcs : this.#start_load_funcs).push(e)));
        }
        /**
         * 执行函数
         * @param {Array} funcs
         */
        #load_func(funcs) { funcs.forEach(e => e.type ? e() : e.call(this)); }
        // 启动整个程序
        start() { this.#load_func(this.#start_load_funcs), unsafeWindow.onload = () => (this.#load_func(this.#end_load_funcs), !Dynamic_Variants_Manager.show_status() && Colorful_Console.main('bili_optimizer has started')); }
    }
    // 优化器主体 -----------

    // ----------------- 启动
    {
        // 假如数据处于维护中, 就不执行脚本
        if (GM_getValue('maintain')) Colorful_Console.main('data under maintenance, wait a moment', 'warning', true);
        else {
            const { href, search, origin, pathname } = location;
            // 清除直接访问链接的追踪参数
            search.startsWith('?spm_id_from') ? (window.location.href = origin + pathname) : (new Bili_Optimizer(href)).start();
        }
    }
    // 启动 -----------------
})();
