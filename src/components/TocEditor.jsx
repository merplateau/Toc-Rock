import { useCallback } from 'react'
import { motion, Reorder } from 'framer-motion'
import './TocEditor.css'

function TocEditor({ items, onChange }) {
    const handleItemChange = useCallback((index, field, value) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        onChange(newItems)
    }, [items, onChange])

    const handleRemove = useCallback((index) => {
        const newItems = items.filter((_, i) => i !== index)
        onChange(newItems)
    }, [items, onChange])

    const handleAdd = useCallback(() => {
        onChange([...items, { title: '新条目', page: 1, level: 1 }])
    }, [items, onChange])

    if (items.length === 0) {
        return (
            <div className="toc-editor-empty">
                <p>暂无目录条目</p>
                <button className="btn btn-secondary" onClick={handleAdd}>
                    添加条目
                </button>
            </div>
        )
    }

    return (
        <div className="toc-editor">
            <div className="toc-editor-header">
                <span className="toc-col-title">标题</span>
                <span className="toc-col-page">页码</span>
                <span className="toc-col-level">层级</span>
                <span className="toc-col-action"></span>
            </div>

            <Reorder.Group
                axis="y"
                values={items}
                onReorder={onChange}
                className="toc-editor-list"
            >
                {items.map((item, index) => (
                    <Reorder.Item
                        key={`${item.title}-${index}`}
                        value={item}
                        className="toc-editor-item"
                    >
                        <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                            className="toc-input-title"
                            style={{ paddingLeft: `${(item.level - 1) * 16 + 8}px` }}
                        />
                        <input
                            type="number"
                            min={1}
                            value={item.page}
                            onChange={(e) => handleItemChange(index, 'page', parseInt(e.target.value) || 1)}
                            className="toc-input-page"
                        />
                        <input
                            type="number"
                            min={1}
                            max={6}
                            value={item.level}
                            onChange={(e) => handleItemChange(index, 'level', Math.max(1, parseInt(e.target.value) || 1))}
                            className="toc-input-level"
                        />
                        <button
                            className="btn btn-ghost toc-btn-remove"
                            onClick={() => handleRemove(index)}
                        >
                            ×
                        </button>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <button className="btn btn-secondary toc-btn-add" onClick={handleAdd}>
                + 添加条目
            </button>
        </div>
    )
}

export default TocEditor
