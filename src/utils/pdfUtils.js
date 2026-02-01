import { PDFDocument, PDFName, PDFString, PDFNumber, PDFNull } from 'pdf-lib'

/**
 * 分割 PDF
 */
export async function splitPdf(pdfFile, startPage, endPage) {
    const pdfBytes = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const newPdfDoc = await PDFDocument.create()

    // 获取需要复制的页码索引 (0-based)
    const pageIndices = []
    for (let i = startPage; i <= endPage; i++) {
        pageIndices.push(i - 1)
    }

    // 复制页面
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices)
    copiedPages.forEach(page => newPdfDoc.addPage(page))

    // 保存新文档
    const savedPdfBytes = await newPdfDoc.save()
    return savedPdfBytes
}

/**
 * 将 PDF 页面渲染为图片
 */
export async function renderPagesToImages(pdfDoc, startPage, endPage) {
    const images = []
    const baseScale = 1.2
    const minScale = 0.6
    const minQuality = 0.35
    const maxBytes = 9.5 * 1024 * 1024

    for (let i = startPage; i <= endPage; i++) {
        const page = await pdfDoc.getPage(i)
        let scale = baseScale
        let quality = 0.6
        let dataUrl = ''

        while (true) {
            const viewport = page.getViewport({ scale })
            const canvas = document.createElement('canvas')
            canvas.width = viewport.width
            canvas.height = viewport.height
            const ctx = canvas.getContext('2d')

            await page.render({ canvasContext: ctx, viewport }).promise
            dataUrl = canvas.toDataURL('image/jpeg', quality)

            const byteLength = Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75)

            if (byteLength <= maxBytes || (scale <= minScale && quality <= minQuality)) {
                // 清理 canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                canvas.width = 0
                canvas.height = 0
                break
            }

            if (quality > minQuality) {
                quality -= 0.1
            } else if (scale > minScale) {
                scale = Math.max(minScale, scale - 0.2)
                quality = 0.6
            } else {
                break
            }
        }

        images.push(dataUrl)
    }

    return images
}

/**
 * 写入 PDF 目录
 */
export async function writeTocToPdf(pdfFile, tocItems, offset = 0) {
    const pdfBytes = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const pdfNull = PDFNull || null

    // 应用偏移量并过滤无效条目
    const cleanItems = tocItems
        .map(item => ({
            title: item.title,
            page: item.page + offset,
            level: Math.max(1, parseInt(item.level, 10) || 1)
        }))
        .filter(item => item.page >= 1 && item.page <= pages.length)

    if (!cleanItems.length) {
        throw new Error('目录条目无效或超出页码范围')
    }

    // 构建目录树
    const root = { children: [], level: 0 }
    const stack = [root]

    cleanItems.forEach(item => {
        let level = Math.max(1, parseInt(item.level, 10) || 1)
        if (level > stack.length) {
            level = stack.length
        }
        while (stack.length > level) {
            stack.pop()
        }
        const node = {
            title: item.title,
            page: item.page,
            level,
            children: [],
            parent: stack[stack.length - 1]
        }
        node.parent.children.push(node)
        stack[level] = node
    })

    // 收集所有节点
    const allNodes = []
    function collectNodes(nodes) {
        nodes.forEach(node => {
            allNodes.push(node)
            if (node.children.length) {
                collectNodes(node.children)
            }
        })
    }
    collectNodes(root.children)

    // 创建目录条目
    allNodes.forEach(node => {
        const page = pages[node.page - 1]
        const dest = pdfDoc.context.obj([
            page.ref,
            PDFName.of('XYZ'),
            0,
            page.getHeight(),
            pdfNull
        ])
        const dict = pdfDoc.context.obj({
            Title: PDFString.of(node.title),
            Dest: dest
        })
        node.dict = dict
        node.ref = pdfDoc.context.register(dict)
    })

    // 链接兄弟节点
    function linkSiblings(nodes) {
        nodes.forEach((node, index) => {
            node.prev = index > 0 ? nodes[index - 1] : null
            node.next = index < nodes.length - 1 ? nodes[index + 1] : null
            if (node.children.length) {
                linkSiblings(node.children)
            }
        })
    }
    linkSiblings(root.children)

    // 计算后代数量
    function countDescendants(node) {
        let count = 0
        node.children.forEach(child => {
            count += 1 + countDescendants(child)
        })
        node.descCount = count
        return count
    }
    root.children.forEach(node => countDescendants(node))

    // 创建 Outlines 对象
    const outlineDict = pdfDoc.context.obj({ Type: PDFName.of('Outlines') })
    const outlineRef = pdfDoc.context.register(outlineDict)
    pdfDoc.catalog.set(PDFName.of('Outlines'), outlineRef)

    if (root.children.length) {
        outlineDict.set(PDFName.of('First'), root.children[0].ref)
        outlineDict.set(PDFName.of('Last'), root.children[root.children.length - 1].ref)
        outlineDict.set(PDFName.of('Count'), PDFNumber.of(allNodes.length))
    }

    // 设置每个节点的链接
    allNodes.forEach(node => {
        const dict = node.dict
        dict.set(PDFName.of('Parent'), node.parent === root ? outlineRef : node.parent.ref)
        if (node.prev) {
            dict.set(PDFName.of('Prev'), node.prev.ref)
        }
        if (node.next) {
            dict.set(PDFName.of('Next'), node.next.ref)
        }
        if (node.children.length) {
            dict.set(PDFName.of('First'), node.children[0].ref)
            dict.set(PDFName.of('Last'), node.children[node.children.length - 1].ref)
            dict.set(PDFName.of('Count'), PDFNumber.of(node.descCount))
        }
    })

    const savedPdfBytes = await pdfDoc.save()
    return savedPdfBytes
}

/**
 * 下载文件
 */
export function downloadBlob(data, filename, mimeType = 'application/pdf') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // 清理
    setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }, 100)
}
