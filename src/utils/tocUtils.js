/**
 * 生成目录识别提示词
 */
export function buildTocPrompt(startPage, endPage) {
    return [
        '你是一个PDF目录识别器。',
        `下面图片是PDF的目录页，范围为第 ${startPage} 页到第 ${endPage} 页。`,
        '请识别目录条目，并返回严格的 JSON：',
        '{',
        '  "items": [',
        '    {"title": "章节标题", "page": 1, "level": 1},',
        '    {"title": "小节标题", "page": 2, "level": 2}',
        '  ]',
        '}',
        '规则：',
        '- page 为目录上标注的印刷页码（从 1 开始）。',
        '- level 表示层级：1 为一级章节，2 为二级，依此类推。',
        '- 仅输出 JSON，不要包裹在代码块中，不要额外解释。',
        '- 如遇到断行或省略号，请合并为完整标题。',
    ].join('\n')
}

/**
 * 解析 TOC JSON
 */
export function parseTocJson(text) {
    let jsonText = text
    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    const firstBracket = text.indexOf('[')
    const lastBracket = text.lastIndexOf(']')

    if (firstBracket !== -1 && lastBracket !== -1) {
        jsonText = text.slice(firstBracket, lastBracket + 1)
    } else if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = text.slice(firstBrace, lastBrace + 1)
    }

    const data = JSON.parse(jsonText)
    let items = []

    if (Array.isArray(data)) {
        items = data
    } else if (data.items && Array.isArray(data.items)) {
        items = data.items
    } else {
        throw new Error('JSON 格式不正确，缺少 items 数组')
    }

    const normalized = items
        .map(item => ({
            title: String(item.title || '').trim(),
            page: parseInt(item.page, 10) || 1,
            level: Math.max(1, parseInt(item.level, 10) || 1)
        }))
        .filter(item => item.title)

    return { items: normalized }
}

/**
 * TOC 条目转 JSON 字符串
 */
export function tocItemsToJson(items) {
    return JSON.stringify({ items }, null, 2)
}
