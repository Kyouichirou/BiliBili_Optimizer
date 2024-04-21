# BiliBili_Optimizer使用指南

![x](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/t0150e030dee399c1a0.jpg?raw=true)

## 一. 前言

脚本主要实现以下功能:

- 内容拦截
- 追踪干预
- 快捷辅助(如根据时间自动关灯, 自动调节播放视频速度等)
- 页面布局优化

![2024-02-22 15 43 33.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-02-22%2015%2043%2033.png?raw=true)

脚本首要解决的问题是**内容拦截(筛选)**, 次之为信息的标记和收集(数据存储在自己的手上才是最靠谱的, 对于高价值的视频/音频都应当存储于自己可控的硬盘) 尽管B站在网页端也引入了`所谓的` 推荐机制, 但是算法奇烂, 效果非常差, 推荐的视频基本是**泥沙俱下**.

先无论算法的好坏(用户角度的好坏), 从另一角度来看, 算法的目的和用户的目的通常是相违背的, 算法的目的不仅希望推荐用户希望看到的内容, 还需要**诱导/教育**用户去观看某些内容(例如: 擦边, 猎奇, 财经洗脑等), 其最终的目的追求在于让用户进入高度沉迷的(**智障**)状态, 同时算法背后还多伴随着强烈的广告诉求...诸如此类原因, 一个算法不可能能够很好胜任为用户服务这一基本职能.

<!--more-->

另一方面B站对于垃圾信息的**放纵**.

例如: 任意的一个编程语言关键词(`python`,`Java`, ...)下的搜索结果, 基本被**培训机构**和某些不明来源的**垃圾信息**填充, 尽管这些内容不管是**视频标题**还是**视频内容**都是**高度重复**, 但是B站对于这些内容没有任何的干预, 反而这些内容不仅仅出现再搜索结果种, 同时反复出现在推荐中(从这些内容来看, B站的算法是不会刻意区分垃圾信息甚至于有意的放纵垃圾信息, 这个时候厂商们吹上天的所谓xx AI, xx 人工智障...等各种逆天神技保持了**技术中立**).

![2024-02-22 15 52 01.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-02-22%2015%2052%2001.png?raw=true)

![2024-02-22 16 10 37.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-02-22%2016%2010%2037.png?raw=true)

(只需要添加一条信息到贝叶斯过滤器, 这些垃圾信息绝大部分都可以被区分出来, 显然B站不清除这些垃圾, 不是技术层的问题.)

综上, 简而言之, 就是通过脚本一定程度对信息进行控制和筛选, 同时更为友好地浏览B站.

### 1.1 兼容测试

> 测试环境
>
> Chrome, Version 117.0.5938.89 (Official Build) (64-bit)
>
> Chromium, Version 86.0.4240.198 (64-bit)
>
> TamperMonkey: Verision 4.9 - 5.x
>
> 建议: 使用尽可能高版本的 chrome / chromium , 以及Tampermonkey.
>
> 浏览器推荐: chrome 或 [centbrower](https://www.centbrowser.cn/)(centbrowser继承了枫叶浏览器的遗志, 史最佳), 不建议使用**edge**浏览器(高度臃肿)

脚本主要生效页面(针对页面广告, 布局等细节css调节则在大部分页面生效):

- 视频 (**不包含**直播, 番剧, 只针对`url`包含`/video/`的页面)
- 主页
- 搜索

```JavaScript
// @match        https://t.bilibili.com/
// @match        https://www.bilibili.com/*
// @match        https://space.bilibili.com/*
// @match        https://search.bilibili.com/*
```

## 二. 内容拦截

对于内容拦截遵循两个基本原则:

> 不想看到.
>
> 看完之后不想再看到.

这是脚本的**核心内容**.

![image-20240222181015549.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/image-20240222181015549.png?raw=true)

- **拦截up**, 拦截操作会**自动同步**到 视频, 主页, 搜索 这三个页面, 即页面中的视频是该up发布的将被移除, 不限制数量

  相关操作在up的页面.

  ![2023-09-27 18 14 33.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2023-09-27%2018%2014%2033.png?raw=true)

- **拦截视频**, 拦截操作会**自动同步**到 视频, 主页, 搜索 这三个页面, 限制数量, 默认999, 新添加进来的数据会被提前, 后面的弹出.

  具体的操作见下面的快捷键和视频播放页面的菜单.

- **关键词拦截**, 将检查视频的标题和up主的名称

  可以手动添加关键词, 操作见下面的快捷键.

- **临时拦截up**, 再关键词拦截种, a类关键词拦截被触发, 则该up会被添加到临时的拦截名单上, 数据只在当前页面生效

- **临时拦截视频**, 快捷键触发, 数据只在当前页面生效. (该项同时表示将视频标题添加到贝叶斯黑名单中去)

- **贝叶斯垃圾信息识别**, 预置了黑白名单, 可手动添加.

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/5449d4d3-5b98-4f96-8de0-4ce7ae7a1021)

大部分拦截操作将在`fetch`数据请求返回环节完成, 被拦截的视频数据会被清空, 只填充进一张图片. 在数据请求返回阶段进行干预, 不仅可以更为精准可控同时执行速度更快, 避免操作`html`带来的负面影响.

每个视频都会被完整检查上述的内容, 任意一项满足, 即执行拦截(*拦截信息会打印在控制板*).

![image-20240222182654661.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/image-20240222182654661.png?raw=true)

### 2.1 贝叶斯

![image-20230719180154961.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/image-20230719180154961.png?raw=true)

个人在写很多脚本的拦截器时, 基本上也犯了<黑客与画家>所提及的错误, 没有优先尝试从数学的角度来实现.

![2024-03-01 11 36 21.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-03-01%2011%2036%2021.png?raw=true)

这些内容有着显著的特征, 通过若干词汇的变换, 注册大量僵尸账号反复发布这些重复信息, 通过拦截关键词, 拦截up无法对内容实现精准大批量的拦截, 这些类型的内容就很适合通过贝叶斯来拦截.

不管是基于关键词, 还是用户ID, 视频ID的拦截, 这些都是硬性规则, 很难对于垃圾信息做出较大范围的拦截, 同时还需费时费力去构建规则.

通过观察垃圾信息, 很容易发现, 大量的信息都是类似的, 使用的文字, 字母, 标点符号, 通过判断这些内容出现的次数, 那么显然很容易根据出现的概率来判断是否为垃圾内容.

这部分内容详情见另一篇文章: [贝叶斯文本分类算法的JavaScript实现 | Lian (kyouichirou.github.io)](https://kyouichirou.github.io/post/bei-xie-si-wen-ben-fen-lei-suan-fa-de-javascript-shi-xian/)

代码中预置了部分的黑白规则用于清理python相关的垃圾视频, 贝叶斯过滤器要根据自身的偏好来调整, 所以需要动手来调教适合自身的模型.

对于贝叶斯黑名单的使用需要较为注意, 适用于大批量**较为规律**出现的垃圾推广拦截, 否则可能需要微调模型来实现较好的拦截效果.

```bash
【Python源码】轻松破解WiFi密码, 随时随地上网( 附源码) , 再也不用担心外出没流量了~~

本科毕业 脱下长衫, 目前900块一小时, 很吃香, 但目前很多人看不上! 适合不爱社交的人! 

【2024最新】用python爬虫处理excel搞定自动化办公, 几分钟轻松搞定一天工作, 全天摸鱼( 附带课件源码, pycharm激活工具) 
```

相关设置见下文, 命令行输入部分.

## 三. 搜索优化

在视频的增加两项: **播放历史**和**评分**.

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/3382bac5-0de1-48c1-a531-6e565fb0bf4d)

在视频播放页面中可以对视频进行评分.

- remove, 移除评分
- 历史记录, 自动执行, 999条, 当在视频页面停留超过一半的时间, 即认为已经播放.

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/ecf0ea7b-5b08-4af3-96b0-c973812e3b73)

评分为 **5** 的视频的标题将会自动被添加到贝叶斯白名单词库, 同时会自动生成` bbdown`的下载命令行.

```bash
`BBDown -mt --work-dir "E:\\video" "${this.#video_info.video_id}"`
```

*bbdown一个强大的B站视频下载命令行工具.*

## 四. 追踪清除

清除点击, 播放, 右键菜单等事件触发添加的追踪参数.

B站不管是视频播放页面还是其他的很多页面的url多会被各种页面事件添加各种追踪参数, 例如:

- 右键菜单
- 点击
- 播放变化
- 搜索

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/f7a366c4-0a22-4445-8d76-dbc340eccfcd)

例如, 搜索页面的视频url, 原本无追踪参数, 但是右键之后就会被添加.

## 五. 快捷键

快捷键主要用于:

- 视频控制
- 搜索
- 拦截信息的管理

| 快捷键 | 辅助 | 功能 | 生效页面 |
| ------ | ---------------------------------- | ------------------------------------------------------------ | ---------------- |
| p | | 暂停/播放视频 | 视频 |
| l | | 视频关/开灯 | 视频 |
| t | | 视频影院模式 | 视频 |
| + | | 视频声音调大 | 视频 |
| - | | 视频声音调小 | 视频 |
| u | | 视频页面内全屏 | 视频 |
| f | | 视频全屏 | 视频 |
| m | | 静音 | 视频 |
| b | | 必应搜索 | 全站 |
| s | | 哔哩搜索 | 全站 |
| z | | 知乎搜索 | 全站 |
| w | | 添加文本到贝叶斯白名单 | 主页, 搜索 |
| a | | 添加拦截关键词 (添加到A类关键词) | 主页, 搜索 |
| r | | 移除拦截关键 | 主页, 搜索 |
| ctrl | 鼠标右键(鼠标放置在需要操作元素上) | 临时隐藏视频(仅在执行页面生效, 关闭后该数据将不被保存), 同时添加视频的标题到贝叶斯分类器的黑名单中. | 视频, 主页, 搜索 |
| shift | 鼠标右键(鼠标放置在需要操作元素上) | 拦截视频 | 视频, 主页, 搜索 |
| ctrl | 鼠标正常点击视频链接 | 自动控制视频加速 | 主页, 搜索 |

- 搜索的执行逻辑, 选中, 假如无选中, 会尝试读取搜索框中的内容.
- 内置的拦截关键词, 无法通过上述的移除操作删除
- 自动控制视频加速, 目的在于快速浏览某个视频, 通过逐级加速快速看完一个视频(假如执行手动调节, 自动调速将自动取消).

在控制台上显示快捷键, 只需要输入:

```bash
shortcuts
```

![2024-03-01 11 14 17.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-03-01%2011%2014%2017.png?raw=true)

## 六. 数据存储

为了避免数据爆炸的问题, 数据的存储主要分为两个部分:

**动态保存:**

设置上限是因为数据具有时效, 例如B站的热点推广信息, 拦截一段时间之后, 该视频不会再出现再推荐上.

- 拦截up, 根据拦截次数和添加时间清除掉不活跃的内容
- 历史访问, 动态自动调节, 上限1000
- 手动添加关键词, 自动调节, 上限1000
- 拦截视频, 自动调节, 上限1000

**持续保存:**

- 视频评分(这部分永久存储)
- 贝叶斯词库(这部分尚未考虑如何清理)

## 七. 其他

### 7.1 播放速度

![2023-10-09 11 59 19.png (334×199) (raw.githubusercontent.com)](https://raw.githubusercontent.com/Kyouichirou/BiliBili_Optimizer/main/images/2023-10-09%2011%2059%2019.png)

- 视频播放速度, 以0.5变化, 最高不超过5倍, 在当前页面播放, 则速度会在播放下一个视频的时候继续维持, slow调低到2以下, 则恢复原来的页面播放速度控制状态.

此项设置将覆盖掉自动调速的设置.

### 7.2 自动关灯

- 默认模式下, 根据时间自动触发, 时间设置根据月份, 以9月作为简单分割, 时间超过16, 17将自动关灯
- 强制模式, 一直触发
- 禁用, 不自动触发.

### 7.3 页面优化

简单的`css`注入, 简化一下页面头部, 搜索框等部分, 清除掉**广告, 热搜, 直播**等.

*让B站变得干净点.*

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/e95639ee-09cb-40d9-b549-ee27c5964d79)

### 7.4 命令输入

目前支持三个关键词:

| word      | 含义                   |
| --------- | ---------------------- |
| shortcuts | 显示快捷键             |
| show_rate | 显示已经评分的视频信息 |
| bayes     | 显示贝叶斯模型的状况.  |

#### 7.4.1 贝叶斯设置

```JavaScript
bayes = {name: 'complementnb', alpha: 0.8, threshold: 0.12};
```

输入必须是`{}`结构数据, 可以单独设置其中的参数,  三个参数的含义:

- name, 模型的选择, 默认为`multinomialnb`多项式贝叶斯, 目前提供`complementnb`, `multinomialnb`两个模型的选择.
- alpha, 模型**微调**参数, 数值越大则敏感度越低, 反之, 设置值范围: `0.01 - 1`.
- threshold, 模型**粗调**, 数值越大敏感度越低, 反之, 设置值范围: `0.03 - 0.3`.

![2024-04-15 11 17 26.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-04-15%2011%2017%2026.png?raw=true)

### 7.5 视频下载标记

![2024-04-21 12 28 30.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-04-21%2012%2028%2030.png?raw=true)

标题的颜色会被改变, 同时标题悬浮会增加`downloaded`的后缀.

用于收集视频/音频, 会根据内容自动生成相关的命令行.

```bash
BBDown -mt --work-dir "E:\video" "BV1FU421o7rG" -p ALL --audio-only 
```

## 八. 小结

以上脚本仅作为交流学习使用, 无意侵犯B站....*B站功成不必在我, 倒闭必须有我(香菇滑鸡)*.

![2024-03-01 12 04 09.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-03-01%2012%2004%2009.png?raw=true)

*(控制板, 可以看到各种拦截的信息和一些操作debug)*
