import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

export function rehypeLink() {
  return (tree) => {
    visit(tree, { tagName: 'a' }, (node, index, parent) => {
      const href = node.properties.href
      // 確保內部鏈接使用 HTTPS
      if (href.startsWith('http://seasoning.dev')) {
        node.properties.href = href.replace('http://', 'https://')
      }

      const isExternal = href.startsWith('http')
      if (isExternal) {
        node.properties = {
          ...node.properties,
          rel: 'noopener noreferrer',
          target: '_blank',
        }
        parent.children[index] = node
        const icon = h('i', { class: 'iconfont icon-external-link' })
        parent.children.splice(index + 1, 0, icon)
      }
    })
  }
}
