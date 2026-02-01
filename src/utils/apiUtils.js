/**
 * 调用视觉模型 API
 */
export async function callVisionModel({ endpoint, apiKey, model, prompt, images }) {
    const content = []

    images.forEach(url => {
        content.push({ type: 'input_image', image_url: url })
    })
    content.push({ type: 'input_text', text: prompt })

    const body = {
        model,
        input: [
            {
                role: 'user',
                content
            }
        ]
    }

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`API 请求失败: ${res.status} ${text}`)
    }

    const data = await res.json()
    const contentText = extractTextFromResponse(data)

    if (!contentText) {
        console.warn('Empty model response payload:', data)
        throw new Error('模型返回为空')
    }

    return contentText.trim()
}

/**
 * 从响应中提取文本
 */
function extractTextFromResponse(data) {
    if (!data) return ''

    if (typeof data.output_text === 'string') return data.output_text
    if (data.output_text && typeof data.output_text.text === 'string') return data.output_text.text
    if (typeof data.text === 'string') return data.text

    if (data.output && Array.isArray(data.output)) {
        const parts = []
        data.output.forEach(item => {
            if (item && item.content && Array.isArray(item.content)) {
                item.content.forEach(contentItem => {
                    if (!contentItem) return
                    if (typeof contentItem.text === 'string') {
                        parts.push(contentItem.text)
                    } else if (contentItem.text && typeof contentItem.text.value === 'string') {
                        parts.push(contentItem.text.value)
                    } else if (typeof contentItem.value === 'string') {
                        parts.push(contentItem.value)
                    }
                })
            }
        })
        if (parts.length) {
            return parts.join('')
        }
    }

    if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content
    }

    return ''
}
