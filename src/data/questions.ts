import type { Question, Subject } from '../types'

/**
 * 内置示例题库。
 * 结构：每个学科 5 个题型（见 curriculum.ts），每个题型配「基础 + 进阶」两题。
 * 约定：
 *  - keywords[].text 必须与 stem 原文逐字一致，否则不会被切出来；
 *  - options 恰好 4 个，有且仅有 1 个 correct: true；
 *  - 干扰项要对应常见读题错误（看错范围 / 答非所问 / 只答一半 / 混淆概念）。
 */
export const BANK: Question[] = [
  /* ============================== 语文 ============================== */
  /* ---- 概括题 ---- */
  {
    id: 'zh-gaikuo-1',
    subject: 'chinese',
    category: 'zh-gaikuo',
    grade: '四-六年级',
    difficulty: 1,
    stem: '阅读短文，用简洁的语言概括第三自然段的主要内容。',
    keywords: [
      { text: '第三自然段', reason: '概括的是这一段，不是全文', role: 'object' },
      { text: '概括', reason: '要求提炼要点，不是照抄原文', role: 'task' },
      { text: '主要内容', reason: '要抓整段的核心，不是某个细节', role: 'target' },
      { text: '简洁的语言', reason: '有表达要求，不能啰嗦', role: 'condition' },
    ],
    options: [
      { text: '用简洁的话，概括第三自然段讲了什么。', correct: true, analysis: '抓住了“概括”和“第三自然段”两个要点。' },
      { text: '把整篇短文的内容复述一遍。', correct: false, analysis: '看错了范围——题目只要第三自然段，不是全文。' },
      { text: '找出第三自然段中你最喜欢的一句话，并说明理由。', correct: false, analysis: '答非所问，题目要的是概括，不是赏析。' },
      { text: '一字不差地抄写第三自然段。', correct: false, analysis: '把“概括”理解成了“抄写”，方向错了。' },
    ],
    tip: '先看清楚“做什么”（概括）和“做哪一部分”（第三自然段）。',
  },
  {
    id: 'zh-gaikuo-2',
    subject: 'chinese',
    category: 'zh-gaikuo',
    grade: '四-六年级',
    difficulty: 2,
    stem: '默读短文，简要概括“我”在文中情感发生的变化，并说明发生变化的原因。',
    keywords: [
      { text: '情感发生的变化', reason: '要概括的是情感变化', role: 'object' },
      { text: '并说明', reason: '“并”字意味着还有第二个任务', role: 'condition' },
      { text: '发生变化的原因', reason: '还要说清为什么会变化', role: 'target' },
      { text: '简要概括', reason: '要求精炼，不能啰嗦', role: 'task' },
    ],
    options: [
      { text: '既要概括“我”情感的变化，又要说明变化的原因。', correct: true, analysis: '把“并说明”这个第二个任务也读到了。' },
      { text: '只概括“我”的情感变化，不用说明原因。', correct: false, analysis: '只做了一半，题目用“并说明”要求了两个任务。' },
      { text: '概括这篇短文的主要内容。', correct: false, analysis: '范围错了，题目问的是“我”的情感变化，不是全文内容。' },
      { text: '找出文中描写“我”的句子，并抄写下来。', correct: false, analysis: '答非所问，题目是让你概括，不是找句子。' },
    ],
    tip: '题里出现“并”“还”“也”这类字，往往意味着有两个任务，别只做一半。',
  },
  /* ---- 词句理解 ---- */
  {
    id: 'zh-ciju-1',
    subject: 'chinese',
    category: 'zh-ciju',
    grade: '四-六年级',
    difficulty: 1,
    stem: '下面句子中加点的词语能否删去？为什么？',
    keywords: [
      { text: '能否删去', reason: '要你先表态：能，还是不能', role: 'task' },
      { text: '为什么', reason: '还要说明理由，不能只答能或不能', role: 'target' },
      { text: '加点的词语', reason: '判断的对象是加点词，不是整句', role: 'object' },
    ],
    options: [
      { text: '判断加点的词语能不能删去，并说明理由。', correct: true, analysis: '把“能否”和“为什么”两个要求都读到了。' },
      { text: '把加点的词语删掉，重新抄写一遍句子。', correct: false, analysis: '答非所问，题目不是让你改句子。' },
      { text: '解释加点词语是什么意思。', correct: false, analysis: '看错了任务，题目要的是判断能不能删，不是解释词义。' },
      { text: '找出句子中的错别字并改正。', correct: false, analysis: '完全跑偏，题目和错别字无关。' },
    ],
    tip: '“能否”要先表态，“为什么”要说理由，两个都要答。',
  },
  {
    id: 'zh-ciju-2',
    subject: 'chinese',
    category: 'zh-ciju',
    grade: '四-六年级',
    difficulty: 2,
    stem: '联系上下文，写出“别看他个子矮，可他心里装着一片海”中“装着一片海”的意思。',
    keywords: [
      { text: '联系上下文', reason: '提示要结合语境，不能只看这一句', role: 'condition' },
      { text: '“装着一片海”的意思', reason: '要解释的是这个说法的含义', role: 'target' },
      { text: '别看他个子矮', reason: '暗示这是对比，不是字面意思', role: 'trap' },
    ],
    options: [
      { text: '指他虽然个子矮，但内心很丰富、胸怀很宽广。', correct: true, analysis: '联系了“个子矮”的对比，读出了话里的意思。' },
      { text: '指他的肚子里真的装着一片海水。', correct: false, analysis: '照着字面理解，没有联系上下文。' },
      { text: '指他个子矮，心里很难过。', correct: false, analysis: '把意思理解反了，和句子想表达的不符。' },
      { text: '指他非常喜欢大海。', correct: false, analysis: '望文生义，题目问的是这句话的含义，不是爱好。' },
    ],
    tip: '遇到“装着一片海”这类说法，不能照字面理解，要联系上下文想它指的是什么。',
  },
  /* ---- 赏析题 ---- */
  {
    id: 'zh-shangxi-1',
    subject: 'chinese',
    category: 'zh-shangxi',
    grade: '四-六年级',
    difficulty: 1,
    stem: '读句子“秋天的落叶像一只只蝴蝶，在空中翩翩起舞”，这句话用了什么修辞手法？这样写有什么好处？',
    keywords: [
      { text: '什么修辞手法', reason: '要判断用了哪种修辞', role: 'task' },
      { text: '这样写有什么好处', reason: '还要说出这样写的好处', role: 'target' },
      { text: '像一只只蝴蝶', reason: '这是判断修辞的关键', role: 'data' },
    ],
    options: [
      { text: '先判断用了比喻（把落叶比作蝴蝶），再说这样写生动形象的好处。', correct: true, analysis: '两问都答到了：方法 + 好处。' },
      { text: '只说出用了比喻，不用管好处。', correct: false, analysis: '只做了一半，题目还问了“有什么好处”。' },
      { text: '把这句话改写成不用比喻的句子。', correct: false, analysis: '答非所问，题目是赏析，不是改写。' },
      { text: '解释“翩翩起舞”这个词的意思。', correct: false, analysis: '变成了解释词语，没做赏析。' },
    ],
    tip: '赏析题通常两问：用了什么方法 + 这样写好在哪，都要答。',
  },
  {
    id: 'zh-shangxi-2',
    subject: 'chinese',
    category: 'zh-shangxi',
    grade: '四-六年级',
    difficulty: 2,
    stem: '文中画线句“风儿轻轻拂过麦田，麦浪一层赶着一层，涌向天边”，请从用词的角度赏析这句话。',
    keywords: [
      { text: '从用词的角度', reason: '限定了分析的角度是“用词”', role: 'condition' },
      { text: '赏析', reason: '要品析写法，不是解释意思', role: 'task' },
      { text: '一层赶着一层', reason: '这是值得品味的用词', role: 'data' },
      { text: '涌向天边', reason: '“涌”这个动词用得妙', role: 'data' },
    ],
    options: [
      { text: '抓住“赶”“涌”等动词，体会它们把麦浪写活的好处。', correct: true, analysis: '扣住了“用词的角度”，分析的是动词。' },
      { text: '说说这句话用了什么修辞手法。', correct: false, analysis: '角度错了，题目要求从“用词”的角度，不是修辞。' },
      { text: '概括这句话的主要内容。', correct: false, analysis: '答非所问，题目是赏析，不是概括。' },
      { text: '找出句中的错别字。', correct: false, analysis: '和题目无关。' },
    ],
    tip: '题目要求“从用词的角度”，就要盯着动词、形容词分析，别跑去说修辞。',
  },
  /* ---- 按要求写句子 ---- */
  {
    id: 'zh-xieju-1',
    subject: 'chinese',
    category: 'zh-xieju',
    grade: '四-六年级',
    difficulty: 1,
    stem: '用“虽然……但是……”的句式，写一句赞美春天的话。',
    keywords: [
      { text: '“虽然……但是……”的句式', reason: '必须用这个句式，不能换别的', role: 'condition' },
      { text: '赞美春天', reason: '写的内容要是春天，而且是赞美', role: 'object' },
      { text: '写一句', reason: '要求写一句，不是一段', role: 'task' },
    ],
    options: [
      { text: '用“虽然……但是……”的句式，写一句赞美春天的话。', correct: true, analysis: '句式、内容、数量三个要求都读到了。' },
      { text: '随便写一句话赞美春天。', correct: false, analysis: '漏掉了句式要求，必须用“虽然……但是……”。' },
      { text: '用“虽然……但是……”写一段描写春天景色的短文。', correct: false, analysis: '内容跑偏，题目要“赞美”，而且只要一句。' },
      { text: '解释“虽然……但是……”这个关联词的意思。', correct: false, analysis: '答非所问，题目是让你造句，不是解释。' },
    ],
    tip: '题目给了好几个要求（句式、内容、数量），一个一个对照着写。',
  },
  {
    id: 'zh-xieju-2',
    subject: 'chinese',
    category: 'zh-xieju',
    grade: '四-六年级',
    difficulty: 2,
    stem: '把“小草从泥土里钻了出来”改成拟人句，要求至少用上一个表示动作的词语。',
    keywords: [
      { text: '改成拟人句', reason: '改写目标是拟人句', role: 'task' },
      { text: '至少用上一个表示动作的词语', reason: '附加要求，别漏', role: 'condition' },
      { text: '小草从泥土里钻了出来', reason: '要改写的是这句话', role: 'object' },
    ],
    options: [
      { text: '把小草当作人来写，并且至少用一个表示动作的词。', correct: true, analysis: '“改成拟人句”和“用动作词”两个要求都读到了。' },
      { text: '把这句话改成比喻句。', correct: false, analysis: '看错了要求，题目是改成拟人句，不是比喻句。' },
      { text: '把小草换成别的事物再写一句话。', correct: false, analysis: '对象错了，要改写的是“小草从泥土里钻出来”。' },
      { text: '解释这句话的意思。', correct: false, analysis: '答非所问，题目是改写句子。' },
    ],
    tip: '改写题要看清“改成什么”（拟人句）和“附加要求”（用动作词），两个都要满足。',
  },
  /* ---- 古诗文 ---- */
  {
    id: 'zh-gushi-1',
    subject: 'chinese',
    category: 'zh-gushi',
    grade: '四-六年级',
    difficulty: 1,
    stem: '读诗句“谁知盘中餐，粒粒皆辛苦”，说说这两句诗的意思。',
    keywords: [
      { text: '“谁知盘中餐，粒粒皆辛苦”', reason: '要理解的是这两句诗', role: 'object' },
      { text: '说说这两句诗的意思', reason: '要讲出诗句的含义', role: 'task' },
    ],
    options: [
      { text: '用自己的话讲出这两句诗的意思。', correct: true, analysis: '抓住了“说意思”这个任务。' },
      { text: '默写这两句诗。', correct: false, analysis: '把“说意思”做成了“默写”。' },
      { text: '说说这首诗的作者是谁。', correct: false, analysis: '答非所问，题目是理解诗句意思。' },
      { text: '判断这两句诗用了什么修辞手法。', correct: false, analysis: '题目没让判断修辞。' },
    ],
    tip: '题目要“说意思”，就用大白话把诗句讲明白，不是默写、也不是背作者。',
  },
  {
    id: 'zh-gushi-2',
    subject: 'chinese',
    category: 'zh-gushi',
    grade: '四-六年级',
    difficulty: 2,
    stem: '读句子“锲而不舍，金石可镂”，说说“锲而不舍”是什么意思，并说说这句话告诉我们一个什么道理。',
    keywords: [
      { text: '“锲而不舍”是什么意思', reason: '第一个任务：解释词义', role: 'task' },
      { text: '并说说', reason: '提示还有第二个任务', role: 'condition' },
      { text: '一个什么道理', reason: '第二个任务：说道理', role: 'target' },
    ],
    options: [
      { text: '先解释“锲而不舍”的意思，再说这句话讲的道理。', correct: true, analysis: '“什么意思”和“什么道理”两个任务都读到了。' },
      { text: '只解释“锲而不舍”是什么意思。', correct: false, analysis: '只做了一半，题目还要你说说道理。' },
      { text: '把这句话一字不差地翻译成现代汉语。', correct: false, analysis: '题目要的是大意和道理，不是逐字翻译。' },
      { text: '说说“金石”指的是什么。', correct: false, analysis: '抓错了重点，题目问的是词义和道理。' },
    ],
    tip: '“……是什么意思，并说说……道理”——两道题，都要答到。',
  },

  /* ============================== 数学 ============================== */
  /* ---- 购物问题 ---- */
  {
    id: 'ma-gouwu-1',
    subject: 'math',
    category: 'ma-gouwu',
    grade: '四-六年级',
    difficulty: 1,
    stem: '一支钢笔12元，小明买了3支，一共要付多少元？',
    keywords: [
      { text: '12元', reason: '单价', role: 'data' },
      { text: '买了3支', reason: '数量', role: 'data' },
      { text: '一共要付多少元', reason: '求的是总价', role: 'target' },
    ],
    options: [
      { text: '求3支钢笔一共多少钱，用单价乘数量。', correct: true, analysis: '认准了“一共多少元”是求总价。' },
      { text: '求一支钢笔比一支铅笔贵多少元。', correct: false, analysis: '答非所问，题目没提铅笔。' },
      { text: '求买3支钢笔后还剩多少元。', correct: false, analysis: '题目没给总钱数，问的是要付多少。' },
      { text: '求3支钢笔平均每支多少元。', correct: false, analysis: '单价题目已经给了。' },
    ],
    tip: '“一共要付多少元”是求总价，用单价乘数量。',
  },
  {
    id: 'ma-gouwu-2',
    subject: 'math',
    category: 'ma-gouwu',
    grade: '四-六年级',
    difficulty: 2,
    stem: '超市促销：笔记本每本5元，买4本送1本。小红要买10本，最少要花多少元？',
    keywords: [
      { text: '买4本送1本', reason: '隐藏条件，决定实际付几本的钱', role: 'condition' },
      { text: '要买10本', reason: '要拿到10本', role: 'object' },
      { text: '最少', reason: '提示要按最省钱的方式算', role: 'trap' },
    ],
    options: [
      { text: '先弄清“买4送1”相当于每5本付4本的钱，再算10本要付几本的钱。', correct: true, analysis: '抓住了“买4送1”这个隐藏条件。' },
      { text: '直接用5乘10算出一共多少钱。', correct: false, analysis: '忽略了“买4送1”，没有用上促销条件。' },
      { text: '求每本笔记本便宜了多少元。', correct: false, analysis: '答非所问，题目问的是一共花多少钱。' },
      { text: '求买4本要花多少元。', correct: false, analysis: '只算了一组，题目要的是10本。' },
    ],
    tip: '“买4送1”是隐藏条件，先想清楚“付几本的钱”，再看“最少”。',
  },
  /* ---- 面积与周长 ---- */
  {
    id: 'ma-mianji-1',
    subject: 'math',
    category: 'ma-mianji',
    grade: '四-六年级',
    difficulty: 1,
    stem: '学校要在一块长12米、宽8米的长方形空地上铺草坪，每平方米草坪15元。铺满这块空地一共需要多少元？',
    keywords: [
      { text: '长12米、宽8米', reason: '求面积要用到的数据', role: 'data' },
      { text: '每平方米草坪15元', reason: '单价，用来算总钱数', role: 'data' },
      { text: '长方形', reason: '决定用长方形的面积公式', role: 'object' },
      { text: '一共需要多少元', reason: '题目要的是总费用，不是面积', role: 'target' },
    ],
    options: [
      { text: '先求长方形空地的面积，再乘每平方米的价钱，求一共要花多少钱。', correct: true, analysis: '抓住了“先求面积、再乘单价”这条主线。' },
      { text: '求这块长方形空地的周长。', correct: false, analysis: '把“面积”看成了“周长”，公式用错了。' },
      { text: '求这块空地的面积是多少平方米。', correct: false, analysis: '只做了一半——题目问的是花多少钱，不是面积。' },
      { text: '求每平方米草坪多少钱。', correct: false, analysis: '答非所问，单价题目已经给了。' },
    ],
    tip: '先问自己：题目最后一句要的是“多少钱”，还是“多少平方米”？',
  },
  {
    id: 'ma-mianji-2',
    subject: 'math',
    category: 'ma-mianji',
    grade: '四-六年级',
    difficulty: 2,
    stem: '一个长方形花坛，长比宽多3米，宽是5米。要在花坛四周围一圈栅栏，栅栏长多少米？',
    keywords: [
      { text: '长比宽多3米', reason: '长要通过这个条件算出来', role: 'condition' },
      { text: '宽是5米', reason: '已知数据', role: 'data' },
      { text: '四周围一圈栅栏', reason: '是求周长，不是面积', role: 'trap' },
    ],
    options: [
      { text: '先求出长（5加3），再求长方形的周长。', correct: true, analysis: '既算出了长，又认准了“围栅栏”是求周长。' },
      { text: '求花坛的面积是多少平方米。', correct: false, analysis: '把周长看成了面积。' },
      { text: '只求花坛的长是多少米。', correct: false, analysis: '只做了一步，题目要的是栅栏的长度。' },
      { text: '求花坛的长比宽多多少米。', correct: false, analysis: '题目已经给了“多3米”。' },
    ],
    tip: '“围一圈栅栏”是求周长；长要先用“比宽多3米”算出来。',
  },
  /* ---- 单位换算 ---- */
  {
    id: 'ma-danwei-1',
    subject: 'math',
    category: 'ma-danwei',
    grade: '四-六年级',
    difficulty: 1,
    stem: '一根绳子长2米，剪去30厘米，还剩多少厘米？',
    keywords: [
      { text: '2米', reason: '单位是米，后面问的是厘米', role: 'data' },
      { text: '剪去30厘米', reason: '要减去的是30厘米', role: 'condition' },
      { text: '还剩多少厘米', reason: '问的是厘米，先要统一单位', role: 'trap' },
    ],
    options: [
      { text: '先把2米换成200厘米，再减去30厘米，求剩下的长度。', correct: true, analysis: '注意到了单位要统一。' },
      { text: '直接用2减去30，得到答案。', correct: false, analysis: '单位没统一就相减，这是最常见的陷阱。' },
      { text: '求剪去的30厘米占整根绳子的几分之几。', correct: false, analysis: '答非所问，题目问的是还剩多少。' },
      { text: '求这根绳子一共有多少厘米。', correct: false, analysis: '题目已经说了绳子长2米，问的是剩下多少。' },
    ],
    tip: '注意单位！“还剩多少厘米”要求先统一单位再算。',
  },
  {
    id: 'ma-danwei-2',
    subject: 'math',
    category: 'ma-danwei',
    grade: '四-六年级',
    difficulty: 2,
    stem: '小华的身高是1米35厘米，他站在一个高4分米的凳子上，头顶离地面有多高？（用厘米作单位）',
    keywords: [
      { text: '1米35厘米', reason: '要化成厘米', role: 'data' },
      { text: '4分米', reason: '也要化成厘米，是易漏的换算', role: 'trap' },
      { text: '用厘米作单位', reason: '答案的单位要求', role: 'condition' },
      { text: '头顶离地面有多高', reason: '要把两段高度加起来', role: 'target' },
    ],
    options: [
      { text: '先把1米35厘米和4分米都化成厘米，再把两段高度相加。', correct: true, analysis: '两个单位都换算了，还认准了要相加。' },
      { text: '直接把1米35厘米加上4分米。', correct: false, analysis: '单位没统一就相加。' },
      { text: '求小华比凳子高多少厘米。', correct: false, analysis: '答非所问，题目问的是头顶离地面多高。' },
      { text: '只求小华的身高是多少厘米。', correct: false, analysis: '只算了一部分，漏掉了凳子的高度。' },
    ],
    tip: '出现米、分米、厘米混在一起时，先都化成题目要求的单位再计算。',
  },
  /* ---- 行程问题 ---- */
  {
    id: 'ma-xingcheng-1',
    subject: 'math',
    category: 'ma-xingcheng',
    grade: '四-六年级',
    difficulty: 1,
    stem: '一辆汽车每小时行60千米，行了3小时，一共行了多少千米？',
    keywords: [
      { text: '每小时行60千米', reason: '速度', role: 'data' },
      { text: '行了3小时', reason: '时间', role: 'data' },
      { text: '一共行了多少千米', reason: '求的是路程', role: 'target' },
    ],
    options: [
      { text: '求路程，用速度乘时间。', correct: true, analysis: '认准了“一共行了多少千米”是求路程。' },
      { text: '求这辆汽车每小时行多少千米。', correct: false, analysis: '速度题目已经给了。' },
      { text: '求行1千米需要多少小时。', correct: false, analysis: '答非所问，题目求的是路程。' },
      { text: '求这辆汽车一共行了多少小时。', correct: false, analysis: '问的是路程，不是时间。' },
    ],
    tip: '“每小时行……”是速度，“行了……小时”是时间，求路程用速度乘时间。',
  },
  {
    id: 'ma-xingcheng-2',
    subject: 'math',
    category: 'ma-xingcheng',
    grade: '四-六年级',
    difficulty: 2,
    stem: '甲、乙两地相距240千米。一辆汽车从甲地出发，每小时行80千米，行驶2小时后，离乙地还有多少千米？',
    keywords: [
      { text: '相距240千米', reason: '总路程', role: 'data' },
      { text: '每小时行80千米', reason: '速度', role: 'data' },
      { text: '行驶2小时后', reason: '已经行了2小时', role: 'condition' },
      { text: '离乙地还有多少千米', reason: '要用总路程减去已行的', role: 'target' },
    ],
    options: [
      { text: '先求2小时行的路程，再用总路程减去它。', correct: true, analysis: '认准了“还有多少”要用总路程减已行的。' },
      { text: '求这辆汽车行完全程一共要几小时。', correct: false, analysis: '答非所问，题目问的是还剩多少千米。' },
      { text: '求240千米里有几个80千米。', correct: false, analysis: '虽然算了除法，但没回答“还有多少千米”。' },
      { text: '只求这辆汽车2小时行了多少千米。', correct: false, analysis: '只做了一半，没算“还剩多少”。' },
    ],
    tip: '“离……还有多少千米”，要用总路程减去已经行的，别只算出已经行的。',
  },
  /* ---- 多步应用题 ---- */
  {
    id: 'ma-duobu-1',
    subject: 'math',
    category: 'ma-duobu',
    grade: '四-六年级',
    difficulty: 1,
    stem: '小明有25元，买一本8元的笔记本后，剩下的钱最多能买几支3元的笔？',
    keywords: [
      { text: '买一本8元的笔记本后', reason: '要先减去笔记本的钱', role: 'condition' },
      { text: '剩下的钱', reason: '用剩下的钱去买笔', role: 'data' },
      { text: '最多', reason: '提示要考虑能不能正好整除', role: 'condition' },
      { text: '几支3元的笔', reason: '要的是笔的支数', role: 'target' },
    ],
    options: [
      { text: '先减去买笔记本的钱，再用剩下的钱算最多能买几支笔。', correct: true, analysis: '两步都想到了：先减、再除。' },
      { text: '求25元一共能买几支笔。', correct: false, analysis: '漏掉了“买笔记本后”这个前提。' },
      { text: '求买完笔记本后还剩多少钱。', correct: false, analysis: '只做了一半，题目问的是能买几支笔。' },
      { text: '求买一本笔记本和一支笔一共多少钱。', correct: false, analysis: '答非所问，题目问的是笔的支数。' },
    ],
    tip: '“最多”提示要考虑能不能整除；先算“剩下的钱”是第一步。',
  },
  {
    id: 'ma-duobu-2',
    subject: 'math',
    category: 'ma-duobu',
    grade: '四-六年级',
    difficulty: 2,
    stem: '果园里有苹果树120棵，梨树的棵数比苹果树的2倍少30棵。苹果树和梨树一共有多少棵？',
    keywords: [
      { text: '120棵', reason: '苹果树的棵数', role: 'data' },
      { text: '比苹果树的2倍少30棵', reason: '要先按这个条件求出梨树', role: 'condition' },
      { text: '一共有多少棵', reason: '最后要求两种树的总数', role: 'target' },
    ],
    options: [
      { text: '先求梨树（120乘2再减30），再把苹果树和梨树相加。', correct: true, analysis: '认准了要两步：先求梨树，再求总数。' },
      { text: '只求梨树有多少棵。', correct: false, analysis: '漏掉了“一共有多少棵”。' },
      { text: '求梨树比苹果树多多少棵。', correct: false, analysis: '答非所问，题目问的是两种树的总数。' },
      { text: '只求苹果树的2倍是多少棵。', correct: false, analysis: '只做了一半，还没减30，也没求总数。' },
    ],
    tip: '“比……的2倍少30”要先算出梨树，再看最后问的是不是“一共”。',
  },

  /* ============================== 英语 ============================== */
  /* ---- 疑问词理解 ---- */
  {
    id: 'en-yiwenci-1',
    subject: 'english',
    category: 'en-yiwenci',
    grade: '四-六年级',
    difficulty: 1,
    stem: '根据对话内容，选择正确答案：Where is the library? 从文中找出关键信息作答。',
    keywords: [
      { text: 'Where', reason: '疑问词问的是地点', role: 'task' },
      { text: 'library', reason: '要回答的是图书馆', role: 'object' },
      { text: '从文中找出', reason: '答案要以短文为准', role: 'condition' },
    ],
    options: [
      { text: '找出图书馆在哪里（地点）。', correct: true, analysis: '读懂了 Where 问的是地点。' },
      { text: '找出图书馆里有哪些书。', correct: false, analysis: '看错了问题，题目问的是地点不是内容。' },
      { text: '判断图书馆离得近不近。', correct: false, analysis: '自己加戏了，题目没问远近。' },
      { text: '找出谁要去图书馆。', correct: false, analysis: '把“图书馆在哪”看成了“谁去图书馆”。' },
    ],
    tip: '疑问词 Where 问地点，答案要落在某个位置上。',
  },
  {
    id: 'en-yiwenci-2',
    subject: 'english',
    category: 'en-yiwenci',
    grade: '四-六年级',
    difficulty: 2,
    stem: '根据短文，回答问题：How many students are there in the classroom? 从文中找出关键信息作答。',
    keywords: [
      { text: 'How many', reason: '问的是数量', role: 'task' },
      { text: 'students', reason: '要回答的是学生', role: 'object' },
      { text: 'in the classroom', reason: '限定了范围：在教室里', role: 'condition' },
    ],
    options: [
      { text: '找出教室里有多少名学生（数量）。', correct: true, analysis: '读懂了 How many 问的是数量。' },
      { text: '找出教室里的学生是谁。', correct: false, analysis: 'How many 问数量，不是问“谁”。' },
      { text: '找出教室在哪里。', correct: false, analysis: '那是 Where 的问题。' },
      { text: '找出教室里有没有学生。', correct: false, analysis: '答非所问，题目问的是“多少”。' },
    ],
    tip: 'How many 问的是数量，答案要落在数字上。',
  },
  /* ---- 句型要求 ---- */
  {
    id: 'en-juxing-1',
    subject: 'english',
    category: 'en-juxing',
    grade: '四-六年级',
    difficulty: 1,
    stem: '看图，用 There be 句型写一写图中有几只猫。',
    keywords: [
      { text: '用 There be 句型', reason: '规定必须用这个句型', role: 'condition' },
      { text: '几只猫', reason: '要写的是猫的数量', role: 'target' },
    ],
    options: [
      { text: '用 There be 句型写出图中有几只猫。', correct: true, analysis: '句型和内容两个要求都读到了。' },
      { text: '用 There be 句型描述猫的颜色。', correct: false, analysis: '内容跑偏，题目要的是数量不是颜色。' },
      { text: '数一数有几只猫，用中文说出来。', correct: false, analysis: '漏掉了“用 There be 句型”这个要求。' },
      { text: '画出一只猫并涂上颜色。', correct: false, analysis: '答非所问，题目是让你写句子。' },
    ],
    tip: '题目给了两个要求：用什么句型 + 写什么，都要满足。',
  },
  {
    id: 'en-juxing-2',
    subject: 'english',
    category: 'en-juxing',
    grade: '四-六年级',
    difficulty: 2,
    stem: '用“It is time to…”的句型，写一句话提醒同学该上体育课了。',
    keywords: [
      { text: '“It is time to…”的句型', reason: '必须用这个句型', role: 'condition' },
      { text: '提醒同学该上体育课', reason: '要写的内容', role: 'object' },
    ],
    options: [
      { text: '用 It is time to… 句型写一句提醒上体育课的话。', correct: true, analysis: '句型要求和内容要求都读到了。' },
      { text: '用 It is time to… 写一句介绍自己爱好的话。', correct: false, analysis: '内容错了，题目要提醒上体育课。' },
      { text: '用中文写一句提醒上体育课的话。', correct: false, analysis: '漏掉了“用这个句型”的要求。' },
      { text: '把 It is time to… 翻译成中文。', correct: false, analysis: '答非所问，题目是让你写句子。' },
    ],
    tip: '给了句型就要用上，还要看清“写什么内容”。',
  },
  /* ---- 判断正误 ---- */
  {
    id: 'en-panduan-1',
    subject: 'english',
    category: 'en-panduan',
    grade: '四-六年级',
    difficulty: 1,
    stem: '判断正误：Tom likes apples. 根据短文内容判断，错的请改正。',
    keywords: [
      { text: '判断正误', reason: '要判断这句话对不对', role: 'task' },
      { text: '根据短文内容', reason: '以短文为准，不是凭常识', role: 'condition' },
      { text: '错的请改正', reason: '如果错了还要改正，别漏了', role: 'trap' },
    ],
    options: [
      { text: '根据短文判断这句话对不对，如果错了还要改正。', correct: true, analysis: '把“判断”和“改正”两个要求都读到了。' },
      { text: '把这句话翻译成中文。', correct: false, analysis: '答非所问，题目是判断对错。' },
      { text: '判断这句话的语法有没有错。', correct: false, analysis: '看错标准，是按短文内容判断，不是看语法。' },
      { text: '把 Tom 改成别的人名，再判断。', correct: false, analysis: '题目没让你改人名。' },
    ],
    tip: '“判断正误”以短文为准；“错的请改正”是附加要求，别忘了。',
  },
  {
    id: 'en-panduan-2',
    subject: 'english',
    category: 'en-panduan',
    grade: '四-六年级',
    difficulty: 2,
    stem: '根据短文“Lucy is twelve. She has a brother, Tom. Tom is nine.”判断句子“Tom is older than Lucy.”是否正确。',
    keywords: [
      { text: '根据短文', reason: '判断要以短文为准', role: 'condition' },
      { text: 'Tom is older than Lucy', reason: '要判断的就是这句话', role: 'object' },
      { text: '是否正确', reason: '要给出判断', role: 'task' },
    ],
    options: [
      { text: '根据短文判断这句话对不对（短文说 Tom 9 岁、Lucy 12 岁，所以这句话不对）。', correct: true, analysis: '以短文内容为准，还看清了 older 的意思。' },
      { text: '凭常识判断这句话对不对。', correct: false, analysis: '判断要以短文为准，不是凭常识。' },
      { text: '把这句话翻译成中文。', correct: false, analysis: '答非所问，题目是判断正误。' },
      { text: '判断这句话的语法对不对。', correct: false, analysis: '判断依据是短文内容，不是语法。' },
    ],
    tip: '判断正误要以短文为准，还要留意 older / younger 这类容易看反的词。',
  },
  /* ---- 词形填空 ---- */
  {
    id: 'en-cixing-1',
    subject: 'english',
    category: 'en-cixing',
    grade: '四-六年级',
    difficulty: 1,
    stem: '用括号中单词的正确形式填空：She ______ (like) apples.',
    keywords: [
      { text: '正确形式', reason: '不能照抄原词，要变形式', role: 'task' },
      { text: 'She', reason: '主语是第三人称单数，决定动词形式', role: 'data' },
      { text: '(like)', reason: '要变成正确形式的词', role: 'object' },
    ],
    options: [
      { text: '根据主语 She，把 like 变成第三人称单数形式 likes。', correct: true, analysis: '注意到了主语是 She，动词要变形式。' },
      { text: '直接把 like 填进去。', correct: false, analysis: '没变形式，She 后面要用第三人称单数。' },
      { text: '把 like 改成 liking。', correct: false, analysis: '形式用错了，这里要的是第三人称单数。' },
      { text: '把 She 改成 He 再填空。', correct: false, analysis: '题目没让改主语。' },
    ],
    tip: '填词题要看主语：She / He 后面动词要用第三人称单数。',
  },
  {
    id: 'en-cixing-2',
    subject: 'english',
    category: 'en-cixing',
    grade: '四-六年级',
    difficulty: 2,
    stem: '用括号中单词的正确形式填空：Look! The children ______ (play) football on the playground.',
    keywords: [
      { text: '正确形式', reason: '要按语境变形式', role: 'task' },
      { text: 'Look!', reason: '提示用现在进行时', role: 'trap' },
      { text: 'The children', reason: '主语是复数，be 动词要用 are', role: 'data' },
    ],
    options: [
      { text: '根据 Look! 判断用现在进行时，填 are playing。', correct: true, analysis: '既抓住了 Look! 的提示，又注意了主语是复数。' },
      { text: '直接填 play。', correct: false, analysis: '没考虑时态，Look! 提示要用现在进行时。' },
      { text: '填 is playing。', correct: false, analysis: '主语是复数 children，be 动词应该用 are。' },
      { text: '填 played。', correct: false, analysis: '时态错了，Look! 提示的是正在发生。' },
    ],
    tip: '看到 Look!、Now! 这类词，往往要用现在进行时；还要注意主语的单复数。',
  },
  /* ---- 对话交际 ---- */
  {
    id: 'en-duihua-1',
    subject: 'english',
    category: 'en-duihua',
    grade: '四-六年级',
    difficulty: 1,
    stem: '选择恰当的应答：—Thank you very much! —______',
    keywords: [
      { text: 'Thank you very much', reason: '对方在道谢', role: 'object' },
      { text: '选择恰当的应答', reason: '要选出合适的回应', role: 'task' },
    ],
    options: [
      { text: '选出对“Thank you”的恰当回应，如 You are welcome。', correct: true, analysis: '认准了这是在回应道谢。' },
      { text: '再向对方说一遍 Thank you。', correct: false, analysis: '应答不当，对方道谢时不该重复道谢。' },
      { text: '把 Thank you 翻译成中文。', correct: false, analysis: '答非所问，题目是选应答。' },
      { text: '问对方为什么说谢谢。', correct: false, analysis: '这不是恰当的应答。' },
    ],
    tip: '交际题要选“符合情境”的应答，不能只挑认识的句子。',
  },
  {
    id: 'en-duihua-2',
    subject: 'english',
    category: 'en-duihua',
    grade: '四-六年级',
    difficulty: 2,
    stem: '补全对话：—Would you like some tea? —No, thanks. ______',
    keywords: [
      { text: 'Would you like some tea', reason: '对方在询问要不要茶', role: 'object' },
      { text: 'No, thanks', reason: '已经礼貌拒绝，下一句要顺着这个意思', role: 'condition' },
      { text: '补全对话', reason: '要顺着上文补一句', role: 'task' },
    ],
    options: [
      { text: '顺着“No, thanks”礼貌地说明不要茶，或改要别的东西。', correct: true, analysis: '抓住了“No, thanks”这个已经拒绝的前提。' },
      { text: '回答 Yes, please。', correct: false, analysis: '和前面的“No”自相矛盾。' },
      { text: '把 Would you like some tea 翻译成中文。', correct: false, analysis: '答非所问，题目是补全对话。' },
      { text: '问对方“茶”用英语怎么说。', correct: false, analysis: '这不是补全对话。' },
    ],
    tip: '补全对话要顺着上一句的语气和意思，注意 Yes / No 别自相矛盾。',
  },
]

export function bankBySubject(subject: Subject): Question[] {
  return BANK.filter((q) => q.subject === subject)
}

/** 洗牌，避免短时间内重复同一题 */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
