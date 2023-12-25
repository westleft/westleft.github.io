import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: '調味生活',
  description: '你需要的佐料都在這裡。',
  head: [
    ['link', { rel: "icon", type: "image/png", sizes: "16x16", href: "https://raw.githubusercontent.com/westleft/westleft.github.io/main/assets/images/logo.png"}],
    ['script', {src: 'https://www.googletagmanager.com/gtag/js?id=G-PHMQXMVT1T'}],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'https://raw.githubusercontent.com/westleft/westleft.github.io/main/assets/images/logo.png',

    nav: [
      { text: '所有文章', link: '/posts/' },
      { text: '關於作者', link: '/posts/about/author' },
    ],

    sidebar: [
      {
        text: '文章列表',
        items: [
          {
            text: '🚀 前端',
            items: [
              {
                text: 'JavaScript',
                collapsed: true,
                items: [
                  { text: 'Promise', link: '/posts/frontend/javascript/promise' },
                  { text: '聊天室增加超連結', link: '/posts/frontend/javascript/auto_link' },
                ]
              },
              {
                text: 'TypeScript',
                collapsed: true,
                items: [
                  { text: '練習 TS 中的 class', link: '/posts/frontend/typescript/class' },
                ]
              },{
                text: 'Vue',
                collapsed: true,
                items: [
                ]
              }
            ]
          },{
            text: '🚁 區塊鏈',
            items: [
              {
                text: 'Solidity',
                collapsed: true,
                items: [
                  { text: '在 Hardhat 中測試 UUPS 合約', link: '/posts/blockchain/solidity/uups' },
                ]
              },{
                text: 'GameFi',
                collapsed: true,
                items: [
                  { text: 'Wild Cash 遊玩心得', link: '/posts/blockchain/gamefi/wild_cash' },
                ]
              }
            ]
          },{
            text: '🛸 學習筆記',
            collapsed: true,
            items: [
              { text: 'Linux 筆記', link: 'posts/other/linux' }              
            ]
          },{
            text: '🪂 廢文',
            collapsed: true,
            items: [
              { text: '內向的我', link: 'posts/shit/introvert' }
            ]
          }
        ]
      }
    ],

    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    // ]
  }
})
