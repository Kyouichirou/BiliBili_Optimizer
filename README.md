# BiliBili Optimizer 使用指南

![x](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/t0150e030dee399c1a0.jpg?raw=true)

## 一. 前言

![2024-06-21 10 45 20.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-21%2010%2045%2020.png?raw=true)

(图: *信息 - 处理流程*)

B站对于个人而言除了休闲之外也是重要的信息源挖掘地.

脚本首要解决的问题是**内容拦截(筛选)**, 次之为信息的标记和收集(数据存储在自己的手上才是最靠谱的, 对于高价值的视频/音频都应当存储于自己可控的硬盘) 尽管B站在网页端也引入了`所谓的` 推荐机制, 但是算法奇"烂", 效果非常差, 推荐的视频基本是**泥沙俱下**.

<!--more-->

*以个人的首页, 在PC端, 假如点击诸如: 社会热点, 旅游, 饮食, 政治类等"**很热**"的内容, 相关的视频会进行高强度推荐, 大量出现在首页的信息流中, 但是个人观看最多(投币最多)的计算机/编程, 计算机硬件DIY(偏开发, 而不是各类xx测评), 科普, 有声读物等内容, 相关推荐不仅数量很一般而且视频的质量很差, 有声读物这一块更是夸张, 我的首页就没出现过正常的有声书推荐.*

先无论算法的"好坏"(用户角度的好坏), 从另一角度来看, 算法的目的和用户的目的通常是**相违背**的, 算法的目的不仅希望推荐用户希望看到的内容, 还需要**诱导/教育**用户去观看某些内容(例如: *擦边, 猎奇, 财经洗脑*等), 其最终的目的追求在于让用户进入高度沉迷的(***智障***)状态, 同时算法背后还多伴随着强烈的广告诉求...诸如此类原因, 一个算法不可能能够很好胜任为用户服务这一基本职能.

*以某音为例, 甚至用算法将垃圾内容的生产与消费进行了高度工业化的流水线作业, 其取得的惊人成功堪称一大商业巨大壮举.*

![2024-06-18 13 50 13.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-18%2013%2050%2013.png?raw=true)

(*随着B站重振长视频的计划破产, 短视频的推广也在不断上强度*)

- [独家 | B站" 播放分钟数" 将于7月初上线, 不影响热门推荐和创作激励机制_视频_用户_内容 (sohu.com)](https://www.sohu.com/a/692743819_108964)

- [B站" 掀桌" 一半又放弃, 播放量指标为何难以被撼动? _腾讯新闻 (qq.com)](https://new.qq.com/rain/a/20240523A08X5R00)

另一方面B站对于垃圾信息的**放纵**.

例如: 任意的一个编程语言关键词(`python`,`Java`, ...)下的搜索结果, 基本被**培训机构**和某些不明来源的**垃圾信息**填充, 尽管这些内容不管是**视频标题**还是**视频内容**都是**高度重复**, 但是B站对于这些内容没有任何的干预, 反而这些内容不仅仅出现再搜索结果种, 同时反复出现在推荐中(从这些内容来看, B站的算法是不会刻意区分垃圾信息甚至于有意的放纵垃圾信息, 这个时候厂商们吹上天的所谓xx **AI**, xx 人工智障...等各种逆天神技保持了**技术中立**).

![2024-02-22 15 52 01.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-02-22%2015%2052%2001.png?raw=true)

如: 检索`python`这个关键词, 检索到结果完全被营销垃圾覆盖.

![2024-02-22 16 10 37.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-02-22%2016%2010%2037.png?raw=true)

更夸张的是"长衫"这个关键词.

但, 只需要添加一条信息到贝叶斯过滤器, 这些垃圾信息绝大部分都可以被区分出来, 显然B站不清除这些垃圾, 不是技术层的问题.

\.\.\.

简而言之, 脚本的目的是为了更好的浏览B站.

### 1.1 兼容测试

[脚本安装地址](https://github.com/Kyouichirou/BiliBili_Optimizer/raw/main/bili_bili_optimizer.user.js)

> Chrome, Version 117.0.5938.89 (Official Build) (64-bit)
>
> Centbrowser, Version 86.0.4240.198 (64-bit)
>
> Edge, Version 126.0.2592.56 (Official build) (64-bit)
>
> TamperMonkey: Verision 4.9 - 5.x
>
> 建议: 使用尽可能高版本的 chrome/chromium , 以及Tampermonkey.
>
> **浏览器推荐**: **chrome** 或 [centbrower](https://www.centbrowser.cn/)(centbrowser, 枫叶浏览器的最佳继承者), 不建议使用**edge**浏览器(高度臃肿)

脚本主要生效页面(针对页面广告, 布局等细节css调节则在大部分页面生效):

- 视频 (**不包含**直播, 番剧, 对于这些内容不感兴趣, 所以只针对`url`包含`/video/`的页面)
- 主页
- 搜索

```JavaScript
// @match        https://t.bilibili.com/
// @match        https://www.bilibili.com/*
// @match        https://space.bilibili.com/*
// @match        https://search.bilibili.com/*
```

#### 1.1.1 edge浏览器问题

**占用快捷键**

![2024-06-16 12 42 39.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-16%2012%2042%2039.png?raw=true)

`edge`自带快捷键搜索`s`, 和脚本的存在冲突.

**自动播放控制**

`chrome`浏览器关于自动播放的控制设置和`edge`不一样, 在`chrome`中关于`autoplay`的关键字项已经从设置和`flags`中移除.

![2024-06-14 09 55 40.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-14%2009%2055%2040.png?raw=true)

视频自动播放, 这一点比较诡异, 各个浏览器的策略都存在一定的差异.

![2024-06-14 09 38 43.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-14%2009%2038%2043.png?raw=true)

这个报错, 在`edge`上是大概率的事件, 在和用户尚未和页面产生交互(点击, 按键等)的时候控制视频的播放(非静音就会触发), 但是在`chrome, centbrowser`都很难复现这个情况.

![2024-06-16 12 46 15.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-16%2012%2046%2015.png?raw=true)

为了避免在`edge`上出现无法正常控制视频播放的情况, 最好手动设置添加B站到允许自动播放的列表中. 这个特性主要是为了解决**不登陆账号**的情况下切换`1080P`视频的等待播放问题.

[chrome - b站之类的视频网站是怎么让video播放器自动播放的?  - SegmentFault 思否](https://segmentfault.com/q/1010000044150685)

[斗鱼, B站是怎么解决 Chrome 禁止自动播放的问题的?  - 知乎 (zhihu.com)](https://www.zhihu.com/question/360774937)

[Chrome 中的自动播放政策](https://developer.chrome.com/blog/autoplay/?hl=zh-cn)

![2024-06-14 11 48 56.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-14%2011%2048%2056.png?raw=true)

```bash
edge://media-engagement/
```

浏览器内部维持着一个列表用于判断某个网站是否允许自动播放, 浏览的次数(到达一定时间)越多, 站点被允许自动播放的评分就越高, 达到一定的阈值就会自动设置为允许自动播放.

## 二. 过滤器

这是整个脚本的核心组件, 核心功能都是围绕着内容过滤来写的.

对于内容拦截遵循两个基本原则:

> **不想看到**, 如; 各类滤镜P到镜面反光的擦边, 弱智的财经, 政治类等视频.
>
> **看完之后不想再看到**,如: 挂羊头买狗, 言过其实带有很强误导性等视频.

![image-20240222182654661.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/image-20240222182654661.png?raw=true)

这里不加入正则表达式时因为正则并不好维护, 而且很容易出现误杀, 正则可以实现的功能可以通过贝叶斯文本分类算法实现.

同时各类拦截应该根据实际的需要, 选择合适的方式来拦截.

- 拦截up, 如, 营销up.

- 拦截视频, 这个是最随意的, 只要看到引起情感或者生理不适的, 直接拦截.

- 关键词, 如针对某个类, 如娱乐圈营销信息, 某个人的名称, 或者某个电视剧, 电影的名称.

- 贝叶斯, 这个可用性很广, 但是需要自行调优模型, 同时还需要考虑对性能的影响, 个人主要用于拦截各种毫无意义的灌水内容, 如编程类目下的营销号发出的垃圾.

  ![2024-06-24 12 43 26.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-24%2012%2043%2026.png?raw=true)

  比较典型的是这种营销号的信息, 其内容结构相似, 不管是通过拦截up, 拦截视频, 关键词(误过滤), 对于这类内容均不易拦截, 这些内容数量众多和正常内容存在较大的重叠.

![image-20240222181015549.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/image-20240222181015549.png?raw=true)

(执行的先后顺序.)

此外还提供了根据视频长度过滤内容的功能, 默认拦截时长小于`120`秒的视频.

### 2.1 拦截UP

打开up的页面, 左下角位置有个按钮, 点击即可.

![2023-09-27 18 14 33.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2023-09-27%2018%2014%2033.png?raw=true)

取消拦截的操作, 也是如此.

### 2.2 拦截视频

快捷键: 将鼠标放在视频卡片上, `shift` + 鼠标右键, 直接拦截视频; `ctrl` + 鼠标右键, 添加视频到缓存拦截列表, 同时添加视频标题到贝叶斯黑名单.

![2024-06-23 18 22 57.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-23%2018%2022%2057.png?raw=true)

在播放页, 视频播放器下会有个菜单, 拦截或者移除拦截.

### 2.3 关键词

快捷键的方式, 浏览器弹窗输入框.

`a`, 添加

`r`, 移除

输入内容的内容为字符串, 多个内容用空间进行间隔.

在控制板输入, 支持两种参数输入, 字符串(多个内容, 用空格间隔开)和数组的方式.

```bash
black_key.add('啃老'); # 添加
black_key.remove('啃老');

black_key.remove('智能 熬夜');
black_key.remove(['智能', '熬夜']);
```

两种方式的差异是, 快捷键的添加操作完成后会自动检查页面是否存在内容包含关键词, 假如包含会被移除, 而控制板操作不会.

数据不会自动同步到其他页面, 需要页面刷新才会更新.

### 2.4 贝叶斯分类器

由于不同的人对于过滤内容的偏好不一样, 无法做到统一, 所以需要自行手动调优模型来实现最佳的过滤效果.

在控制台输入, 查看帮助:

```bash
bayes.help
```

```bash
configs    bayes.configs; show the configs; bayes.configs = {};, setup configs
reset      bayes.reset(0); reset the bayes, default 0, will clear all data; 1 reset configs; 2 clear words data and keep configs.
deatail    bayes.detail; show the detail of bayes model.
test       test("content"); will return the result of test content.
enable     bayes default 1 enable, bayes.enable = 0; disable bayes
add_white  bayes.add_white("content"); add the content to white list.
add_black  bayes.add_black("content"); add the content to black list.
help       show the info of help.
```

| 项 | 含义/作用 |
| --------- | ---------------------- |
| configs | 查看/设置模型参数 |
| reset | 重置模型 |
| deatail | 查看贝叶斯过滤器的详情 |
| test | 测试文本分类 |
| enable | 是否启用贝叶斯分类器 |
| add_white | 添加内容到白名单 |
| add_black | 添加内容到黑名单 |
| help | 查看帮助信息 |

#### 2.4.1 参数设置

```bash
# 查看参数信息
bayes.configs

{alpha: 1, threshold: 0.15, single_weight: 1, feature_length_limit: 5, name: 'multinomialnb'}

# 修改参数
bayes.configs = {alpha: 1, threshold: 0.15, single_weight: 1, feature_length_limit: 5, name: 'multinomialnb'}
```

- `alpha`, 模型**微调**参数, 数值越大则敏感度越低, 误过滤较低; 反之敏感度越高, 误过滤更高. 设置值范围: `0.01 - 1`, 默认值为 1.
- `threshold`, 模型**粗调**, 数值越大敏感度越低, 反之, 设置值范围: `0.03 - 0.3`, 默认值 0.12.
- `feature_length_limit`, 限制特征值数量, 低于此值的内容将不会处理, 这是为了避免**过短**的内容被误过滤, 默认为: `5`, 设置值范围: ` 3 - 9`
- `single_weight`, 单个字的计算权重, 因为`JavaScript`提供的原生分词工具分词效果比较差, 多数的内容都会被拆成单个字, 而不是词汇, 降低这部分的计算权重, 数值越大, 则降低权重, 反之增加权重, 默认值: 1, 设置范围: `0.8 - 2`.
- `name`, 模型的选择, 默认为`multinomialnb`多项式贝叶斯. 提供`complementnb`(补集贝叶斯), `multinomialnb`两个模型的选择, 这个项保持默认即可.

#### 2.4.2 测试

```bash
bayes.test('2024超级军事猛片: 美军竟敢派精锐三角洲潜入菲律宾作战! ')
```

![2024-06-23 16 23 42.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-23%2016%2023%2042.png?raw=true)

用于测试文本的分类, 可以查看具体的分词, 计算的数值等具体信息.

这个功能主要用于自行调优模型使用.

#### 2.4.3 启用/关闭贝叶斯

```bash
bayes.enable = 1 / true; # 启用
bayes.enable = 0 / false; # 关闭
```

#### 2.4.4 重置

```bash
bayes.reset(0) # 清除掉全部的数据, 恢复默认设置
bayes.reset(1) # 重置设置, 保留词汇数据
bayes.reset(2) # 清除掉词汇特征数据, 保持设置
```

#### 2.4.5 添加内容

快捷键

`w`, 输入文本, 添加到白名单.

`CTRL` + 鼠标右键, 添加到黑名单

或者控制台输入

```bash
bayes.add_black('2024超级军事猛片: 美军竟敢派精锐三角洲潜入菲律宾作战! ') # 添加黑名单

bayes.add_white('2024超级军事猛片: 美军竟敢派精锐三角洲潜入菲律宾作战! ') # 添加白名单
```

#### 2.4.6 小结

所有的设置或者修改都会自动同步到其他的页面, 不需要刷新页面.

但是需要注意, 贝叶斯适合处理的内容, 如内容相似,

![2024-03-01 11 36 21.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-03-01%2011%2036%2021.png?raw=true)

## 三. 快捷键

快捷键主要用于实现:

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
| r | | 移除拦截关键词 | 主页, 搜索 |
| ctrl | 鼠标右键(鼠标放置在需要操作元素上) | 临时隐藏视频(仅在执行页面生效, 关闭后该数据将不被保存), 同时添加视频的标题到贝叶斯分类器的黑名单中. | 视频, 主页, 搜索 |
| shift | 鼠标右键(鼠标放置在需要操作元素上) | 拦截视频 | 视频, 主页, 搜索 |
| ctrl | 鼠标正常点击视频链接 | 自动控制视频加速 | 主页, 搜索 |

需要注意:

- 搜索, 其执行逻辑为, 假如选中, 则检索选中的内容; 假如无选中, 会尝试读取搜索框中的内容, 即要检索搜索框的内容, 直接按下快捷键即可, 不需要选中.
- 移除拦截关键词, 智能移除自行添加的关键词, 内置的拦截关键词, 无法通过上述的移除操作删除(只能删除代码).
- 自动控制视频加速, 这点需要了解一下, 这个功能主要为了快速浏览某个视频, 通过不断的逐级自动加速快速看完一个视频(假如执行手动调节, 自动调速将自动取消).

如需查看快捷键, 可在控制台上显示快捷键, 只需要输入:

```bash
show_short_cuts
```

![2024-06-23 16 00 33.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-23%2016%2000%2033.png?raw=true)

## 四. 控制板

在控制板输入`help`即可查看支持的命令和设置.

```bash
help

show_short_cuts      show the shortcuts
show_rate            show all rated videos
black_key            setup custom black keys
bayes                setup and show the bayes model
support              show the popup of support me
feedback             open the webpage of issues
manual               open the webpage of manual
show_crash_log       show the log of crash
download_audio_path   show/set the path of download audio
download_video_path   show/set the path of download video
video_duration_limit  setup the duration to filter video
help                  show the info of help
```

- download_audio_path, 这项是生成bbdown下载音频命令需要用的

  ```bash
  download_audio_path = 'D:\\videos'
  ```

  路径需要双斜杠.

- download_video_path, 这项是生成bbdown下载视频命令需要用的, 设置和上面音频的一样.

- video_duration_limit, 设置需要过滤的视频长度, 低于此长度的视频将被过滤掉, 默认为`120`秒.

  ```bash
  video_duration_limit = 90
  ```

## 五. 其他

### 5.1 不登陆账号干预

相关内容见: [B站不登陆账号观看1080P(高清视频)的逆向和完美解决方案 | Lian (kyouichirou.github.io)](https://kyouichirou.github.io/post/b-zhan-bu-deng-lu-zhang-hao-guan-kan-1080pgao-qing-shi-pin-de-ni-xiang-he-wan-mei-jie-jue-fang-an/)

这里不再赘述, 就是在不登陆账号下, 不受B站的弹窗影响和解锁观看高清视频的限制.

### 5.2 视频菜单

![2024-06-24 12 47 28.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-24%2012%2047%2028.png?raw=true)

- 评分, Rate 3, Rate 4, Rate 5, 可以认为, 这是自定义的收藏和视频评分, B站的收功能没什么鬼用, 收藏视频假如失效, 甚至连视频标题都不给留下. 这个评分除了起到收藏的作用, 这部分的内容在后续的开发中将作为过滤内容的填充.

- (Block)拦截/取消拦截视频(unBlock)

- `BBdown`, 生成bbdown下载命令, 文件路径设置见上面控制板.

  ```bash
  BBDown -mt --work-dir "E:\\video" "${this.#video_info.video_id}"
  ```

  [nilaoda/BBDown: Bilibili Downloader. 一款命令行式哔哩哔哩下载器. (github.com)](https://github.com/nilaoda/BBDown), 一个强大的B站视频下载命令行工具.

- `Marked`, 标记视频已经下载, 避免下载内容太多记不起那些已经下载过.

### 5.3 视频标记

为了方便内容检索, 在搜索页中, 假如评分或者是存在播放记录, 将会被添加标记

`r, rate`, 评分

`v, visited`, 播放记录. 1, 表示播放记录为当前会话; 2. 历史播放.

![2024-06-24 16 07 01.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-24%2016%2007%2001.png?raw=true)

在首页中的视频中假如存在播放记录, 则会在视频标题上增加`[H-1], [H-2]`的前缀.

### 5.4 视频播放速度

![2023-10-09 11 59 19.png (334×199) (raw.githubusercontent.com)](https://raw.githubusercontent.com/Kyouichirou/BiliBili_Optimizer/main/images/2023-10-09%2011%2059%2019.png)

视频播放速度以`±0.5`变化, 最高不超过5倍, 假如页面没有刷新, 则速度会在播放下一个视频的时候继续维持(不管这个视频是否为合集), `slow`调低到2以下, 则恢复原来的页面播放速度控制状态.

### 5.5 自动关灯

![2024-06-24 12 27 04.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-24%2012%2027%2004.png?raw=true)

- `auto_light_off`, 默认模式下, 根据时间自动触发, 时间设置根据月份的差异, 自动调节, 当时间在傍晚到凌晨这段时间自动关灯
- `always_light_off`, 强制模式, 一直触发
- `disable_light_off`, 禁用, 不自动触发.

### 5.6 背景遮罩

提供`yellow, green, grey, olive`四种颜色可选, 根据时间自动调节颜色的深浅, 降低白色背景颜色的刺激.

![2024-06-24 16 13 15.png](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/2024-06-24%2016%2013%2015.png?raw=true)

视频播放页面将不会开启.

### 5.7 移除url追踪参数

B站的各种操作一般都会在url上添加上追踪参数, 如:

- 右键菜单
- 点击
- 播放变化
- 搜索

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/f7a366c4-0a22-4445-8d76-dbc340eccfcd)

(*搜索页面的视频url, 原本无追踪参数, 但是打开右键菜单之后就会被添加*)

## 六. 关于代码

### 6.1 关于贝叶斯

由于`JavaScript`并没有原生支持矩阵的运算, 为了方便计算和提高计算的速度, 代码中关于概率的计算部分, 进行了调整和优化, 如, 加入了针对单个字符的计算权重, 真是因为js原生api `Intl.Segmenter`针对中文的分词效果一般, 很多内容分解后为单个字符, 所以增加了对单个字符的计算权重, 以降低单个字符的影响. 计算的过程进行了优化, 如提前计算了部分需要反复调用的值...所以看到的代码执行过程和在很多python中的代码的执行存在明显的差异.

### 6.2 数据的存储

为了避免数据爆炸的问题, 数据的存储主要分为两个部分:

**动态保存:**

设置上限是因为数据具有时效, 例如B站的热点推广信息, 拦截一段时间之后, 该视频不会再出现再推荐上.

- 拦截up, 根据拦截次数和添加时间清除掉不活跃的内容(暂未开放功能)
- 历史访问, 动态自动调节, 上限1000
- 手动添加关键词, 自动调节, 上限1000
- 拦截视频, 自动调节, 上限1000

**持续保存:**

- 视频评分(这部分永久存储)

**其他**

- 贝叶斯词库(这部分尚未考虑如何清理)

## 七. FQA

1. Q: 为什么很多政治, 娱乐类的内容被过滤掉被过滤掉? A: 因为这些毫无价值.
2. Q: 为什么过滤掉内容后首页的布局视频卡片位置出现错位? A: 因为过滤内容是在api层面执行, 被过滤的视频数据会被清空, B站的原脚本是不会创建空的视频卡片元素, 这导致页面卡片的布局出现错位的情况, 后面会用其他api的数据填充过滤掉的内容.
3. Q: 为什么不登陆账号播放视频, 开始时会暂停一小会? A: 这是切换视频到1080P, 需要等地视频切换完成再开始播放, 所以需要暂停一会.
4. Q: 为什么侧边栏相关视频出现很多`汉森白`的重复视频? A: 这是因为视频播放页的相关视频必须有足够的内容填充, 否则会导致页面崩溃, 随意找了汉森白的视频来填充.

## 八. 小结

本脚本仅作为交流学习使用, 无意侵犯B站权益, 请勿用于其他用途....*B站功成不必在我, 倒闭必须有我(香菇滑鸡)*.

## 九. 捐助

*any help, a cup of coffee.*

![img](https://8.z.wiki/autoupload/20240518/nodV/payme.webp)

