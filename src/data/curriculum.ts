import type { Category, Subject } from '../types'

/**
 * 题型体系 —— 专项训练按此分类。
 * 每个学科 5 个题型，覆盖小学四到六年级读题中常见的"题干要求类型"。
 */
export const CATEGORIES: Category[] = [
  /* ---------------------------- 语文 ---------------------------- */
  { id: 'zh-gaikuo', subject: 'chinese', name: '概括题', desc: '概括段意、主要内容、中心思想' },
  { id: 'zh-ciju', subject: 'chinese', name: '词句理解', desc: '理解词句的意思、体会含义' },
  { id: 'zh-shangxi', subject: 'chinese', name: '赏析题', desc: '品析修辞、写法、用词的好处' },
  { id: 'zh-xieju', subject: 'chinese', name: '按要求写句子', desc: '仿写、造句、句式变换' },
  { id: 'zh-gushi', subject: 'chinese', name: '古诗文', desc: '理解诗句、文言词句的意思' },

  /* ---------------------------- 数学 ---------------------------- */
  { id: 'ma-gouwu', subject: 'math', name: '购物问题', desc: '单价 × 数量，含优惠促销' },
  { id: 'ma-mianji', subject: 'math', name: '面积与周长', desc: '长方形、正方形的面积与周长' },
  { id: 'ma-danwei', subject: 'math', name: '单位换算', desc: '长度、质量、时间等单位的统一' },
  { id: 'ma-xingcheng', subject: 'math', name: '行程问题', desc: '速度、时间、路程的关系' },
  { id: 'ma-duobu', subject: 'math', name: '多步应用题', desc: '含"剩下""最多"等条件的多步题' },

  /* ---------------------------- 英语 ---------------------------- */
  { id: 'en-yiwenci', subject: 'english', name: '疑问词理解', desc: 'Where / What / Who / How many…' },
  { id: 'en-juxing', subject: 'english', name: '句型要求', desc: '用指定句型写句子' },
  { id: 'en-panduan', subject: 'english', name: '判断正误', desc: '按短文判断对错、改错' },
  { id: 'en-cixing', subject: 'english', name: '词形填空', desc: '用单词的正确形式填空' },
  { id: 'en-duihua', subject: 'english', name: '对话交际', desc: '选择应答、补全对话' },
]

export function categoriesBySubject(subject: Subject): Category[] {
  return CATEGORIES.filter((c) => c.subject === subject)
}

export function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? '综合'
}
